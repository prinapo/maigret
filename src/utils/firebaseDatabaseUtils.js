import { db, auth } from "../boot/firebase";
// Firestore
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Notify } from "quasar";
import { useBibliografiaStore } from "../stores/bibliografiaStore";
import { moveStorageObject } from "./firebaseStorageUtils";
/**
 * Centralized utility for handling data synchronization between Firebase, IndexedDB, and Pinia
 * This utility ensures consistent data updates across all storage layers
 */

/**
 * Validates the data before synchronization
 * @param {Object} data - The data to validate
 * @param {string} collectionName - The name of the collection
 * @throws {Error} If validation fails
 */
const validateData = (data, collectionName) => {
  if (!data) {
    throw new Error(`Invalid data for ${collectionName}`);
  }
  // Add more specific validation rules as needed
};

/**
 * Updates data in Firebase for single-document collections (Collane, Editori, Covers, Lingue)
 * @param {string} collectionName - The name of the collection
 * @param {Object} data - The data to update
 * @param {number} timestamp - The timestamp for the update
 * @returns {Promise<void>}
 */
const updateSingleDocCollection = async (collectionName, data, timestamp) => {
  try {
    const docRef = doc(db, collectionName, "default");
    const fieldName = collectionName.toLowerCase().slice(0, -1); // Remove 's' from collection name
    await setDoc(docRef, { [fieldName]: data, timestamp }, { merge: true });
  } catch (error) {
    console.error(`Error updating ${collectionName} in Firebase:`, error);
    throw error;
  }
};

/**
 * Updates data in Firebase for Bibliografia collection
 * @param {string} docId - The document ID
 * @param {Object} data - The data to update
 * @param {number} timestamp - The timestamp for the update
 * @returns {Promise<void>}
 */
const updateBibliografiaDoc = async (docId, data, timestamp) => {
  try {
    const docRef = doc(db, "Bibliografia", docId);
    await setDoc(docRef, { ...data, timestamp }, { merge: true });
  } catch (error) {
    console.error(`Error updating Bibliografia document ${docId}:`, error);
    throw error;
  }
};

/**
 * Main synchronization function for single-document collections
 * @param {Object} params - The parameters for synchronization
 * @param {string} params.collectionName - The name of the collection
 * @param {Object} params.data - The data to update
 * @param {Function} params.storeUpdateFn - The store update function
 * @param {Function} params.indexedDBUpdateFn - The IndexedDB update function
 * @param {string} params.fieldName - The field name for the data
 * @returns {Promise<void>}
 */
