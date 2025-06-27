import { ref } from "firebase/storage";
import {
  getBlob,
  uploadBytes,
  deleteObject,
  getStorage,
} from "firebase/storage";
import { fireStoreUrl } from "boot/firebase";

export const moveStorageObject = async (fromPath, toPath) => {
  const storage = getStorage();

  const sourceRef = ref(storage, fromPath);
  const targetRef = ref(storage, toPath);

  try {
    const blob = await getBlob(sourceRef);
    await uploadBytes(targetRef, blob);
    await deleteObject(sourceRef);
  } catch (error) {
    console.error(`Failed to move ${fromPath} to ${toPath}`, error);
    throw error;
  }
};
export const generateThumbnail = async (imageName) => {
  if (imageName === "placeholder.jpg") return null;

  try {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    const imageUrl = `${fireStoreUrl}${encodeURIComponent(imageName)}?alt=media`;

    const blob = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Image load timeout"));
      }, 30000);

      img.onload = () => {
        clearTimeout(timeoutId);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const width = 300;
        const height = (width / img.width) * img.height;

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob from canvas"));
            }
          },
          "image/jpeg",
          0.8,
        );
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${imageName}`));
      };

      img.src = imageUrl;
    });

    return blob;
  } catch (error) {
    console.warn(`Thumbnail generation failed for ${imageName}:`, error);
    return null;
  }
};
export const deleteTrashStorageImage = async (fileName) => {
  if (!fileName) throw new Error("File name is required");

  // Se è il placeholder, non fare nulla
  if (fileName === "placeholder.jpg") return;

  const storage = getStorage();
  const trashRef = ref(storage, `trash/${fileName}`);
  const thumbnailRef = ref(storage, `trash-thumbnails/${fileName}`);

  const tryDelete = async (ref) => {
    try {
      await deleteObject(ref);
    } catch (error) {
      if (error.code === "storage/object-not-found") {
        // File non trovato, ignoro l'errore
        console.warn(`File non trovato per cancellazione: ${ref.fullPath}`);
      } else {
        throw error;
      }
    }
  };

  try {
    await Promise.all([tryDelete(trashRef), tryDelete(thumbnailRef)]);
  } catch (error) {
    console.error(`Error deleting storage files for ${fileName}`, error);
    throw error;
  }
};

/**
 * Sposta immagine e thumbnail dalla trash a images e thumbnails.
 * @param {string} fileName - Il nome del file da ripristinare.
 * @returns {Promise<void>}
 */
export const restoreTrashStorageImage = async (fileName) => {
  if (!fileName || fileName === "placeholder.jpg") {
    throw new Error("File name is invalid or cannot restore placeholder.");
  }

  const storage = getStorage();

  const fromImageRef = ref(storage, `trash/${fileName}`);
  const toImageRef = ref(storage, `images/${fileName}`);

  const fromThumbRef = ref(storage, `trash-thumbnails/${fileName}`);
  const toThumbRef = ref(storage, `thumbnails/${fileName}`);

  try {
    const [imageBlob, thumbBlob] = await Promise.all([
      getBlob(fromImageRef),
      getBlob(fromThumbRef),
    ]);

    await Promise.all([
      uploadBytes(toImageRef, imageBlob),
      uploadBytes(toThumbRef, thumbBlob),
    ]);

    await Promise.all([deleteObject(fromImageRef), deleteObject(fromThumbRef)]);
  } catch (error) {
    console.error(`Errore nel ripristinare i file ${fileName} da trash`, error);
    throw error;
  }
};
