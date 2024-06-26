import { db } from "../firebase/firebaseInit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useBibliografiaStore } from "../store/database";
import { ref } from "vue";

// Function to fetch and update Bibliografia data and localStorage
export async function fetchAndUpdateBibliografia() {
  const loading = ref(true); // Initialize as true to show the spinner

  try {
    console.log(
      "Fetching last update time for Bibliografia from Updates collection...",
    );

    const bibliografiaStore = useBibliografiaStore(); // Initialize the Pinia store
    // Read the last update time for Bibliografia from the "Updates" collection
    const bibliografiaRef = doc(db, "Updates", "bibliografiaTimes");
    const bibliografiaSnapshot = await getDoc(bibliografiaRef);
    const bibliografiaLastUpdateFirebase = bibliografiaSnapshot
      .data()
      .updates.slice(-1)[0];

    console.log(
      "Last update time fetched for Bibliografia:",
      bibliografiaLastUpdateFirebase,
    );

    console.log("Reading local storage for Bibliografia last update time...");
    const localBibliografiaLastUpdate =
      parseInt(localStorage.getItem("bibliografiaLastUpdate")) || 0;
    console.log("Local Bibliografia Variable:", localBibliografiaLastUpdate);

    if (
      !localBibliografiaLastUpdate ||
      bibliografiaLastUpdateFirebase > localBibliografiaLastUpdate
    ) {
      console.log(
        "First boot or updates are newer than local storage for Bibliografia. Fetching Bibliografia...",
      );
      const bibliografiaRef = collection(db, "Bibliografia");
      const bibliografiaSnapshot = await getDocs(bibliografiaRef);
      const bibliografiaData = bibliografiaSnapshot.docs.map((doc) => ({
        id: doc.id,
        titolo: doc.data().titolo,
        editore: doc.data().editore,
        collana: doc.data().collana,
        signedUrl: doc.data().signedUrl,
        uniqueId: doc.data()._id,
      }));

      //console.log("Bibliografia fetched:", bibliografiaData);
      bibliografiaStore.updateBibliografia(bibliografiaData); // Update Pinia store

      console.log("Updating local storage for Bibliografia...");
      localStorage.setItem(
        "bibliografiaLastUpdate",
        bibliografiaLastUpdateFirebase,
      );
      localStorage.setItem("bibliografia", JSON.stringify(bibliografiaData));
    } else {
      console.log(
        "No updates found or local storage is up-to-date for Bibliografia. Using local storage data...",
      );
      // Retrieve data from local storage
      const localBibliografiaData = localStorage.getItem("bibliografia");

      if (localBibliografiaData) {
        // Update Pinia store with the locally stored data
        bibliografiaStore.updateBibliografia(JSON.parse(localBibliografiaData));
      }
    }
  } catch (error) {
    console.error("Error fetching and updating Bibliografia:", error);
  } finally {
    loading.value = false; // Set loading to false after fetch operation completes
  }

  return { loading };
}
