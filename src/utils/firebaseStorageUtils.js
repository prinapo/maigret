import { ref } from "firebase/storage";
import {
  getBlob,
  uploadBytes,
  uploadString,
  deleteObject,
  getStorage,
} from "firebase/storage";
import { fireStoreUrl } from "boot/firebase";
import { Platform } from "quasar";

export const moveStorageObject = async (fromPath, toPath) => {
  const storage = getStorage();

  const sourceRef = ref(storage, fromPath);
  const targetRef = ref(storage, toPath);

  // Add timeout for mobile platforms to prevent hanging
  const timeoutMs = Platform.is.mobile ? 15000 : 30000; // 15s on mobile, 30s on desktop

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout moving ${fromPath} to ${toPath}`)),
        timeoutMs,
      );
    });

    const movePromise = async () => {
      const blob = await getBlob(sourceRef);
      await uploadBytes(targetRef, blob);
      await deleteObject(sourceRef);
    };

    await Promise.race([movePromise(), timeoutPromise]);
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      // Logga e continua, non è un errore bloccante
      console.warn(`File non trovato per spostamento: ${fromPath}`);
      return;
    }
    // On mobile, log but don't throw timeout errors to prevent blocking deletion
    if (Platform.is.mobile && error.message.includes("Timeout")) {
      console.warn(
        `Storage move timeout on mobile for ${fromPath}, continuing with deletion`,
      );
      return;
    }
    console.error(`Failed to move ${fromPath} to ${toPath}`, error);
    throw error;
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

/**
 * Upload image blob to Firebase Storage using base64 encoding
 * @param {Blob} blob - The image blob to upload
 * @param {string} path - The storage path
 * @param {string} contentType - The content type (e.g., "image/jpeg")
 * @returns {Promise<void>}
 */
export const uploadImageToStorage = async (blob, path, contentType) => {
  const storage = getStorage();
  const storageReference = ref(storage, path);
  const base64data = await blobToBase64(blob);
  await uploadString(storageReference, base64data, "base64", {
    contentType: contentType,
  });
};

/**
 * Convert blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} Base64 string without data URL prefix
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
