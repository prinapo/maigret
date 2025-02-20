import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { useCollaneStore } from "../store/database";
import {
  setCollane,
  getCollane,
  setLastUpdate,
  getLastUpdate,
} from "./indexedDB";

// Function to fetch and update Collane data and IndexedDB
export async function fetchAndUpdateCollane() {
  const collaneStore = useCollaneStore(); // Initialize the Pinia store

  try {
    // Check if the internet is not present
    if (!navigator.onLine) {
      const localCollaneData = await getCollane();
      if (localCollaneData) {
        collaneStore.updateCollane(localCollaneData);
        return "No internet connection. Using local Collane data.";
      } else {
        return "No internet connection and no local Collane data available.";
      }
    }

    // Read the last update time for Collane from the "Updates" collection
    const collaneTimeRef = doc(db, "Updates", "collaneTimes");
    const collaneTimeSnapshot = await getDoc(collaneTimeRef);
    if (!collaneTimeSnapshot.exists()) {
      throw new Error("No update time found for Collane");
    }
    const collaneTimeData = collaneTimeSnapshot.data();
    const collaneLastUpdateFirebase = collaneTimeData.collaneTimeStamp;

    const localCollaneData = await getCollane();
    const localCollaneLastUpdate = await getLastUpdate("collaneLastUpdate");
    let result = "";
    if (
      !localCollaneLastUpdate ||
      !localCollaneData ||
      collaneLastUpdateFirebase > localCollaneLastUpdate
    ) {
      result = "Fetching new Collane data from Firebase...";

      const collaneRef = doc(db, "Collane", "default");
      const collaneSnapshot = await getDoc(collaneRef);

      if (collaneSnapshot.exists()) {
        const collaneData = collaneSnapshot.data();
        const collane = collaneData.collana; // Extract the array from the collane object
        if (Array.isArray(collane) && collane.every((c) => c.id)) {
          await setCollane(collane); // Store in IndexedDB
          collaneStore.updateCollane(collane); // Update Pinia store

          await setLastUpdate("collaneLastUpdate", collaneLastUpdateFirebase); // Store last update in IndexedDB
          result += " Data updated successfully.";
        } else {
          result += " Error: Invalid data structure for collane.";
        }
      } else {
        result +=
          " Error: Document 'default' does not exist in the 'Collane' collection.";
      }
    } else {
      collaneStore.updateCollane(localCollaneData);
      result = "Using up-to-date local Collane data.";
    }
    return result;
  } catch (error) {
    console.error("Error fetching and updating Collane:", error);
    return `Error fetching and updating Collane: ${error.message}`;
  }
}
