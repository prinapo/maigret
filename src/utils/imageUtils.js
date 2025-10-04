import { useBibliografiaStore } from "stores/bibliografiaStore";
import { storeToRefs } from "pinia";
import short from "short-uuid";
import {
  showNotifyPositive,
  showNotifyNegative,
  showNotifyUndo,
} from "src/utils/notify";
import {
  moveStorageObject,
  uploadImageToStorage,
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
  // Use the safe finder that handles Vue 3 Proxy objects
  const book = findBookInStore(bibliografiaStore.bibliografia, bookId);
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
    const book = findBookInStore(bibliografiaStore.bibliografia, bookId);

    if (!book) {
      throw new Error("Libro non trovato nello store");
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

    // Salva su Firestore - il watcher aggiornerà automaticamente lo store
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase(updatedBook),
      { includeTimestamp: true },
    );

    return updatedBook.images;
  } catch (error) {
    throw error;
  }
};

export const convertAndUploadImage = async (file, bookId, innerIndex) => {
  const bibliografiaStore = useBibliografiaStore();

  console.log("🔄 convertAndUploadImage called with:", {
    bookId,
    innerIndex,
    fileSize: file?.size,
  });

  try {
    const book = findBookInStore(bibliografiaStore.bibliografia, bookId);
    if (!book) throw new Error("Libro non trovato nello store");

    console.log(
      "📚 Book found:",
      book.title,
      "Image count:",
      book.images?.length || 0,
    );

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
    console.log("🖼️ Creating main image blob...");
    const mainImageBlob = await createImageBlob(img, "main", contentType);
    console.log("✅ Main image blob created, size:", mainImageBlob.size);

    console.log("📤 Uploading main image to storage...");
    await uploadImageToStorage(
      mainImageBlob,
      `images/${newFileName}`,
      contentType,
    );
    console.log("✅ Main image uploaded successfully");

    // Genera e carica la thumbnail usando la funzione locale ottimizzata
    console.log("🖼️ Creating thumbnail...");
    const thumbnailBlob = await createImageBlob(img, "thumbnail", contentType);
    if (thumbnailBlob) {
      console.log("✅ Thumbnail blob created, size:", thumbnailBlob.size);
      const thumbnailPath = `thumbnails/${newFileName}`;
      console.log("📤 Uploading thumbnail...");
      await uploadImageToStorage(thumbnailBlob, thumbnailPath, contentType);
      console.log("✅ Thumbnail uploaded successfully");
    } else {
      console.warn("⚠️ Thumbnail blob is null, skipping thumbnail upload");
    }

    console.log("💾 Updating database with new image info...");
    const updatedImages = [...book.images];
    updatedImages[innerIndex] = {
      ...updatedImages[innerIndex],
      id: imageUuid,
      name: newFileName, // Add the name property that UI expects
    };

    const updatedBook = { ...book, images: updatedImages };
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase(updatedBook),
      { includeTimestamp: true },
    );
    console.log("✅ Database updated successfully");

    console.log(
      "✅ convertAndUploadImage completed successfully, returning:",
      updatedImages.length,
      "images",
    );
    return updatedImages;
  } catch (error) {
    console.error("❌ Errore generale in convertAndUploadImageAndSync:", error);
    throw error;
  }
};

/**
 * Create optimized image blob with proper resizing
 * @param {Image} img - Source image
 * @param {string} type - "thumbnail" or "main"
 * @param {string} contentType - MIME type for the blob
 * @returns {Promise<Blob>} Optimized image blob
 */
export const createImageBlob = (img, type, contentType) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let { width, height } = calculateOptimalDimensions(
      img.width,
      img.height,
      type,
    );

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => resolve(blob),
      contentType,
      getOptimalQuality(type),
    );
  });
};

/**
 * Calculate optimal dimensions for the given image type
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {string} type - "thumbnail" or "main"
 * @returns {Object} Object with width and height properties
 */
