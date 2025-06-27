import { storage, fireStoreTrashTmblUrl } from "../boot/firebase";
import { ref as storageRef, uploadString } from "firebase/storage";
import { useBibliografiaStore } from "../stores/bibliografiaStore";
import short from "short-uuid";
import { Notify } from "quasar";
import {
  syncBook,
  moveImageToTrashAndLogUndo,
  deleteTrashEntry,
} from "./firebaseDatabaseUtils";
import { moveStorageObject, generateThumbnail } from "./firebaseStorageUtils";
import { useUndoStore } from "../stores/undoStore"; // path relativo al tuo store
import { useCoversStore } from "../stores/coversStore";

const bookCoverTypeId = "qNvdwFMLNt2Uz7JjqTjacu";

const shortUuidGenerator = short();

const notifySuccess = (message) => {
  Notify.create({ message, type: "positive", color: "green" });
};

const notifyError = (message) => {
  Notify.create({ message, type: "negative", color: "red" });
};

// At the top of the file
export const deleteImage = async (bookId, imageIndex) => {
  const bibliografiaStore = useBibliografiaStore();
  const undoStore = useUndoStore();
  // prendi il libro da Pinia (se non c’è bookId, puoi anche usarlo da store)
  const book = bibliografiaStore.bibliografia.find((b) => b.id === bookId);
  if (!book) throw new Error("Libro non trovato");

  const imageToDelete = book.images[imageIndex];
  if (!imageToDelete) throw new Error("Immagine non trovata");

  try {
    const undoData = await moveImageToTrashAndLogUndo(
      bookId,
      imageToDelete,
      imageIndex,
      book,
    );

    undoStore.setLastUndo(undoData);

    Notify.create({
      html: true,
      position: "bottom",
      timeout: 5000, // si chiude automaticamente dopo 5 secondi
      color: "primary",
      message: `
        <div style="display:flex;align-items:center">
          <img
            src="${fireStoreTrashTmblUrl + encodeURIComponent(imageToDelete.name)}?alt=media"
            style="width:32px;height:64px;margin-right:8px;object-fit:contain"
          />
          <span>Immagine cancellata:
            <strong>${imageToDelete.name}</strong>
            (<em>${imageToDelete.coverType}</em>)
          </span>
        </div>
      `,
      actions: [
        {
          label: "Undo",
          color: "white",
          handler: async () => {
            try {
              const { trashEntryId } = undoData;
              await undoStore.undoLastOperation();

              if (trashEntryId) {
                await deleteTrashEntry(trashEntryId);
                // Aggiorna la UI se serve
              }
            } catch (err) {
              console.error("Errore undo:", err);
              Notify.create({ type: "negative", message: "Undo fallito" });
            }
          },
        },
      ],
    });
  } catch (error) {
    console.error("Errore cancellazione immagine:", error);
    throw error;
  }
};

export const saveImageDetail = async (bookId, coverTypeId, index) => {
  const bibliografiaStore = useBibliografiaStore();
  const coversStore = useCoversStore();

  if (!bookId || !coverTypeId || index === undefined) {
    throw new Error("Missing required parameters");
  }

  try {
    const coverExists = coversStore.covers.some(
      (cover) => cover.value === coverTypeId,
    );
    if (!coverExists) {
      throw new Error("Invalid cover type");
    }

    const book = bibliografiaStore.bibliografia.find((b) => b.id === bookId);

    if (!book) {
      throw new Error("Book not found");
    }

    const imagesArray = book.images || [];
    if (index < 0 || index >= imagesArray.length) {
      throw new Error("Invalid image index");
    }

    imagesArray[index].coverTypeId = coverTypeId;

    const updatedBook = {
      ...book,
      images: imagesArray,
    };

    // ✅ Sincronizza il libro aggiornato
    await syncBook({ bookId, book: updatedBook });

    notifySuccess("Cover type updated successfully");
  } catch (error) {
    console.error("Error updating cover type:", error);
    notifyError(`Failed to update cover type: ${error.message}`);
    throw error;
  }
};

