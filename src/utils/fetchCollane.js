import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { useCollaneStore } from "../store/database";

// Function to fetch and update collane data and localStorage
export async function fetchAndUpdateCollane() {
  const collaneStore = useCollaneStore(); // Initialize the Pinia store

  // Read the last update time for collane from the "Updates" collection
  // Read the last update time for Bibliografia from the "Updates" collectio

  const collaneRef = doc(db, "Updates", "collaneTimes");
  const collaneSnapshot = await getDoc(collaneRef);
  const collaneData = collaneSnapshot.data();
  const collaneLastUpdateFirebase = collaneData.collaneTimeStamp;

  const localCollaneData = localStorage.getItem("collane");
  const localCollaneLastUpdate =
    parseInt(localStorage.getItem("collaneLastUpdate")) || 0;

  if (
    !localCollaneLastUpdate ||
    !localCollaneData ||
    collaneLastUpdateFirebase > localCollaneLastUpdate
  ) {
    console.log(
      "First boot or updates are newer than local storage for collane. Fetching collane...",
    );
    const collaneRef = doc(db, "Collane", "default");
    const collaneSnapshot = await getDoc(collaneRef);

    if (collaneSnapshot.exists()) {
      const collane = collaneSnapshot.data();
      collaneStore.updateCollane(collane); // Update Pinia store
      localStorage.setItem("collaneLastUpdate", collaneLastUpdateFirebase);
      localStorage.setItem("collane", JSON.stringify(collane));
    } else {
      console.error(
        "Document 'default' does not exist in the 'collane' collection.",
      );
    }
  } else {
    collaneStore.updateCollane(JSON.parse(localCollaneData));
  }
}
