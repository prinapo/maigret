import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { useCoversStore, useBibliografiaStore } from "../store/database";
import {
  setCovers,
  getCovers,
  getCachedImage,
  cacheImage,
  setLastUpdate,
  getLastUpdate,
} from "./indexedDB";

const placeholderUrl = "placeholder.jpg";

// Function to fetch and update Covers data and IndexedDB
export async function fetchAndUpdateCovers() {
  const coversStore = useCoversStore(); // Initialize the Pinia store

  try {
    // Check if the internet is not present
    if (!navigator.onLine) {
      const localCoversData = await getCovers();
      if (localCoversData) {
        coversStore.updateCovers(localCoversData);
        await fetchAndUpdateImages();
        return "No internet connection. Using local Covers data.";
      } else {
        return "No internet connection and no local Covers data available.";
      }
    }

    // Read the last update time for Covers from the "Updates" collection
    const coversTimeRef = doc(db, "Updates", "coversTimes");
    const coversTimeSnapshot = await getDoc(coversTimeRef);
    if (!coversTimeSnapshot.exists()) {
      throw new Error("No update time found for Covers");
    }
    const coversTimeData = coversTimeSnapshot.data();
    const coversLastUpdateFirebase = coversTimeData.coversTimeStamp;
    const localCoversData = await getCovers();
    const localCoversLastUpdate = await getLastUpdate("coversLastUpdate");
    let result = "";
    if (
      !localCoversLastUpdate ||
      !localCoversData ||
      coversLastUpdateFirebase > localCoversLastUpdate
    ) {
      result = "Fetching new Covers data from Firebase...";

      const coversRef = doc(db, "Covers", "default");
      const coversSnapshot = await getDoc(coversRef);
      if (coversSnapshot.exists()) {
        const coversData = coversSnapshot.data();
        const covers = coversData.cover; // Extract the array from the covers object
        if (Array.isArray(covers) && covers.every((c) => c.id)) {
          await setCovers(covers); // Store in IndexedDB
          coversStore.updateCovers(covers); // Update Pinia store
          await setLastUpdate("coversLastUpdate", coversLastUpdateFirebase); // Store last update in IndexedDB
          result += " Data updated successfully.";
        } else {
          result += " Error: Invalid data structure for covers.";
        }
      } else {
        result +=
          " Error: Document 'default' does not exist in the 'Covers' collection.";
      }
    } else {
      coversStore.updateCovers(localCoversData);
      result = "Using up-to-date local Covers data.";
    }

    // Update book image URLs
    await fetchAndUpdateImages();
    return result;
  } catch (error) {
    console.error("Error fetching and updating Covers:", error);
    return `Error fetching and updating Covers: ${error.message}`;
  }
}

// Function to fetch and update book image URLs
async function fetchAndUpdateImages() {
  const bibliografiaStore = useBibliografiaStore();
  const books = bibliografiaStore.bibliografia;

  let totalImages = books.length;
  let cachedImages = 0;
  let downloadedImages = 0;

  for (const book of books) {
    try {
      const cachedImage = await getCachedImage(`book_${book.id}.png`);

      if (cachedImage) {
        cachedImages++;
        book.imageUrl = `data:image/png;base64,${cachedImage.base64data}`;
      } else if (navigator.onLine) {
        const response = await fetch(book.imageUrl);
        if (response.ok) {
          const imageBlob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = async function () {
            const base64data = reader.result.split(",")[1];
            await cacheImage(`book_${book.id}.png`, base64data);
            book.imageUrl = `data:image/png;base64,${base64data}`;
          };
          reader.readAsDataURL(imageBlob);
          downloadedImages++;
        } else if (response.status === 404) {
          console.warn(
            `Image not found for book ${book.id}, using placeholder.`,
          );
          const placeholderResponse = await fetch(placeholderUrl);
          const placeholderBlob = await placeholderResponse.blob();
          const reader = new FileReader();
          reader.onloadend = async function () {
            const base64data = reader.result.split(",")[1];
            await cacheImage(`book_${book.id}.png`, base64data);
            book.imageUrl = `data:image/png;base64,${base64data}`;
          };
          reader.readAsDataURL(placeholderBlob);
        } else {
          book.imageUrl = placeholderUrl;
        }
      } else {
        book.imageUrl = placeholderUrl;
      }
    } catch (error) {
      console.error(`Error fetching cover for book ${book.id}:`, error);
      book.imageUrl = placeholderUrl;
    }
  }

  bibliografiaStore.updateBibliografia(books);
}
