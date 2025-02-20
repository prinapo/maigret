import { db } from "../firebase/firebaseInit";
import { doc, setDoc } from "firebase/firestore";
import { useBibliografiaStore } from "../store/database";
import { updateTimestamp } from "./global";
import { Notify } from "quasar";

const bibliografiaStore = useBibliografiaStore();

export const saveDetail = async (bookId, itemId, value) => {
  // creo il nuovo timestamp
  const timestamp = new Date().valueOf();
  const bookRef = doc(db, "Bibliografia", bookId);

  try {
    //creo il ref al libro corrente le info del signolo libro

    // Uso "setDoc per fare un merge tra i dati che carico e i dati presenti nele documento online
    await setDoc(
      bookRef,
      {
        [itemId]: value,
      },
      { merge: true },
    );
    // aggiorno il timestamp nel libro corrente
    await setDoc(
      bookRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );

    // chiamo la funxione per aggiornare il timestamp localmente
    // Update timestamp
    await updateTimestamp(timestamp);

    //se collana o editore devo cercare il valore e aggiungerlo

    if (itemId === "collana" || itemId === "editore") {
      bibliografiaStore.bibliografia = bibliografiaStore.bibliografia.map(
        (book) => (book.id === bookId ? { ...book, [itemId]: value } : book),
      );
    } else {
      bibliografiaStore.bibliografia = bibliografiaStore.bibliografia.map(
        (book) => (book.id === bookId ? { ...book, [itemId]: value } : book),
      );
    }

    const bibliografiaData = bibliografiaStore.bibliografia;
    localStorage.setItem("bibliografia", JSON.stringify(bibliografiaData));

    Notify.create({
      message: `Detail ${itemId} Saved`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    Notify.create({
      message: `Detail  ${itemId} Not Saved`,
      type: "negative",
      color: "red",
    });

    console.error("Error saving detail:", error);
  }
};
