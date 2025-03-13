import { db } from "../firebase/firebaseInit";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useBibliografiaStore, useCoversStore } from "../store/database";
import { updateTimestamp } from "../utils/global";
import short from "short-uuid";
import { setBibliografia } from "./indexedDB";
import { reactive } from "vue";
import { Notify } from "quasar";
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { storage, fireStoreUrl } from "../firebase/firebaseInit";

const bookCoverTypeId = "qNvdwFMLNt2Uz7JjqTjacu";

const shortUuidGenerator = short();
const bibliografiaStore = useBibliografiaStore();

const notifySuccess = (message) => {
  Notify.create({ message, type: "positive", color: "green" });
};

const notifyError = (message) => {
  Notify.create({ message, type: "negative", color: "red" });
};

export const deleteImage = async (bookId, index) => {
  try {
    const timestamp = new Date().valueOf();
    const bookRef = doc(db, "Bibliografia", bookId);
    const dataSnapshot = await getDoc(bookRef);
    const book = dataSnapshot.data();
    const imagesArray = book.images || [];

    if (index >= 0 && index < imagesArray.length) {
      imagesArray.splice(index, 1);
    } else {
      console.error("Index is out of bounds:", index);
    }

    const { imagesArray: updatedImages } = await processImageUpdate(
      bookId,
      imagesArray,
      timestamp,
    );
    notifySuccess("Image deleted successfully");
    return updatedImages;
  } catch (error) {
    console.error("Error deleting image:", error);
    notifyError("Problem in deleting image");
  }
};

export const saveImageDetail = async (bookId, coverTypeId, index) => {
  try {
    const timestamp = new Date().valueOf();
    const bookRef = doc(db, "Bibliografia", bookId);
    const dataSnapshot = await getDoc(bookRef);
    const book = dataSnapshot.data();
    const imagesArray = book.images || [];

    if (index >= 0 && index < imagesArray.length) {
      imagesArray[index].coverTypeId = coverTypeId;
    } else {
      console.error("Index is out of bounds:", index);
    }

    await processImageUpdate(bookId, imagesArray, timestamp);
    notifySuccess("Detail saved successfully");
  } catch (error) {
    console.error("Error saving detail:", error);
    notifyError("Detail not saved");
  }
};
export const addImage = async (bookId, idValue) => {
  try {
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDocSnap = await getDoc(bookRef);
    const shortUuid = shortUuidGenerator.new();
    const timestamp = new Date().valueOf();

    if (bookDocSnap.exists()) {
      let existingImages = bookDocSnap.data().images || [];
      const defaultImage = {
        id: shortUuid,
        name: "placeholder.jpg",
        coverType: "Unknown",
        timestamp: new Date().valueOf(),
      };

      await updateDoc(bookRef, {
        images: [...existingImages, defaultImage],
      });
      const images = [...existingImages, defaultImage];
      await updateTimestamp(timestamp);

      const updatedBibliografia = bibliografiaStore.bibliografia.map((book) =>
        book.id === bookId ? reactive({ ...book, images }) : book,
      );
      bibliografiaStore.updateBibliografia(updatedBibliografia);
      await setBibliografia(updatedBibliografia);
      notifySuccess("Image added successfully");
      return images;
    } else {
      console.error("No such document!");
      return [];
    }
  } catch (error) {
    console.error("Error adding new image:", error);
    notifyError("Error adding image");
    throw error;
  }
};
export const handleFileUploaded = async (
  bookId,
  originalFileName,
  imageUuid,
  imageIndex,
) => {
  try {
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDoc = await getDoc(bookRef);
    const timestamp = new Date().valueOf();

    if (!bookDoc.exists()) {
      throw new Error("Document does not exist");
    }

    const book = bookDoc.data();
    const imagesArray = book.images || [];

    if (!imagesArray[imageIndex]) {
      imagesArray[imageIndex] = {};
    }

    const fileExtension = originalFileName.split(".").pop();
    const filename = `${imageUuid}.${fileExtension}`;
    imagesArray[imageIndex].name = filename;
    imagesArray[imageIndex].timestamp = timestamp;

    // Generate thumbnail using your existing function
    await generateThumbnail(filename);

    const { imagesArray: updatedImages } = await processImageUpdate(
      bookId,
      imagesArray,
      timestamp,
    );
    return updatedImages;
  } catch (error) {
    console.error("Error handling file upload:", error);
    throw error;
  }
};

const generateThumbnail = async (imageName) => {
  if (imageName === "placeholder.jpg") return;
  try {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    const imageUrl = `${fireStoreUrl}${encodeURIComponent(imageName)}?alt=media`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Image load timeout"));
      }, 30000); // 30 second timeout

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
          async (blob) => {
            try {
              const thumbnailRef = storageRef(
                storage,
                `thumbnails/${imageName}`,
              );
              await uploadBytes(thumbnailRef, blob);
              resolve();
            } catch (uploadError) {
              reject(uploadError);
            }
          },
          "image/jpeg",
          0.8,
        );
      };

      img.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${imageName}`));
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.warn(`Thumbnail generation failed for ${imageName}:`, error);
    // Continue execution even if thumbnail generation fails
  }
};
const processImageUpdate = async (bookId, imagesArray, timestamp) => {
  const imageEntry = imagesArray.find(
    (image) => image.coverTypeId === bookCoverTypeId,
  );
  const firstImageEntry = imagesArray[0];

  let defaultImageName = "placeholder.jpg";
  let defaultImageTimestamp = 0;

  if (imageEntry) {
    defaultImageName = imageEntry.name;
    defaultImageTimestamp = imageEntry.timestamp;
  } else if (firstImageEntry) {
    defaultImageName = firstImageEntry.name;
    defaultImageTimestamp = firstImageEntry.timestamp;
  }
  await generateThumbnail(defaultImageName);

  const updateData = {
    images: imagesArray,
    timestamp: timestamp,
    defaultImageName,
    defaultImageTimestamp,
  };

  const bookRef = doc(db, "Bibliografia", bookId);
  await updateDoc(bookRef, updateData);

  const updatedBibliografia = bibliografiaStore.bibliografia.map((book) =>
    book.id === bookId ? reactive({ ...book, ...updateData }) : book,
  );

  bibliografiaStore.updateBibliografia(updatedBibliografia);
  await setBibliografia(updatedBibliografia);
  await updateTimestamp(timestamp);

  return { imagesArray, updateData };
};

export const fetchImages = async (bookId) => {
  try {
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDocSnap = await getDoc(bookRef);

    if (!bookDocSnap.exists()) {
      console.error("No such document!");
      return [];
    }

    const bookData = bookDocSnap.data();
    const images = bookData.images || [];

    // Fetch the list of covers from Pinia
    const coversStore = useCoversStore();
    const covers = coversStore.covers;

    // Add coverType to each image based on the id
    const imagesWithCoverType = images.map((image) => {
      const cover = covers.find((cover) => cover.id === image.coverTypeId);
      return {
        ...image,
        coverType: cover ? cover.label : "Unknown", // Default to "Unknown" if no match is found
      };
    });

    return imagesWithCoverType;
  } catch (error) {
    console.error("Error fetching images:", error);
    throw error;
  }
};
