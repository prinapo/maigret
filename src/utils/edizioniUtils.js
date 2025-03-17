import { db } from "../firebase/firebaseInit";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { Notify } from "quasar";
import { updateTimestamp } from "../utils/global";
import { useBibliografiaStore } from "../store/database";
import {
  getUserData,
  setBibliografia,
  getBibliografia,
  setUserData,
} from "./indexedDB";
import short from "short-uuid";

const bibliografiaStore = useBibliografiaStore();
const shortUuidGenerator = short();
export const fetchEditions = async (bookId, userId) => {
  try {
    // Get book from Pinia bibliografia store
    const bibliografia = bibliografiaStore.bibliografia || [];
    const book = bibliografia.find((book) => book.id === bookId);
    if (!book) {
      console.error("Error No such document in PINIA database!");
      return [];
    }
    const edizioni = book.edizioni || [];
    const bookIndex = bibliografia.findIndex((book) => book.id === bookId);

    // Get user data and find book possession info
    const userDocRef = doc(db, "Users", userId);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : null;
    const userBook = userData?.books?.find((b) => b.bookId === bookId);

    console.log("Fetching editions with user data:", {
      bookId,
      userId,
      hasUserData: !!userData,
      hasUserBook: !!userBook,
    });

    // Update editions possession status
    const updatedEdizioni = edizioni.map((edition) => {
      const userEdition = userBook?.edizioni?.find(
        (e) => e.uuid === edition.uuid,
      );
      const posseduto = userEdition?.posseduto || false;
      return {
        ...edition,
        posseduto,
      };
    });

    // Check if any edition is posseduto
    const hasAnyPosseduto = updatedEdizioni.some(
      (edition) => edition.posseduto,
    );

    // Update Pinia store if book exists
    if (bookIndex !== -1) {
      bibliografiaStore.$patch((state) => {
        state.bibliografia[bookIndex] = {
          ...book,
          edizioni: updatedEdizioni,
          posseduto: hasAnyPosseduto,
        };
      });

      // Update IndexedDB
      const currentBibliografia = await getBibliografia();
      const updatedBibliografia = currentBibliografia.map((b) =>
        b.id === bookId
          ? { ...b, edizioni: updatedEdizioni, posseduto: hasAnyPosseduto }
          : b,
      );
      await setBibliografia(updatedBibliografia);
    }

    console.log("Returning editions:", {
      count: updatedEdizioni.length,
      hasAnyPosseduto,
    });

    // Return only the updated editions
    return updatedEdizioni;
  } catch (error) {
    console.error("Error fetching editions:", error);
    return [];
  }
};