export const calculateOptimalDimensions = (
  originalWidth,
  originalHeight,
  type,
) => {
  if (type === "thumbnail") {
    const MAX_SIZE = 300;
    const ratio = Math.min(MAX_SIZE / originalWidth, MAX_SIZE / originalHeight);
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  } else {
    // Main image - limit to Full HD
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;

    // If image is already within limits, return original dimensions
    if (originalWidth <= MAX_WIDTH && originalHeight <= MAX_HEIGHT) {
      return {
        width: originalWidth,
        height: originalHeight,
      };
    }

    // Scale down to fit within limits while maintaining aspect ratio
    const widthRatio = MAX_WIDTH / originalWidth;
    const heightRatio = MAX_HEIGHT / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }
};

/**
 * Get optimal quality setting for the image type
 * @param {string} type - "thumbnail" or "main"
 * @returns {number} Quality value between 0 and 1
 */
export const getOptimalQuality = (type) => {
  return type === "thumbnail" ? 0.8 : 0.9;
};

/**
 * Safely find a book in store handling Vue 3 Proxy objects
 * @param {Array} bibliografia - The bibliografia store array
 * @param {string} bookId - The book ID to search for
 * @returns {Object|null} The found book or null
 */
export const findBookInStore = (bibliografia, bookId) => {
  if (!Array.isArray(bibliografia)) return null;

  // Use manual loop to handle Vue 3 Proxy objects that break .find()
  for (let i = 0; i < bibliografia.length; i++) {
    if (bibliografia[i]?.id === bookId) {
      return bibliografia[i];
    }
  }
  return null;
};

/**
 * Replace image from file upload
 * @param {number} index - Index of the image to replace
 * @param {string} bookId - ID of the book
 * @returns {Promise<boolean>} Success status
 */
export const replaceImageFromFile = async (bookId) => {
  console.log("📁 replaceImageFromFile called with bookId:", bookId);

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;
    input.style.display = "none";
    document.body.appendChild(input);

    let timeout;
    let hasCompleted = false;

    // Try different methods to trigger file dialog
    const triggerFileDialog = () => {
      try {
        input.click();
      } catch (clickError) {
        setTimeout(() => {
          try {
            input.click();
          } catch (retryError) {
            const event = new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: true,
            });
            input.dispatchEvent(event);
          }
        }, 100);
      }
    };

    // Cleanup function
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    // Complete the operation (prevents race conditions)
    const complete = (result) => {
      if (!hasCompleted) {
        hasCompleted = true;
        console.log(
          "📁 Completing operation:",
          result.success ? "success" : "failure",
        );
        cleanup();
        resolve(result);
      }
    };

    // Set up the timeout (prevents indefinite hanging)
    timeout = setTimeout(() => {
      console.log("📁 File dialog timeout reached after 3 seconds");
      complete({
        success: false,
        error: "File dialog timeout",
      });
    }, 3000);

    input.onchange = async (e) => {
      clearTimeout(timeout);

      const file = e.target.files[0];
      if (!file) {
        complete({
          success: false,
          error: "No file selected",
        });
        return;
      }

      try {
        console.log("📁 File selected, starting upload process");

        // Get current book to determine where to add the new image
        const bibliografiaStore = useBibliografiaStore();
        const currentBook = findBookInStore(
          bibliografiaStore.bibliografia,
          bookId,
        );

        if (!currentBook) {
          throw new Error("Book not found in store");
        }

        // Get current images array and append new image to the end
        const currentImages = currentBook.images || [];
        const newImageIndex = currentImages.length;

        // Upload file and get the updated images array
        const newImageArray = await convertAndUploadImage(
          file,
          bookId,
          newImageIndex,
        );

        // Update ONLY Firestore - the watcher will update the store automatically
        await updateDocInCollection(
          "Bibliografia",
          bookId,
          { images: newImageArray },
          { includeTimestamp: true },
        );

        // Return the exact updated images array for immediate UI updates
        complete({
          success: true,
          message: "File uploaded successfully",
          imageCount: newImageArray.length,
          images: newImageArray,
        });
      } catch (error) {
        console.error("📁 Error during file upload:", error);
        complete({
          success: false,
          error: error.message,
        });
      }
    };

    // Ensure cleanup happens even if something goes wrong
    input.onerror = () => {
      complete({
        success: false,
        error: "File input error",
      });
    };

    triggerFileDialog();
  });
};

