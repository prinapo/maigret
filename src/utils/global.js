import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseInit";

// Define updatesBibliografiaTimesRef within the same scope as updateTimestamp

// Define the updateTimestamp function
const updateTimestamp = async (timestamp) => {
  try {
    // Get the document snapshot for bibliografiaTimes
    const updatesBibliografiaTimesRef = doc(db, "Updates", "bibliografiaTimes");
    const docSnap = await getDoc(updatesBibliografiaTimesRef);

    // Check if the document exists
    if (docSnap.exists()) {
      // Get the data from the document
      const data = docSnap.data();

      // Get the current timestamp from Firebase or default to 0 if it doesn't exist
      const firebaseTimestamp = data.biblioTimestamp || 0;

      // Check if the new timestamp is higher than the timestamp in Firebase
      if (timestamp > firebaseTimestamp) {
        // Update the document with the new timestamp
        await updateDoc(updatesBibliografiaTimesRef, {
          biblioTimestamp: timestamp,
        });

        // Update the lastUpdate value in localStorage
        localStorage.setItem("bibliografiaLastUpdate", timestamp.toString());

        console.log(`Timestamp updated: ${timestamp}`);
      } else {
        console.log(
          "New timestamp is not higher than the timestamp in Firebase.",
        );
        // Raise an alarm or handle the scenario where the timestamp is not higher
      }
    } else {
      console.log("Document does not exist.");
    }
  } catch (error) {
    console.error("Error updating timestamp:", error);
  }
};
const updateEditoriTimestamp = async (timestamp) => {
  try {
    // Get the document snapshot for bibliografiaTimes
    const updatesEditoriTimesRef = doc(db, "Updates", "editoriTimes");
    const docSnap = await getDoc(updatesEditoriTimesRef);

    // Check if the document exists
    if (docSnap.exists()) {
      // Get the data from the document
      const data = docSnap.data();

      // Get the current timestamp from Firebase or default to 0 if it doesn't exist
      const firebaseTimestamp = data.editoriTimestamp || 0;

      // Check if the new timestamp is higher than the timestamp in Firebase
      if (timestamp > firebaseTimestamp) {
        // Update the document with the new timestamp
        await updateDoc(updatesEditoriTimesRef, {
          editoriTimestamp: timestamp,
        });

        // Update the lastUpdate value in localStorage
        localStorage.setItem("editoriLastUpdate", timestamp.toString());

        console.log(`Timestamp updated: ${timestamp}`);
      } else {
        console.log(
          "New timestamp is not higher than the timestamp in Firebase.",
        );
        // Raise an alarm or handle the scenario where the timestamp is not higher
      }
    } else {
      console.log("Document does not exist.");
    }
  } catch (error) {
    console.error("Error updating timestamp:", error);
  }
};

const updateCoversTimestamp = async (timestamp) => {
  try {
    // Get the document snapshot for bibliografiaTimes
    const updatesCoversTimesRef = doc(db, "Updates", "coversTimes");
    const docSnap = await getDoc(updatesCoversTimesRef);

    // Check if the document exists
    if (docSnap.exists()) {
      // Get the data from the document
      const data = docSnap.data();

      // Get the current timestamp from Firebase or default to 0 if it doesn't exist
      const firebaseTimestamp = data.coversTimeStamp || 0;

      // Check if the new timestamp is higher than the timestamp in Firebase
      if (timestamp > firebaseTimestamp) {
        // Update the document with the new timestamp
        await updateDoc(updatesCoversTimesRef, {
          coversTimeStamp: timestamp,
        });

        // Update the lastUpdate value in localStorage
        localStorage.setItem("coversLastUpdate", timestamp.toString());

        console.log(`Timestamp updated: ${timestamp}`);
      } else {
        console.log(
          "New timestamp is not higher than the timestamp in Firebase.",
        );
        // Raise an alarm or handle the scenario where the timestamp is not higher
      }
    } else {
      console.log("Document does not exist.");
    }
  } catch (error) {
    console.error("Error updating timestamp:", error);
  }
};
const updateCollaneTimestamp = async (timestamp) => {
  try {
    // Get the document snapshot for bibliografiaTimes
    const updatesCollaneTimesRef = doc(db, "Updates", "collaneTimes");
    const docSnap = await getDoc(updatesCollaneTimesRef);

    // Check if the document exists
    if (docSnap.exists()) {
      // Get the data from the document
      const data = docSnap.data();

      // Get the current timestamp from Firebase or default to 0 if it doesn't exist
      const firebaseTimestamp = data.coversTimeStamp || 0;

      // Check if the new timestamp is higher than the timestamp in Firebase
      if (timestamp > firebaseTimestamp) {
        // Update the document with the new timestamp
        await updateDoc(updatesCollaneTimesRef, {
          collaneTimeStamp: timestamp,
        });

        // Update the lastUpdate value in localStorage
        localStorage.setItem("collaneLastUpdate", timestamp.toString());

        console.log(`Timestamp updated: ${timestamp}`);
      } else {
        console.log(
          "New timestamp is not higher than the timestamp in Firebase.",
        );
        // Raise an alarm or handle the scenario where the timestamp is not higher
      }
    } else {
      console.log("Document does not exist.");
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
