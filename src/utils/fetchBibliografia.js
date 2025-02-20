import { db } from "../firebase/firebaseInit";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import {
  useBibliografiaStore,
  useCollaneStore,
  useEditoriStore,
} from "../store/database";
import {
  setBibliografia,
  getBibliografia,
  setLastUpdate,
  getLastUpdate,
  getUserData,
} from "./indexedDB";
import initialBibliografiaData from "../assets/initialBibliografiaData.json";
import initialBibliografiaLastUpdate from "../assets/initialBibliografiaLastUpdate.json";
import { useAuth } from "../composable/auth"; // Import useAuth
import { fetchUserData } from "./fetchUserData";

const { checkAuthState } = useAuth();
checkAuthState();

export async function fetchAndUpdateBibliografia(userData) {
  try {
    if (!navigator.onLine) {
      // if is not online read from iDB
      const localBibliografiaData = await getBibliografia();
      if (localBibliografiaData.length > 0) {
        //
        const processedLocalBibliografiaData = await processPossessionStatus(
          localBibliografiaData,
        );
        // update the bibliografa info on PINIA store
        updateStore(processedLocalBibliografiaData);
        return `OFFLINE Successfully updated ${processedLocalBibliografiaData.length} bibliografia on PINIA`;
      } else {
        return "No internet connection and no local Bibliografia data available.";
      }
    }

    const { updateRequired, bibliografiaLastUpdateFirebase } =
      await checkForUpdates();
    if (updateRequired) {
      const firebaseBibliografiaData = await fetchBibliografia();

      const bibliografiDataAfterPossession = await processPossessionStatus(
        firebaseBibliografiaData,
      );

      const bibliografiDataAfterCollana = await processCollanaNames(
        bibliografiDataAfterPossession,
      );

      const bibliografiaDataAfterEditore = await processEditoreNames(
        bibliografiDataAfterCollana,
      );

      await updateIndexedDB(
        bibliografiaDataAfterEditore,
        bibliografiaLastUpdateFirebase,
      );
      // update the PINIA bibliografio, so now the data are all aligned

      const bibliografiaStore = useBibliografiaStore();
      bibliografiaStore.updateBibliografia(bibliografiaDataAfterEditore);
      return `Successfully updated ${bibliografiaDataAfterEditore.length} bibliografia entries`;
    } else {
      const iDBBibliografiaData = await getBibliografia();
      const bibliografiaStore = useBibliografiaStore();

      bibliografiaStore.updateBibliografia(iDBBibliografiaData);
      const updatedBibliografiaData =
        await processPossessionStatus(iDBBibliografiaData);
      return `Retrieved ${updatedBibliografiaData.length} bibliografia entries from PINIA`;
    }
  } catch (error) {
    console.error("Error fetching and updating Bibliografia:", error);
    return `Error fetching and updating Bibliografia: ${error.message}`;
  }

  return {};
}

async function fetchBibliografia() {
  try {
    const bibliografiaRef = collection(db, "Bibliografia");
    //    const q = query(bibliografiaRef, limit(4));

    const q = query(bibliografiaRef);
    const bibliografiaSnapshot = await getDocs(q);

    const bibliografiaData = bibliografiaSnapshot.docs.map((doc) => ({
      id: doc.id,
      uniqueId: doc.data().uniqueId,
      numeroCollana: doc.data().numeroCollana,
      titolo: doc.data().titolo,
      defaultImageName: doc.data().defaultImageName,
      defaultImageTimestamp: doc.data().defaultImageTimestamp,
      collana: doc.data().collana,
      editore: doc.data().editore,
      lingua: doc.data().lingua,
      posseduto: doc.data().posseduto,
    }));
    // Limit to the first 4 results
    return bibliografiaData;
  } catch (error) {
    console.error("Error fetching bibliografia data:", error);
    throw error;
  }
}

