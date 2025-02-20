import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { useEditoriStore } from "../store/database";
import {
  setEditori,
  getEditori,
  setLastUpdate,
  getLastUpdate,
} from "./indexedDB";

// Function to fetch and update Editori data and IndexedDB
export async function fetchAndUpdateEditori() {
  const editoriStore = useEditoriStore(); // Initialize the Pinia store

  try {
    // Check if the internet is not present
    if (!navigator.onLine) {
      const localEditoriData = await getEditori();
      if (localEditoriData) {
        editoriStore.updateEditori(localEditoriData);
        return "No internet connection. Using local Editori data.";
      } else {
        return "No internet connection and no local Editori data available.";
      }
    }

    // Read the last update time for Editori from the "Updates" collection
    const editoriTimeRef = doc(db, "Updates", "editoriTimes");
    const editoriTimeSnapshot = await getDoc(editoriTimeRef);
    if (!editoriTimeSnapshot.exists()) {
      throw new Error("No update time found for Editori");
    }
    const editoriTimeData = editoriTimeSnapshot.data();
    const editoriLastUpdateFirebase = editoriTimeData.editoriTimestamp;

    const localEditoriData = await getEditori();
    const localEditoriLastUpdate = await getLastUpdate("editoriLastUpdate");

    let result = "";
    if (
      !localEditoriLastUpdate ||
      !localEditoriData ||
      editoriLastUpdateFirebase > localEditoriLastUpdate
    ) {
      result = "Fetching new Editori data from Firebase...";

      const editoriRef = doc(db, "Editori", "default");
      const editoriSnapshot = await getDoc(editoriRef);

      if (editoriSnapshot.exists()) {
        const editori = editoriSnapshot.data().editore; // Extract the array from the editori object
        if (Array.isArray(editori) && editori.every((e) => e.id)) {
          await setEditori(editori); // Store in IndexedDB
          editoriStore.updateEditori(editori); // Update Pinia store
          await setLastUpdate("editoriLastUpdate", editoriLastUpdateFirebase); // Store last update in IndexedDB
          result += " Data updated successfully.";
        } else {
          result += " Error: Invalid data structure for editori.";
        }
      } else {
        result +=
          " Error: Document 'default' does not exist in the 'Editori' collection.";
      }
    } else {
      editoriStore.updateEditori(localEditoriData);
      result = "Using up-to-date local Editori data.";
    }
    return result;
  } catch (error) {
    console.error("Error fetching and updating Editori:", error);
    return `Error fetching and updating Editori: ${error.message}`;
  }
}
