import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";

// Define updatesBibliografiaTimesRef within the same scope as updateTimestamp
// Define the updateTimestamp function
import { setLastUpdate } from "./indexedDB";

const updateTimestamp = async (timestamp) => {
  try {
    const updatesBibliografiaTimesRef = doc(db, "Updates", "bibliografiaTimes");
    const docSnap = await getDoc(updatesBibliografiaTimesRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const firebaseTimestamp = data.biblioTimestamp || 0;

      if (timestamp > firebaseTimestamp) {
        await updateDoc(updatesBibliografiaTimesRef, {
          biblioTimestamp: timestamp,
        });

        // Update IndexedDB
        await setLastUpdate("bibliografiaLastUpdate", timestamp);
      }
    }
  } catch (error) {
    console.error("Error updating timestamp:", error);
  }
};
const updateEditoriTimestamp = async (timestamp) => {
  try {
    const updatesEditoriTimesRef = doc(db, "Updates", "editoriTimes");
    const docSnap = await getDoc(updatesEditoriTimesRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const firebaseTimestamp = data.editoriTimestamp || 0;

      if (timestamp > firebaseTimestamp) {
        await updateDoc(updatesEditoriTimesRef, {
          editoriTimestamp: timestamp,
        });

        // Update IndexedDB instead of localStorage
        await setLastUpdate("editoriLastUpdate", timestamp);
      } else {
      }
    } else {
      console.error("Document does not exist.");
    }
  } catch (error) {
    console.error("Error updating timestamp:", error);
  }
};

const updateCoversTimestamp = async (timestamp) => {
  try {
    const updatesCoversTimesRef = doc(db, "Updates", "coversTimes");
    const docSnap = await getDoc(updatesCoversTimesRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const firebaseTimestamp = data.coversTimeStamp || 0;

      if (timestamp > firebaseTimestamp) {
        await updateDoc(updatesCoversTimesRef, {
          coversTimeStamp: timestamp,
        });
        await setLastUpdate("coversLastUpdate", timestamp);
      }
    }
  } catch (error) {
    console.error("Error updating timestamp:", error);
  }
};

const updateCollaneTimestamp = async (timestamp) => {
  try {
    const updatesCollaneTimesRef = doc(db, "Updates", "collaneTimes");
    const docSnap = await getDoc(updatesCollaneTimesRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const firebaseTimestamp = data.coversTimeStamp || 0;

      if (timestamp > firebaseTimestamp) {
        await updateDoc(updatesCollaneTimesRef, {
          collaneTimeStamp: timestamp,
        });
        await setLastUpdate("collaneLastUpdate", timestamp);
      }
    }
  } catch (error) {
    console.error("Error updating timestamp:", error);
  }
};

// Export the updateTimestamp function
export {
  updateTimestamp,
  updateEditoriTimestamp,
  updateCoversTimestamp,
  updateCollaneTimestamp,
};
