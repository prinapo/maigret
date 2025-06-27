import { useUserStore } from "../stores/userStore";

// Il resto del file può rimanere uguale poiché già usa syncBook e altre funzioni centralizzate
import { Notify } from "quasar";
import { useBibliografiaStore } from "../stores/bibliografiaStore";
import { syncBook } from "./firebaseDatabaseUtils";
import short from "short-uuid";

const bibliografiaStore = useBibliografiaStore();
const shortUuidGenerator = short();

export const fetchEditions = async (bookId, userId) => {
  try {
    // 1. Check if we have data in PINIA
    const bibliografia = bibliografiaStore.bibliografia || [];
    const bookInPinia = bibliografia.find((book) => book.id === bookId);
    console.log("Book in Pinia:", bookInPinia);

    // Safe console.log with optional chaining
    console.log("Book in Pinia edizioni:", bookInPinia?.edizioni || []);
    console.log(
      "Book in Pinia lunghezza edizioni:",
      bookInPinia?.edizioni?.length || 0,
    );

    let currentEditions = [];

    // 2. If not in PINIA, the data will be loaded by realtime listeners
    // We don't need to manually fetch from Firebase here
    if (
      !bookInPinia ||
      !bookInPinia.edizioni ||
      bookInPinia.edizioni.length === 0
    ) {
      console.log(
        "Book or editions not found in PINIA. Data should be loaded by realtime listeners:",
        bookId,
      );
      return [];
    } else {
      currentEditions = bookInPinia.edizioni;
      console.log("Current editions from PINIA:", currentEditions);
    }

    // If no userId, return editions without possession info
    if (!userId) {
      console.log("No userId");
      return currentEditions.map((edition) => ({
        ...edition,
        posseduto: false,
      }));
    }
    console.log("UserId:", userId);

    // 3. Get possession info from user store (loaded by realtime listeners)
    const userStore = useUserStore();
    const userData = userStore.userData;
    console.log("User book:", userData?.books);

    const userBook = userData?.books?.find((b) => b.bookId === bookId);
    console.log("User book filtered:", userBook);

    const updatedEdizioni = currentEditions.map((edition) => ({
      ...edition,
      posseduto:
        userBook?.edizioni?.find((e) => e.uuid === edition.uuid)?.posseduto ||
        false,
    }));
    console.log("Update editions:", updatedEdizioni);

    return updatedEdizioni;
  } catch (error) {
    console.error("Error fetching editions:", error);
    return [];
  }
};

export const saveEdizioneDetail = async (name, index, value, bookId) => {
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
        return { ...item, [name]: value };
      }
      return item;
    });

    const updatedBook = { ...book, edizioni: updatedEdizioni };

    // Use centralized sync function
    await syncBook({ bookId, book: updatedBook });
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
    const userStore = useUserStore();
    const userData = { ...userStore.userData };

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

    // Update Firebase using centralized function
    const userDocRef = doc(db, "Users", userID);
    await setDoc(userDocRef, userData, { merge: true });
    // Note: Pinia will be updated automatically by realtime listeners

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
    const userStore = useUserStore();
    const userData = { ...userStore.userData };

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

        // Update Firebase using centralized approach
        const userDocRef = doc(db, "Users", userID);
        await setDoc(userDocRef, userData, { merge: true });
        // Note: Pinia will be updated automatically by realtime listeners

        Notify.create({
          message: `Possesso rimosso con successo`,
          type: "positive",
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

    const bibliografia = bibliografiaStore.bibliografia || [];
    const book = bibliografia.find((b) => b.id === bookId);

    if (!book) {
      throw new Error("Book not found");
    }

    const cleanEdizioni = book.edizioni.map(({ posseduto, ...rest }) => rest);
    cleanEdizioni.splice(index, 1);

    const updatedBook = { ...book, edizioni: cleanEdizioni };

    // Use centralized sync function
    await syncBook({ bookId, book: updatedBook });

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
          name: "placeholder.jpg",
          timestamp: new Date().valueOf(),
        },
      ],
    };

    const newEdizioni = [...existingEdizioni, defaultEdizione];
    const updatedBook = { ...book, edizioni: newEdizioni };

    // Use centralized sync function
    await syncBook({ bookId, book: updatedBook });

    Notify.create({
      message: `New edition added successfully`,
      type: "positive",
      color: "green",
    });
    return true;
  } catch (error) {
    console.error("Error adding edition:", error);
    Notify.create({
      message: `Failed to add edition: ${error.message}`,
      type: "negative",
      color: "red",
      timeout: 3000,
    });
    return false;
  }
};
