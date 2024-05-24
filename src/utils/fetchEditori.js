import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { useEditoriStore } from "../store/database";

// Function to fetch and update Editori data and localStorage
export async function fetchAndUpdateEditori() {
  const editoriStore = useEditoriStore(); // Initialize the Pinia store

  // Read the last update time for Editori from the "Updates" collection
  const editoriTimeRef = doc(db, "Updates", "editoriTimes");
  const editoriTimeSnapshot = await getDoc(editoriTimeRef);
  const editoriTimeData = editoriTimeSnapshot.data();
  const editoriLastUpdateFirebase = editoriTimeData.editoriTimestamp;

  const localEditoriData = localStorage.getItem("editori");
  const localEditoriLastUpdate =
    parseInt(localStorage.getItem("editoriLastUpdate")) || 0;

  if (
    !localEditoriLastUpdate ||
    !localEditoriData ||
    editoriLastUpdateFirebase > localEditoriLastUpdate
  ) {
    console.log(
      "First boot or updates are newer than local storage for Editori. Fetching Editori...",
    );
    const editoriRef = doc(db, "Editori", "default");
    const editoriSnapshot = await getDoc(editoriRef);

    if (editoriSnapshot.exists()) {
      const editori = editoriSnapshot.data();
      editoriStore.updateEditori(editori); // Update Pinia store
      localStorage.setItem("editoriLastUpdate", editoriLastUpdateFirebase);
      localStorage.setItem("editori", JSON.stringify(editori));
    } else {
      console.error(
        "Document 'default' does not exist in the 'Editori' collection.",
      );
    }
  } else {
    editoriStore.updateEditori(JSON.parse(localEditoriData));
    console.log(
      "No updates found or local storage is up-to-date for Editori. Using local storage data...",
    );
  }
}
