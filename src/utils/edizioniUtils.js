import { useUserStore } from "stores/userStore";
import { showNotifyPositive, showNotifyNegative } from "utils/notify";
import { i18n } from "boot/i18n";
import { Notify } from "quasar";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import {
  updateUserInFirebase,
  getUserProfileFromFirebase,
  updateUserBooksInFirebase,
  sanitizeBookForFirebase,
} from "utils/firebaseDatabaseUtils";
import short from "short-uuid";
import { db } from "boot/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateDocInCollection } from "utils/firebaseDatabaseUtils";

const shortUuidGenerator = short();

export const fetchEditions = async (bookId, userId) => {
  const bibliografiaStore = useBibliografiaStore();
  try {
    const bibliografia = bibliografiaStore.bibliografia || [];
    const bookInPinia = bibliografia.find((book) => book.id === bookId);
    if (
      !bookInPinia ||
      !bookInPinia.edizioni ||
      bookInPinia.edizioni.length === 0
    ) {
      return [];
    } else {
      var currentEditions = bookInPinia.edizioni;
    }
    if (!userId) {
      return currentEditions.map((edition) => ({
        ...edition,
        posseduto: false,
      }));
    }
    const userStore = useUserStore();
    const userData = userStore.userData;
    const userBook = userData?.books?.find((b) => b.bookId === bookId);
    const updatedEdizioni = currentEditions.map((edition) => ({
      ...edition,
      posseduto:
        userBook?.edizioni?.find((e) => e.uuid === edition.uuid)?.posseduto ||
        false,
    }));
    return updatedEdizioni;
  } catch (error) {
    console.error("Error fetching editions:", error);
    return [];
  }
};

export const saveEdizioneDetail = async (name, index, value, bookId) => {
  const bibliografiaStore = useBibliografiaStore();
  if (!name || index === undefined || !bookId) {
    throw new Error("Missing required parameters");
  }
  try {
    const bibliografia = bibliografiaStore.bibliografia || [];
    const book = bibliografia.find((b) => b.id === bookId);
    if (!book) {
      throw new Error("Book not found");
    }
    const existingEdizioni = book.edizioni || [];
    if (index < 0 || index >= existingEdizioni.length) {
      throw new Error("Invalid edition index");
    }
    const updatedEdizioni = existingEdizioni.map((item, i) => {
      if (i === index) {
        const { posseduto, timestamp, ...rest } = item;
        return { ...rest, [name]: value };
      }
      return item;
    });
    const updatedBook = { ...book, edizioni: updatedEdizioni };
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase(updatedBook),
      { includeTimestamp: true },
    );
  } catch (error) {
    console.error("Error saving edition detail:", error);
    Notify.create({
      message: `Failed to save edition: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
    throw error;
  }
};

export const savePossessoEdizione = async (
  edizioneUuid,
  edizionePosseduto,
  userID,
  bookId,
) => {
  try {
    // 1. Leggi lo stato attuale da Firestore
    const userData = await getUserProfileFromFirebase(userID);
    userData.books = userData.books || [];
    // 2. Trova o aggiungi il libro
    let book = userData.books.find((b) => b.bookId === bookId);
    if (!book) {
      book = { bookId, posseduto: edizionePosseduto, edizioni: [] };
      userData.books.push(book);
    }
    // 3. Trova o aggiungi l'edizione
    let edizione = book.edizioni.find((e) => e.uuid === edizioneUuid);
    if (!edizione) {
      edizione = { uuid: edizioneUuid, posseduto: edizionePosseduto };
      book.edizioni.push(edizione);
    } else {
      edizione.posseduto = edizionePosseduto;
    }
    // 4. Aggiorna il flag posseduto del libro
    book.posseduto = book.edizioni.some((e) => e.posseduto);
    // 5. Scrivi solo l'array books aggiornato
    await updateUserBooksInFirebase(userID, userData.books);
    Notify.create({
      message: `Possesso aggiornato con successo`,
      type: "positive",
    });
  } catch (error) {
    Notify.create({
      message: `Errore nel salvataggio del possesso`,
      type: "negative",
    });
    console.error("Errore nel salvataggio del possesso:", error);
  }
};

export const removePossessoEdizione = async (edizioneUuid, userID, bookId) => {
  try {
    // 1. Leggi lo stato attuale da Firestore
    const userData = await getUserProfileFromFirebase(userID);
    userData.books = userData.books || [];
    // 2. Trova il libro
    let book = userData.books.find((b) => b.bookId === bookId);
    if (!book) return;
    // 3. Trova l'edizione
    let edizione = book.edizioni.find((e) => e.uuid === edizioneUuid);
    if (!edizione) return;
    edizione.posseduto = false;
    // 4. Aggiorna il flag posseduto del libro
    book.posseduto = book.edizioni.some((e) => e.posseduto);
    // 5. Scrivi solo l'array books aggiornato
    await updateUserBooksInFirebase(userID, userData.books);
    Notify.create({
      message: `Possesso rimosso con successo`,
      type: "positive",
    });
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

    const bibliografia = bibliografiaStore.bibliografia || [];
    const book = bibliografia.find((b) => b.id === bookId);

    if (!book) {
      throw new Error("Book not found");
    }

    const cleanEdizioni = book.edizioni.map(({ posseduto, ...rest }) => rest);
    cleanEdizioni.splice(index, 1);

    const updatedBook = { ...book, edizioni: cleanEdizioni };

    // Use centralized sync function
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase(updatedBook),
      { includeTimestamp: true },
    );

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
  const bibliografiaStore = useBibliografiaStore();
  if (!bookId) {
    throw new Error("Book ID is required");
  }

  try {
    const bibliografia = bibliografiaStore.bibliografia || [];
    const book = bibliografia.find((b) => b.id === bookId);

    if (!book) {
      throw new Error("Book not found");
    }

    let existingEdizioni = book.edizioni || [];

    if (existingEdizioni.length >= 50) {
      throw new Error("Maximum number of editions reached");
    }

    const defaultEdizione = {
      anno: 1900,
      numero: existingEdizioni.length + 1,
      uuid: shortUuidGenerator.new(),
      images: [
        {
          id: shortUuidGenerator.new(),
          coverType: "",
        },
      ],
    };

    const newEdizioni = [...existingEdizioni, defaultEdizione];
    const updatedBook = { ...book, edizioni: newEdizioni };

    // Use centralized sync function
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase(updatedBook),
      { includeTimestamp: true },
    );

    showNotifyPositive(i18n.global.t("edizioni.added"));
    return true;
  } catch (error) {
    console.error("Error adding edition:", error);
    showNotifyNegative(
      i18n.global.t("edizioni.failed", { error: error.message }),
    );
    return false;
  }
};
