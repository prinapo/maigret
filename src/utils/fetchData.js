import { db } from "../firebase/firebaseInit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "../store/database";

// Function to fetch and update Bibliografia data and localStorage
export async function fetchAndUpdateBibliografia() {
  console.log(
    "Fetching last update time for Bibliografia from Updates collection...",
  );

  const bibliografiaStore = useBibliografiaStore(); // Initialize the Pinia store
  const collaneStore = useCollaneStore();
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

    const uniqueCollanaValues = Array.from(
      new Set(bibliografiaData.map((item) => item.collana)),
    ).sort();

    console.log("collane", uniqueCollanaValues);

    //console.log("Bibliografia fetched:", bibliografiaData);
    bibliografiaStore.updateBibliografia(bibliografiaData); // Update Pinia store
    collaneStore.updateCollane(uniqueCollanaValues);

    console.log("Updating local storage for Bibliografia...");
    localStorage.setItem(
      "bibliografiaLastUpdate",
      bibliografiaLastUpdateFirebase,
    );
    localStorage.setItem("bibliografia", JSON.stringify(bibliografiaData));
    localStorage.setItem("collane", JSON.stringify(uniqueCollanaValues));
  } else {
    console.log(
      "No updates found or local storage is up-to-date for Bibliografia. Using local storage data...",
    );
    // Retrieve data from local storage
    const localBibliografiaData = localStorage.getItem("bibliografia");
    const localCollane = localStorage.getItem("collane");

    if (localBibliografiaData) {
      // Update Pinia store with the locally stored data
      bibliografiaStore.updateBibliografia(JSON.parse(localBibliografiaData));
      collaneStore.updateCollane(JSON.parse(localCollane));
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
      const editori = editoriSnapshot
        .data()
        .editore.map((item) => item.editore);
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