export const addImage = async (bookId) => {
  const bibliografiaStore = useBibliografiaStore();

  try {
    const book = bibliografiaStore.bibliografia.find((b) => b.id === bookId);

    if (!book) {
      console.error("Libro non trovato nello store!");
      notifyError("Libro non trovato");
      return [];
    }

    const shortUuid = shortUuidGenerator.new();
    const defaultImage = {
      id: shortUuid,
      name: `placeholder.jpg`,
      coverTypeId: "Unknown",
      timestamp: new Date().valueOf(),
    };

    const updatedBook = {
      ...book,
      images: [...(book.images || []), defaultImage],
    };

    // ✅ Sincronizza il libro aggiornato ovunque
    await syncBook({ bookId, book: updatedBook });

    return updatedBook.images;
  } catch (error) {
    console.error("Errore aggiungendo nuova immagine:", error);
    notifyError("Errore aggiungendo immagine");
    throw error;
  }
};

export const fetchImages = async (bookId) => {
  const coversStore = useCoversStore();
  const bibliografiaStore = useBibliografiaStore();

  try {
    // Usa lo store Pinia invece di accedere direttamente a Firestore
    const book = bibliografiaStore.bibliografia.find((b) => b.id === bookId);

    if (!book) {
      console.error("Book not found in store!");
      return [];
    }

    const images = book.images || [];
    const covers = coversStore.covers;

    // Add coverType to each image based on the id
    const imagesWithCoverType = images.map((image) => {
      const cover = covers.find((cover) => cover.id === image.coverTypeId);
      return {
        ...image,
        coverType: cover ? cover.label : "Unknown",
      };
    });

    return imagesWithCoverType;
  } catch (error) {
    console.error("Error fetching images:", error);
    throw error;
  }
};

export const convertAndUploadImage = async (file, bookId, innerIndex) => {
  const bibliografiaStore = useBibliografiaStore();

  try {
    const book = bibliografiaStore.bibliografia.find((b) => b.id === bookId);
    if (!book) throw new Error("Libro non trovato nello store");

    const oldImage = book.images?.[innerIndex];
    console.log("Old image", oldImage);
    const reader = new FileReader();

    // Lettura file come dataURL
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Errore nel leggere il file"));
      reader.readAsDataURL(file);
    });
    const img = new Image();
    // Attendi il caricamento dell'immagine
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Errore caricando l'immagine"));
      img.src = dataUrl;
    });

    // Sposta vecchie immagini se non placeholder
    if (oldImage && oldImage.name && oldImage.name !== "placeholder.jpg") {
      await moveStorageObject(
        `images/${oldImage.name}`,
        `trash/${oldImage.name}`,
      );
      await moveStorageObject(
        `thumbnails/${oldImage.name}`,
        `trash-thumbnails/${oldImage.name}`,
      );
    }

    const imageUuid = shortUuidGenerator.new();
    const newFileName = `${imageUuid}.jpg`;
    const contentType = "image/jpeg";

    // Crea blob immagine principale e caricala
    const mainImageBlob = await createImageBlob(img, "main", contentType);
    await uploadImageToStorage(
      mainImageBlob,
      `images/${newFileName}`,
      contentType,
    );

    // Genera e carica il thumbnail (assumo che questa funzione lo faccia)
    const thumbnailBlob = await generateThumbnail(newFileName);
    if (thumbnailBlob) {
      const thumbnailPath = `thumbnails/${newFileName}`;
      await uploadImageToStorage(thumbnailBlob, thumbnailPath, "image/jpeg");
    }

    const updatedImages = [...book.images];
    updatedImages[innerIndex] = {
      ...updatedImages[innerIndex],
      id: imageUuid,
      name: newFileName,
      timestamp: new Date().valueOf(),
    };

    const updatedBook = { ...book, images: updatedImages };
    await syncBook({ bookId, book: updatedBook });

    return updatedImages;
  } catch (error) {
    console.error("Errore generale in convertAndUploadImageAndSync:", error);
    throw error;
  }
};

// Aggiorna questa funzione per accettare il contentType
const createImageBlob = (img, type, contentType) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let width = img.width;
    let height = img.height;

    if (type === "thumbnail") {
      const MAX_SIZE = 300;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
    } else {
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const widthRatio = MAX_WIDTH / width;
        const heightRatio = MAX_HEIGHT / height;
        const ratio = Math.min(widthRatio, heightRatio);
        width *= ratio;
        height *= ratio;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => resolve(blob),
      contentType,
      type === "thumbnail" ? 0.8 : 0.9, // puoi anche mettere 0.8 fisso
    );
  });
};

// Aggiorna questa funzione per accettare il contentType
const uploadImageToStorage = async (blob, path, contentType) => {
  const storageReference = storageRef(storage, path);
  const base64data = await blobToBase64(blob);
  await uploadString(storageReference, base64data, "base64", {
    contentType: contentType,
  });
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
