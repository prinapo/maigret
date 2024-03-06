import { db } from "../firebase/firebaseInit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useBibliografiaStore, useEditoriStore } from "../store/database";

// Function to fetch and update Bibliografia data and localStorage
export async function fetchAndUpdateBibliografia() {
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
      ...doc.data(),
    }));

    console.log("Bibliografia fetched:", bibliografiaData);
    bibliografiaStore.updateBibliografia(bibliografiaData); // Update Pinia store

    console.log("Updating local storage for Bibliografia...");
    localStorage.setItem(
      "bibliografiaLastUpdate",
      bibliografiaLastUpdateFirebase,
    );
    localStorage.setItem("bibliografiaData", JSON.stringify(bibliografiaData));
  } else {
    console.log(
      "No updates found or local storage is up-to-date for Bibliografia. Using local storage data...",
    );
    // Retrieve data from local storage
    const localBibliografiaData = localStorage.getItem("bibliografiaData");

    if (localBibliografiaData) {
      // Update Pinia store with the locally stored data
      bibliografiaStore.updateBibliografia(JSON.parse(localBibliografiaData));
    }
  }
}

// Function to fetch and update Editori data and localStorage
export async function fetchAndUpdateEditori() {
  console.log(
    "Fetching last update time for Editori from Updates collection...",
  );

  const editoriStore = useEditoriStore(); // Initialize the Pinia store

  // Read the last update time for Editori from the "Updates" collection
  const editoriRef = doc(db, "Updates", "editoriTimes");
  const editoriSnapshot = await getDoc(editoriRef);
  const editoriLastUpdateFirebase = editoriSnapshot.data().updates.slice(-1)[0];

  console.log(
    "Last update time fetched for Editori:",
    editoriLastUpdateFirebase,
  );

  console.log("Reading local storage for Editori last update time...");
  const localEditoriLastUpdate =
    parseInt(localStorage.getItem("editoriLastUpdate")) || 0;
  console.log("Local Editori Variable:", localEditoriLastUpdate);

  if (
    !localEditoriLastUpdate ||
    editoriLastUpdateFirebase > localEditoriLastUpdate
  ) {
    console.log(
      "First boot or updates are newer than local storage for Editori. Fetching Editori...",
    );
    const editoriRef = collection(db, "Editori");
    const editoriSnapshot = await getDocs(editoriRef);
    const editoriData = editoriSnapshot.docs[0].data();

    console.log("Editori fetched:", editoriData);
    editoriStore.updateEditori(editoriData); // Update Pinia store

    console.log("Updating local storage for Editori...");
    localStorage.setItem("editoriLastUpdate", editoriLastUpdateFirebase);
    localStorage.setItem("editoriData", JSON.stringify(editoriData));
  } else {
    console.log(
      "No updates found or local storage is up-to-date for Editori. Using local storage data...",
    );
    // Retrieve data from local storage
    const localEditoriData = localStorage.getItem("editoriData");

    if (localEditoriData) {
      // Update Pinia store with the locally stored data
      editoriStore.updateEditori(JSON.parse(localEditoriData));
    }
  }
}