export const saveEdizioneDetail = async (name, index, value, bookId) => {
  try {
    const timestamp = new Date().valueOf();
    const bookRef = doc(db, "Bibliografia", bookId);
    const edizioniSnapshot = await getDoc(bookRef);
    const edizioniData = edizioniSnapshot.data();
    const existingEdizioni = edizioniData.edizioni || [];

    const updatedEdizioni = existingEdizioni.map((item, i) => {
      if (i === index) {
        return { ...item, [name]: value };
      } else {
        return item;
      }
    });

    // Update Firebase
    await updateDoc(bookRef, { edizioni: updatedEdizioni });
    await setDoc(bookRef, { timestamp: timestamp }, { merge: true });

    // Update Pinia store
    const bookIndex = bibliografiaStore.bibliografia.findIndex(
      (book) => book.id === bookId,
    );
    if (bookIndex !== -1) {
      bibliografiaStore.bibliografia[bookIndex].edizioni = updatedEdizioni;
    }

    // Update IndexedDB
    setBibliografia(bibliografiaStore.bibliografia);
    await updateTimestamp(timestamp);
    Notify.create({
      message: `Edizione Saved`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    Notify.create({
      message: `Edizione Not Saved`,
      type: "negative",
      color: "red",
    });
    console.error("Error saving edizione detail:", error);
  }
};

export const savePossessoEdizione = async (
  edizioneUuid,
  edizionePosseduto,
  userID,
  bookId,
) => {
  try {
    const userDocRef = doc(db, "Users", userID);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      // Update books in user data
      userData.books = userData.books || [];
      const bookIndex = userData.books.findIndex((b) => b.bookId === bookId);

      if (bookIndex !== -1) {
        // Update editions in the book
        userData.books[bookIndex].edizioni =
          userData.books[bookIndex].edizioni || [];
        const edizioneIndex = userData.books[bookIndex].edizioni.findIndex(
          (e) => e.uuid === edizioneUuid,
        );

        if (edizioneIndex !== -1) {
          userData.books[bookIndex].edizioni[edizioneIndex].posseduto =
            edizionePosseduto;
        } else {
          userData.books[bookIndex].edizioni.push({
            uuid: edizioneUuid,
            posseduto: edizionePosseduto,
          });
        }

        // Update the book's posseduto field
        userData.books[bookIndex].posseduto = userData.books[
          bookIndex
        ].edizioni.some((e) => e.posseduto);
      } else {
        // Add new book with the edition
        userData.books.push({
          bookId: bookId,
          posseduto: edizionePosseduto,
          edizioni: [{ uuid: edizioneUuid, posseduto: edizionePosseduto }],
        });
      }

      // Update Firestore
      await setDoc(userDocRef, userData, { merge: true });

      // Update user data in IndexedDB
      await setUserData(userData);

      // Update bibliografia store if at least one edition is posseduto
      const oneEditionPosseduto = userData.books.some(
        (b) => b.bookId === bookId && b.posseduto,
      );
      if (oneEditionPosseduto) {
        const bookIndexInBibliografia =
          bibliografiaStore.bibliografia.findIndex((b) => b.id === bookId);
        if (bookIndexInBibliografia !== -1) {
          bibliografiaStore.bibliografia[bookIndexInBibliografia].posseduto =
            true;
          await setBibliografia([...bibliografiaStore.bibliografia]);
        }
      }

      Notify.create({
        message: `Possesso aggiornato con successo`,
        type: "positive",
        color: "green",
      });
    }
  } catch (error) {
    Notify.create({
      message: `Errore nel salvataggio del possesso`,
      type: "negative",
      color: "red",
    });
    console.error("Errore nel salvataggio del possesso:", error);
  }
};

export const removePossessoEdizione = async (edizioneUuid, userID, bookId) => {
  try {
    // 1. First update bibliografia store
    const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
      (b) => b.id === bookId,
    );

    if (bookIndexInBibliografia !== -1) {
      // Get the editions array
      const bibliografiaBook =
        bibliografiaStore.bibliografia[bookIndexInBibliografia];
      const updatedEdizioni = bibliografiaBook.edizioni.map((edition) => {
        if (edition.uuid === edizioneUuid) {
          return { ...edition, posseduto: false };
        }
        return edition;
      });

      // Check if any edition is still possessed
      const hasAnyPossessed = updatedEdizioni.some(
        (edition) => edition.posseduto,
      );

      // Update bibliografia store with new editions and possession status
      bibliografiaStore.$patch((state) => {
        state.bibliografia[bookIndexInBibliografia] = {
          ...bibliografiaBook,
          edizioni: updatedEdizioni,
          posseduto: hasAnyPossessed,
        };
      });

      // Update IndexedDB with bibliografia changes
      await setBibliografia([...bibliografiaStore.bibliografia]);
    }

    // 2. Then update user data
    const userData = await getUserData(userID);
    userData.books = userData.books || [];
    const bookIndex = userData.books.findIndex((b) => b.bookId === bookId);

    if (bookIndex !== -1) {
      // Update editions in user's book
      userData.books[bookIndex].edizioni =
        userData.books[bookIndex].edizioni || [];
      const edizioneIndex = userData.books[bookIndex].edizioni.findIndex(
        (e) => e.uuid === edizioneUuid,
      );

      if (edizioneIndex !== -1) {
        // Set possession to false for the specific edition
        userData.books[bookIndex].edizioni[edizioneIndex].posseduto = false;

        // Check if any edition is still possessed
        const hasAnyPossessed = userData.books[bookIndex].edizioni.some(
          (e) => e.posseduto,
        );

        // Update the book's main posseduto field
        userData.books[bookIndex].posseduto = hasAnyPossessed;

        // Update user data in IndexedDB
        await setUserData(userData);

        // Update Firebase user data
        const userDocRef = doc(db, "Users", userID);
        await setDoc(userDocRef, userData, { merge: true });

        Notify.create({
          message: `Possesso rimosso con successo`,
          type: "positive",
          color: "green",
        });
      }
    }
  } catch (error) {
    Notify.create({
      message: `Errore nella rimozione del possesso`,
      type: "negative",
      color: "red",
    });
    console.error("Errore nella rimozione del possesso:", error);
  }
};
export const removeEdizione = async (bookId, edizioni, index) => {
  try {
    if (index < 0 || index >= edizioni.value.length) {
      return;
    }

    const timestamp = new Date().valueOf();
    const bookRef = doc(db, "Bibliografia", bookId);

    // Create a clean version of edizioni without possession data for Firebase
    const cleanEdizioni = edizioni.value.map(({ posseduto, ...rest }) => rest);
    cleanEdizioni.splice(index, 1);

    // Update Firebase with clean data (no possession info)
    await setDoc(
      bookRef,
      {
        edizioni: cleanEdizioni,
        timestamp: timestamp,
      },
      { merge: true },
    );

    // Update Pinia and IndexedDB with full data (including possession)
    const bibliografiaStore = useBibliografiaStore();
    const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
      (book) => book.id === bookId,
    );

    if (bookIndexInBibliografia !== -1) {
      // Keep possession data in local stores
      edizioni.value.splice(index, 1);
      bibliografiaStore.bibliografia[bookIndexInBibliografia].edizioni =
        edizioni;
      await setBibliografia([...bibliografiaStore.bibliografia]);
    }

    await updateTimestamp(timestamp);

    Notify.create({
      message: `Edizione Removed`,
      type: "positive",
      color: "green",
    });
    return true;
  } catch (error) {
    console.error("Error removing edizione ", error);
    Notify.create({
      message: `Edizione Not Removed`,
      type: "negative",
      color: "red",
    });
    return false;
  }
};
export const addEdizione = async (bookId) => {
  try {
    const timestamp = new Date().valueOf();
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDocSnap = await getDoc(bookRef);

    if (bookDocSnap.exists()) {
      let existingEdizioni = bookDocSnap.data().edizioni || [];
      const defaultEdizione = {
        anno: 1900,
        numero: 1,
        uuid: shortUuidGenerator.new(),
        images: [
          {
            id: shortUuidGenerator.new(),
            coverType: "",
            name: "placeholder.jpg",
            timestamp: new Date().valueOf(),
          },
        ],
      };

      const newEdizioni = [...existingEdizioni, defaultEdizione];

      // Aggiorna Firebase
      await setDoc(
        bookRef,
        {
          edizioni: newEdizioni,
          timestamp: timestamp,
        },
        { merge: true },
      );

      // Aggiorna Pinia e IndexedDB
      const bookIndex = bibliografiaStore.bibliografia.findIndex(
        (book) => book.id === bookId,
      );

      if (bookIndex !== -1) {
        // Update Pinia
        bibliografiaStore.bibliografia[bookIndex].edizioni = newEdizioni;
        // Update IndexedDB
        await setBibliografia([...bibliografiaStore.bibliografia]);
      }

      await updateTimestamp(timestamp);

      Notify.create({
        message: `Edizione Aggiunta`,
        type: "positive",
        color: "green",
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Errore aggiunta edizione:", error);
    Notify.create({
      message: `Errore aggiunta edizione`,
      type: "negative",
      color: "red",
    });
    return false;
  }
};