export const syncSingleDocCollection = async ({
  collectionName,
  data,
  storeUpdateFn,
  indexedDBUpdateFn,
  fieldName,
}) => {
  try {
    // Validate data
    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid data format");
    }

    // Update Firebase
    const docRef = doc(db, collectionName, "default");
    await setDoc(
      docRef,
      {
        [fieldName]: data,
      },
      { merge: true },
    );

    // Update IndexedDB
    if (indexedDBUpdateFn) {
      await indexedDBUpdateFn(data);
    }

    // Update store
    storeUpdateFn(data);

    // Show success notification
    Notify.create({
      message: `${collectionName} updated successfully`,
      type: "positive",
    });

    return true;
  } catch (error) {
    console.error(`Error syncing ${collectionName}:`, error);
    Notify.create({
      message: `Failed to save ${collectionName}: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
    throw error;
  }
};

/**
 * Synchronizes a single book document across Firebase, IndexedDB, and Pinia
 * @param {Object} params - The parameters for synchronization
 * @param {string} params.bookId - The document ID (book ID)
 * @param {Object} params.book - The book data to update
 * @param {Function} params.storeUpdateFn - The Pinia store update function
 * @returns {Promise<void>}
 */
export const syncBook = async ({ bookId, book }) => {
  try {
    await updateFirebaseDoc("Bibliografia", bookId, book, {
      includeTimestamp: true,
    });

    Notify.create({
      message: `Libro ${bookId} aggiornato con successo`,
      type: "positive",
    });
  } catch (error) {
    console.error(`Errore nella sincronizzazione del libro ${bookId}:`, error);
    Notify.create({
      message: `Errore aggiornando il libro ${bookId}: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
    throw error;
  }
};

/**
 * Updates a single book document in Firebase
 * @param {string} docId - The document ID
 * @param {Object} data - The data to update (should include timestamp)
 * @param {number} timestamp - The update timestamp
 * @returns {Promise<void>}
 */
const updateBookDoc = async (docId, data, timestamp) => {
  try {
    const docRef = doc(db, "Bibliografia", docId);
    await setDoc(docRef, { ...data, timestamp }, { merge: true });
  } catch (error) {
    console.error(`Errore aggiornando il libro ${docId} in Firebase:`, error);
    throw error;
  }
};

/**
 * Handles offline data updates
 * @param {Object} params - The parameters for offline update
 * @param {string} params.collectionName - The name of the collection
 * @param {Object} params.data - The data to update
 * @param {Function} params.storeUpdateFn - The store update function
 * @param {Function} params.indexedDBUpdateFn - The IndexedDB update function
 * @returns {Promise<void>}
 */
export const handleOfflineUpdate = async ({
  collectionName,
  data,
  storeUpdateFn,
  indexedDBUpdateFn,
}) => {
  try {
    // 1. Validate data
    validateData(data, collectionName);

    // 2. Update IndexedDB
    if (indexedDBUpdateFn) {
      await indexedDBUpdateFn(data);
    }

    // 3. Update Pinia store
    storeUpdateFn(data);

    Notify.create({
      message: `${collectionName} updated locally`,
      type: "info",
    });
  } catch (error) {
    console.error(
      `Error handling offline update for ${collectionName}:`,
      error,
    );
    Notify.create({
      message: `Failed to update ${collectionName} locally: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
    throw error;
  }
};

/**
 * Sposta immagine e thumbnail in "trash", aggiorna il libro e aggiunge record undo
 * @param {string} bookId - ID del libro
 * @param {Object} imageToDelete - Dati immagine da cancellare (deve contenere almeno `name`)
 * @param {number} imageIndex - Indice immagine da rimuovere dall'array immagini
 * @param {Object} book - Oggetto libro completo
 * @returns {Promise<Object>} - Dati per l'undo
 */
export const moveImageToTrashAndLogUndo = async (
  bookId,
  imageToDelete,
  imageIndex,
  book,
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Utente non autenticato");

  const isPlaceholder = imageToDelete.name === "placeholder.jpg";

  if (!isPlaceholder) {
    const imagePath = `images/${imageToDelete.name}`;
    const thumbnailPath = `thumbnails/${imageToDelete.name}`;
    const trashImagePath = `trash/${imageToDelete.name}`;
    const trashThumbnailPath = `trash-thumbnails/${imageToDelete.name}`;

    // Sposta i file in parallelo
    await Promise.all([
      moveStorageObject(imagePath, trashImagePath),
      moveStorageObject(thumbnailPath, trashThumbnailPath),
    ]);
  } else {
    console.log(
      "Immagine placeholder: salto spostamento file, ma aggiorno il libro.",
    );
  }

  // Aggiorna array immagini senza quella cancellata
  const updatedImages = [...book.images];
  updatedImages.splice(imageIndex, 1);
  const updatedBook = { ...book, images: updatedImages };

  // Sincronizza il libro
  await syncBook({ bookId, book: updatedBook });

  // Registra l'azione di undo in Firestore
  const undoCollection = collection(db, "undoTrash");
  const undoData = {
    bookId,
    operationType: "deleteImage",
    imageData: imageToDelete,
    timestamp: serverTimestamp(),
    userId,
  };
  const docRef = await addDoc(undoCollection, undoData);
  return {
    bookId,
    operationType: "deleteImage",
    imageData: imageToDelete,
    imageIndex,
    trashEntryId: docRef.id,
  };
};

/**
 * Ripristina immagine e thumbnail da "trash", aggiorna il libro
 * @param {string} bookId - ID del libro
 * @param {Object} imageData - Dati immagine da ripristinare (almeno `name`)
 * @param {number} imageIndex - Posizione in cui reinserire l'immagine
 * @returns {Promise<Array>} - Array immagini aggiornato
 */
export const restoreImageFromTrashAndSync = async (
  bookId,
  imageData,
  imageIndex,
) => {
  const imageName = imageData.name;

  // Se l'immagine è placeholder.jpg, salto lo spostamento
  if (imageName === "placeholder.jpg") {
    console.log("Immagine placeholder.jpg, salto lo spostamento file.");
  } else {
    const fromImagePath = `trash/${imageName}`;
    const fromThumbPath = `trash-thumbnails/${imageName}`;
    const toImagePath = `images/${imageName}`;
    const toThumbPath = `thumbnails/${imageName}`;

    await Promise.all([
      moveStorageObject(fromImagePath, toImagePath),
      moveStorageObject(fromThumbPath, toThumbPath),
    ]);
  }

  // Recupera libro aggiornato da Pinia
  const bibliografiaStore = useBibliografiaStore();
  const book = bibliografiaStore.bibliografia.find((b) => b.id === bookId);
  if (!book) throw new Error("Libro non trovato");

  const updatedImages = [...book.images];
  updatedImages.splice(imageIndex, 0, imageData); // reinserisce l'immagine

  const updatedBook = { ...book, images: updatedImages };

  // Sincronizza con Firebase
  await syncBook({ bookId, book: updatedBook });
  return updatedImages;
};

/**
 * Recupera tutte le informazioni presenti nella collection 'undoTrash' di Firebase Firestore.
 * @returns {Promise<Array<Object>>} - Un array di oggetti che rappresentano le immagini e i relativi dati nel cestino.
 * @throws {Error} - Rilancia eventuali errori durante il recupero dei dati.
 */
export const fetchTrashData = async () => {
  try {
    const undoTrashCollection = collection(db, "undoTrash");
    const snapshot = await getDocs(undoTrashCollection);

    const trashData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return trashData;
  } catch (error) {
    console.error("Errore nel recupero dati trash:", error);
    throw error;
  }
};

/**
 * Cancella un documento dalla collection undoTrash
 * @param {string} entryId - ID del documento da cancellare
 */
export const deleteTrashEntry = async (entryId) => {
  if (!entryId) throw new Error("entryId is required");
  const docRef = doc(db, "undoTrash", entryId);
  await deleteDoc(docRef);
};

/**
 * Ripristina un'immagine nel database Firestore aggiungendola in fondo all'array 'images' del libro
 * e sincronizza lo stato locale (Pinia).
 * @param {string} bookId - L'ID del libro a cui aggiungere l'immagine.
 * @param {Object} imageData - I dati dell'immagine da ripristinare.
 * @returns {Promise<void>}
 */
export const restoreImageToDatabase = async (bookId, imageData) => {
  if (!bookId || !imageData) {
    throw new Error("bookId e imageData sono obbligatori.");
  }

  const bookRef = doc(db, "Bibliografia", bookId);

  try {
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      throw new Error(`Il documento con ID ${bookId} non esiste.`);
    }

    const bookData = bookSnap.data();
    const imagesArray = Array.isArray(bookData.images)
      ? [...bookData.images]
      : [];

    // Aggiunge l'immagine in fondo all'array
    imagesArray.push(imageData);

    // Aggiorna il documento con il nuovo array immagini
    await updateDoc(bookRef, { images: imagesArray });

    // Sincronizza con Pinia
    await syncBook({ bookId, book: { ...bookData, images: imagesArray } });
  } catch (error) {
    console.error(
      `Errore durante il ripristino dell'immagine per il libro ${bookId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Crea un nuovo libro in Firebase
 * @param {Object} bookData - I dati del libro
 * @returns {Promise<DocumentReference>}
 */
export const createBook = async (bookData) => {
  try {
    const docRef = await addDoc(collection(db, "Bibliografia"), bookData);

    Notify.create({
      message: "Libro creato con successo",
      type: "positive",
    });

    return docRef;
  } catch (error) {
    console.error("Error creating book:", error);
    throw error;
  }
};

/**
 * Controlla se esiste un libro con il titolo specificato
 * @param {string} title - Il titolo da controllare
 * @returns {Promise<boolean>}
 */
export const checkBookExists = async (title) => {
  try {
    const q = query(
      collection(db, "Bibliografia"),
      where("titolo", "==", title),
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking book existence:", error);
    throw error;
  }
};

/**
 * Recupera tutti gli utenti da Firestore
 * @returns {Promise<Array>}
 */
export const fetchAllUsers = async () => {
  try {
    const usersCollection = collection(db, "Users");
    const snapshot = await getDocs(usersCollection);

    return snapshot.docs.map((doc) => {
      const userData = {
        uid: doc.id,
        ...doc.data(),
      };

      // Fallback per email se mancante (solo per utente corrente)
      if (!userData.email && auth.currentUser?.uid === doc.id) {
        userData.email = auth.currentUser.email;
      }

      // Assicura valori di default più robusti
      return {
        role: userData.role || "user",
        permissions: Array.isArray(userData.permissions)
          ? userData.permissions
          : [],
        email: userData.email || "unknown@example.com",
        displayName: userData.displayName || "Unknown User",
        ...userData,
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

/**
 * Aggiorna un utente in Firebase
 * @param {string} userId - ID dell'utente
 * @param {Object} updateData - Dati da aggiornare
 * @returns {Promise<void>}
 */
export const updateUserInFirebase = async (userId, updateData) => {
  try {
    const userRef = doc(db, "Users", userId);
    await updateDoc(userRef, updateData);

    Notify.create({
      message: "Utente aggiornato con successo",
      type: "positive",
      color: "green",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Elimina un utente da Firebase
 * @param {string} userId - ID dell'utente
 * @returns {Promise<void>}
 */
export const deleteUserFromFirebase = async (userId) => {
  try {
    const userRef = doc(db, "Users", userId);
    await deleteDoc(userRef);

    Notify.create({
      message: "Utente eliminato con successo",
      type: "positive",
      color: "green",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

/**
 * Recupera dati da una collezione generica
 * @param {string} collectionName - Nome della collezione
 * @param {Object} queryOptions - Opzioni per la query (optional)
 * @returns {Promise<Array>}
 */
export const fetchCollectionData = async (
  collectionName,
  queryOptions = {},
) => {
  try {
    let q = collection(db, collectionName);

    if (queryOptions.orderBy) {
      q = query(
        q,
        orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction),
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Aggiorna un singolo campo di settings per l'utente su Firestore.
 * @param {string} userId ‒ l'UID dell'utente corrente
 * @param {string} fieldKey ‒ la chiave da aggiornare (es. "superadmin", "darkMode", ecc.)
 * @param {any} value ‒ il nuovo valore da salvare
 * @returns {Promise<void>}
 */
export async function updateUserSettingInFirebase(userId, fieldKey, value) {
  if (!userId) {
    throw new Error("updateUserSettingInFirebase: manca l'UID dell'utente");
  }

  try {
    const userRef = doc(db, "Users", userId);
    await updateDoc(userRef, {
      [`settings.${fieldKey}`]: value,
    });
  } catch (err) {
    console.error(
      `[firebaseDatabaseUtils] Errore in updateUserSettingInFirebase(${fieldKey}):`,
      err,
    );
    throw err;
  }
}

/**
 * Funzione unificata per aggiornare documenti Firebase
 */
const updateFirebaseDoc = async (collectionName, docId, data, options = {}) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const timestamp = new Date().valueOf();

    const updateData = options.includeTimestamp ? { ...data, timestamp } : data;

    await setDoc(docRef, updateData, { merge: true });

    // Aggiorna timestamp in Updates se richiesto
    if (options.updateTimestamp) {
      const updatesRef = doc(
        db,
        "Updates",
        `${collectionName.toLowerCase()}Times`,
      );
      const timestampField = `${collectionName.toLowerCase()}TimeStamp`;
      await setDoc(
        updatesRef,
        { [timestampField]: timestamp },
        { merge: true },
      );
    }

    return timestamp;
  } catch (error) {
    console.error(`Error updating ${collectionName}/${docId}:`, error);
    throw error;
  }
};
