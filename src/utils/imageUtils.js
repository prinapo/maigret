import { storage } from "boot/firebase";
import { ref as storageRef, uploadString } from "firebase/storage";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import short from "short-uuid";
import {
  showNotifyPositive,
  showNotifyNegative,
  showNotifyUndo,
} from "utils/notify";
import {
  moveStorageObject,
  generateThumbnail,
} from "utils/firebaseStorageUtils";
import { useUndoStore } from "stores/undoStore";
import { useCoversStore } from "stores/coversStore";
import { updateDocInCollection } from "./firebaseDatabaseUtils";
import {
  sanitizeBookForFirebase,
  moveImageToTrashAndLogUndo,
} from "./firebaseDatabaseUtils";

const shortUuidGenerator = short();

const notifyError = (message) => {
  showNotifyNegative(message);
};

// At the top of the file
export const deleteImage = async (bookId, imageIndex, t) => {
  const bibliografiaStore = useBibliografiaStore();
  const undoStore = useUndoStore();
  // prendi il libro da Pinia (se non c'è bookId, puoi anche usarlo da store)
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

    showNotifyUndo(t("bookImages.imageDeleted"), t("common.undo"), async () => {
      await undoStore.undoLastOperation();
      showNotifyPositive(t("bookImages.imageRestored"));
    });
  } catch (error) {
    console.error("Errore cancellazione immagine:", error);
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
      coverTypeId: "Unknown",
    };

    const updatedBook = {
      ...book,
      images: [...(book.images || []), defaultImage],
    };

    // ✅ Sincronizza il libro aggiornato ovunque
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase(updatedBook),
      { includeTimestamp: true },
    );

    return updatedBook.images;
  } catch (error) {
    console.error("Errore aggiungendo nuova immagine:", error);
    notifyError("Errore aggiungendo immagine");
    throw error;
  }
};

// Funzione per generare la thumbnail localmente da un oggetto Image
const generateThumbnailLocal = (img, contentType = "image/jpeg") => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const width = 300;
    const height = (width / img.width) * img.height;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob((blob) => resolve(blob), contentType, 0.8);
  });
};

export const convertAndUploadImage = async (file, bookId, innerIndex) => {
  const bibliografiaStore = useBibliografiaStore();

  try {
    const book = bibliografiaStore.bibliografia.find((b) => b.id === bookId);
    if (!book) throw new Error("Libro non trovato nello store");

    if (!book.images) book.images = [];
    const oldImage = book.images[innerIndex];
    const reader = new FileReader();

    // Lettura file come dataURL
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Errore nel leggere il file"));
      reader.readAsDataURL(file);
    });
    const img = new window.Image();
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

    // Genera e carica la thumbnail localmente
    const thumbnailBlob = await generateThumbnailLocal(img, contentType);
    if (thumbnailBlob) {
      const thumbnailPath = `thumbnails/${newFileName}`;
      await uploadImageToStorage(thumbnailBlob, thumbnailPath, contentType);
    }

    const updatedImages = [...book.images];
    updatedImages[innerIndex] = {
      ...updatedImages[innerIndex],
      id: imageUuid,
    };

    const updatedBook = { ...book, images: updatedImages };
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase(updatedBook),
      { includeTimestamp: true },
    );

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
