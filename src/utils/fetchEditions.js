import { db } from "../firebase/firebaseInit";
import { doc, getDoc } from "firebase/firestore";

import { useBibliografiaStore } from "src/store/database";
export const fetchEditions = async (bookId) => {
  try {
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDoc = await getDoc(bookRef);
    if (!bookDoc.exists()) {
      console.error("Error No such document!");
      return [];
    }

    // Recupera i dati aggiornati delle edizioni
    const newEdizioni = bookDoc.data().edizioni || [];

    // Accesso allo store di bibliografia
    const bibliografiaStore = useBibliografiaStore();
    const bookIndex = bibliografiaStore.bibliografia.findIndex(
      (book) => book.id === bookId,
    );

    if (bookIndex !== -1) {
      // Creiamo una copia aggiornata del libro con le nuove edizioni
      const updatedBook = {
        ...bibliografiaStore.bibliografia[bookIndex],
        edizioni: newEdizioni, // Aggiorna l'intero array edizioni
      };

      // Aggiorniamo l'intero array bibliografia sostituendo il libro aggiornato
      bibliografiaStore.$patch((state) => {
        state.bibliografia[bookIndex] = updatedBook;
      });
    }

    return newEdizioni;
  } catch (error) {
    console.error("Error fetching editions:", error);
    return; // Return an empty array in case of error
  }
};
