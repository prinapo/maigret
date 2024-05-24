import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { useCoversStore } from "../store/database";

// Function to fetch and update Covers data and localStorage
export async function fetchAndUpdateCovers() {
  const coversStore = useCoversStore(); // Initialize the Pinia store

  // Read the last update time for Covers from the "Updates" collection
  const coversTimeRef = doc(db, "Updates", "coversTimes");
  const coversSnapshot = await getDoc(coversTimeRef);
  const coversData = coversSnapshot.data();
  const coversLastUpdateFirebase = coversData.coversTimeStamp;

  const localCoversData = localStorage.getItem("covers");
  const localCoversLastUpdate =
    parseInt(localStorage.getItem("coversLastUpdate")) || 0;

  if (
    !localCoversLastUpdate ||
    !localCoversData ||
    coversLastUpdateFirebase > localCoversLastUpdate
  ) {
    console.log(
      "First boot or updates are newer than local storage for Covers. Fetching Covers...",
    );
    const coversRef = doc(db, "Covers", "default");
    const coversSnapshot = await getDoc(coversRef);

    if (coversSnapshot.exists()) {
      const covers = coversSnapshot.data();
      coversStore.updateCovers(covers); // Update Pinia store
      localStorage.setItem("coversLastUpdate", coversLastUpdateFirebase);
      localStorage.setItem("covers", JSON.stringify(covers));
    } else {
      console.error(
        "Document 'default' does not exist in the 'Covers' collection.",
      );
    }
  } else {
    coversStore.updateCovers(JSON.parse(localCoversData));
    console.log(
      "No updates found or local storage is up-to-date for Covers. Using local storage data...",
    );
  }
}
