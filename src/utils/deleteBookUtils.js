import { db } from "../firebase/firebaseInit";
import { doc, setDoc } from "firebase/firestore";
import { useBibliografiaStore } from "src/store/database";
import { Notify } from "quasar";
import { getBibliografia, setBibliografia } from './indexedDB';

const bibliografiaStore = useBibliografiaStore();

export const deleteBook = async (bookId) => {
  const bibliografiaRef = doc(db, "Bibliografia", bookId);

  try {
    await setDoc(bibliografiaRef, { deleted: true }, { merge: true });

    const localBibliografiaData = await getBibliografia();
    const updatedBibliografiaData = localBibliografiaData.filter(
      (item) => item.id !== bookId,
    );
    await setBibliografia(updatedBibliografiaData);

    bibliografiaStore.removeBook(bookId);

    Notify.create({
      message: `Book Deleted`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    Notify.create({
      message: `Book not deleted`,
      type: "negative",
      color: "red",
    });
    console.error("Error deleting book:", error);
  }
};
