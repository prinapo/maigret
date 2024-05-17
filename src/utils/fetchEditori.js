import { db } from "../firebase/firebaseInit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "../store/database";

// Function to fetch and update Editori data and localStorage
export async function fetchAndUpdateEditori() {
  console.log(
    "Fetching last update time for Editori from Updates collection...",
  );

  const editoriStore = useEditoriStore(); // Initialize the Pinia store

  // Read the last update time for Editori from the "Updates" collection
  const editoriRef = doc(db, "Updates", "editoriTimes");
  const editoriSnapshot = await getDoc(editoriRef);

  const editoriData = editoriSnapshot.data();
  const editoriLastUpdateFirebase = editoriData.editoriTimestamp;

  const localEditoriData = localStorage.getItem("editori");
  const localEditoriLastUpdate =
    parseInt(localStorage.getItem("editoriLastUpdate")) || 0;

  console.log("Local Storage Editori timestamp:", editoriLastUpdateFirebase);

  console.log("Last Firebase Editori timestamp:", editoriLastUpdateFirebase);

  console.log("Local Editori Variable:", localEditoriData);

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
      console.log("Firebase Editori", editori);
      editoriStore.updateEditori(editori); // Update Pinia store
      console.log("Updating local storage for Editori...");
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