async function checkForUpdates() {
  try {
    const localBibliografiaData = await getBibliografia();
    const localBibliografiaLastUpdate = await getLastUpdate(
      "bibliografiaLastUpdate",
    );
    if (localBibliografiaData.length === 0 || !localBibliografiaLastUpdate) {
      await setBibliografia(initialBibliografiaData);
      await setLastUpdate(
        "bibliografiaLastUpdate",
        initialBibliografiaLastUpdate,
      );
    }

    const bibliografiaTimeRef = doc(db, "Updates", "bibliografiaTimes");
    const bibliografiaTimeSnapshot = await getDoc(bibliografiaTimeRef);
    if (!bibliografiaTimeSnapshot.exists()) {
      throw new Error("No update time found for Bibliografia");
    }
    const bibliografiaTimeData = bibliografiaTimeSnapshot.data();
    const bibliografiaLastUpdateFirebase = bibliografiaTimeData.biblioTimestamp;
    const localBibliografiaLastUpdateValue =
      parseInt(localBibliografiaLastUpdate) || 0;

    const updateRequired =
      !localBibliografiaLastUpdateValue ||
      bibliografiaLastUpdateFirebase > localBibliografiaLastUpdateValue;

    return {
      updateRequired,
      bibliografiaLastUpdateFirebase,
      localBibliografiaLastUpdate: localBibliografiaLastUpdateValue,
    };
  } catch (error) {
    console.error("Error checking for updates:", error);
    throw error;
  }
}

async function processCollanaNames(bibliografiaData) {
  try {
    const collaneStore = useCollaneStore();
    const collaneData = collaneStore.collane;

    if (Array.isArray(collaneData) && collaneData.length > 0) {
      bibliografiaData.forEach((entry) => {
        if (entry.collana) {
          const matchingCollana = collaneData.find(
            (collana) => collana.id === entry.collana,
          );

          if (matchingCollana) {
            entry.collanaName = matchingCollana.collana;
          }
        }
      });
    } else {
      console.error("Collane data is missing or empty.");
    }
    return bibliografiaData; // Return the updated bibliografiaData
  } catch (error) {
    console.error("Error processing collana names:", error);
    throw error;
  }
}

async function processEditoreNames(bibliografiaData) {
  try {
    const editoreStore = useEditoriStore(); // Change from collaneStore to editoreStore
    const editoreData = editoreStore.editori; // Change from collane to editori

    if (Array.isArray(editoreData) && editoreData.length > 0) {
      bibliografiaData.forEach((entry) => {
        if (entry.editore) {
          const matchingEditore = editoreData.find(
            (editore) => editore.id === entry.editore,
          );

          if (matchingEditore) {
            entry.editoreName = matchingEditore.editore;
          }
        }
      });
    } else {
      console.error("Editore data is missing or empty.");
    }
    return bibliografiaData; // Return the updated bibliografiaData
  } catch (error) {
    console.error("Error processing editore names:", error);
    throw error;
  }
}
async function processPossessionStatus(bibliografiaData) {
  try {
    const userData = await getUserData();
    // If no user data or no books, set all books as not possessed
    if (!userData?.books) {
      bibliografiaData.forEach((book) => (book.posseduto = false));
      return bibliografiaData;
    }

    // First set all books as not possessed
    bibliografiaData.forEach((book) => (book.posseduto = false));

    // Then update only the possessed ones from user data

    userData.books.forEach((userBook) => {
      const book = bibliografiaData.find((b) => b.id === userBook.bookId);
      if (book) {
        book.posseduto = userBook.posseduto;
      }
    });

    return bibliografiaData;
  } catch (error) {
    console.error("Error processing possession status:", error);
    throw error;
  }
}

async function updateIndexedDB(
  bibliografiaData,
  bibliografiaLastUpdateFirebase,
) {
  const currentBibliografiaData = await getBibliografia();
  try {
    await setBibliografia(bibliografiaData);
    await setLastUpdate(
      "bibliografiaLastUpdate",
      bibliografiaLastUpdateFirebase,
    );
  } catch (error) {
    console.error("Error updating IndexedDB:", error);
    throw error;
  }
}

function updateStore(bibliografiaData) {
  try {
    const bibliografiaStore = useBibliografiaStore();
    bibliografiaStore.updateBibliografia(bibliografiaData);
  } catch (error) {
    console.error("Error updating store:", error);
    throw error;
  }
}