/**
 * Take photo from camera (returns dataUrl for cropping)
 * @param {string} bookId - ID of the book
 * @returns {Promise<{success: boolean, dataUrl?: string, error?: string}>} Result with dataUrl for cropping
 */
export const takePhotoFromCamera = async (bookId) => {
  console.log("📷 takePhotoFromCamera called with bookId:", bookId);

  try {
    // Check if we're on a mobile platform that supports camera
    const { Capacitor } = await import("@capacitor/core");

    // For web platform, use native webcam API
    if (Capacitor.getPlatform() === "web") {
      console.log("📷 Web platform detected - using native webcam API");
      return await takePhotoFromWebcam();
    }

    // Mobile platforms - use Capacitor camera
    const { Camera, CameraResultType, CameraSource } = await import(
      "@capacitor/camera"
    );

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    return {
      success: true,
      dataUrl: image.dataUrl,
    };
  } catch (e) {
    console.error("Camera error:", e);
    return {
      success: false,
      error: e.message,
    };
  }
};

/**
 * Take photo using native webcam API for web browsers
 * @returns {Promise<{success: boolean, dataUrl?: string, error?: string}>}
 */
export const takePhotoFromWebcam = async () => {
  return new Promise((resolve) => {
    console.log("📷 Starting webcam capture...");

    // Create video element for webcam stream
    const video = document.createElement("video");
    video.style.display = "none";
    video.setAttribute("playsinline", "true"); // Important for mobile
    document.body.appendChild(video);

    // Create canvas for capturing the photo
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    // Request webcam access with mobile-friendly constraints
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      })
      .then((stream) => {
        console.log("📷 Webcam access granted");
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play();

          // Wait for video to be ready, then show capture interface
          video.onplaying = () => {
            showWebcamCaptureDialog(video, canvas, context, stream, resolve);
          };
        };
      })
      .catch((error) => {
        console.error("📷 Webcam access denied:", error);
        cleanupElements(video, canvas);

        if (error.name === "NotAllowedError") {
          resolve({
            success: false,
            error: "webcamAccessDenied",
          });
        } else if (error.name === "NotFoundError") {
          resolve({
            success: false,
            error: "noWebcamFound",
          });
        } else {
          resolve({
            success: false,
            error: "webcamError",
            errorParam: error.message,
          });
        }
      });
  });
};

/**
 * Show webcam capture dialog
 */
function showWebcamCaptureDialog(video, canvas, context, stream, resolve) {
  console.log("📷 Showing webcam capture dialog");

  // This is a simplified implementation
  // In a real app, you'd want to show a proper modal dialog
  const capturePhoto = confirm(
    "La webcam è attiva. Clicca OK per scattare la foto, oppure Annulla per uscire.",
  );

  if (capturePhoto) {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to data URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    // Cleanup
    cleanupElements(video, canvas);
    stream.getTracks().forEach((track) => track.stop());

    console.log("📷 Photo captured successfully");
    resolve({
      success: true,
      dataUrl: dataUrl,
    });
  } else {
    // User cancelled
    cleanupElements(video, canvas);
    stream.getTracks().forEach((track) => track.stop());

    resolve({
      success: false,
      error: "userCancelledWebcam",
    });
  }
}

/**
 * Cleanup DOM elements
 */
function cleanupElements(video, canvas) {
  if (video && document.body.contains(video)) {
    document.body.removeChild(video);
  }
  if (canvas && document.body.contains(canvas)) {
    document.body.removeChild(canvas);
  }
}
