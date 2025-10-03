import { db, auth } from "boot/firebase";
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
  deleteField,
} from "firebase/firestore";
import { showNotifyPositive, showNotifyNegative } from "utils/notify";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { moveStorageObject } from "utils/firebaseStorageUtils";
import { i18n } from "boot/i18n";
import { saveAs } from "file-saver";
import { onSnapshot } from "firebase/firestore";
import { Platform } from "quasar";
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
 * Funzione generica per aggiornare/mergiare un documento in una collezione
 * @param {string} collectionName - Nome della collezione
 * @param {string} docId - ID del documento
 * @param {Object} data - Dati da aggiornare (id/timestamp verranno rimossi)
 * @param {Object} options - Opzioni aggiuntive (es. includeTimestamp)
 */
export const updateDocInCollection = async (
  collectionName,
  docId,
  data,
  options = {},
) => {
  try {
    // Rimuovi id e timestamp dai dati
    const { id, timestamp, ...cleanData } = data;
    const docRef = doc(db, collectionName, docId);
    const payload = { ...cleanData };
    if (options.includeTimestamp) {
      payload.timestamp = Date.now();
    }
    await setDoc(docRef, payload, { merge: true });
    // Aggiorna timestamp in Updates se richiesto
    if (options.updateTimestamp) {
      const updatesRef = doc(
        db,
        "Updates",
        `${collectionName.toLowerCase()}Times`,
      );
      const timestampField = `${collectionName.toLowerCase()}TimeStamp`;
      // await setDoc(updatesRef, { [timestampField]: Date.now() }, { merge: true });
    }
  } catch (error) {
    console.error(`Error updating ${collectionName}/${docId}:`, error);
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
  await updateDocInCollection(
    "Bibliografia",
    docId,
    { ...data, timestamp },
    {},
  );
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
    showNotifyPositive(
      i18n.global.t("firebase.updateSuccess", { collection: collectionName }),
    );

    return true;
  } catch (error) {
    console.error(`Error syncing ${collectionName}:`, error);
    showNotifyNegative(
      i18n.global.t("firebase.updateFail", {
        collection: collectionName,
        error: error.message,
      }),
    );
    throw error;
  }
};

// Funzione per rimuovere i campi non desiderati prima di salvare su Firebase
export function sanitizeBookForFirebase(book) {
  // Rimuovi i campi non desiderati dal libro
  const { defaultImageName, posseduto, timestamp, ...rest } = book;
  // Rimuovi i campi anche da edizioni e immagini
  if (Array.isArray(rest.edizioni)) {
    rest.edizioni = rest.edizioni.map((ed) => {
      const { posseduto, timestamp, ...edRest } = ed;
      if (Array.isArray(edRest.images)) {
        edRest.images = edRest.images.map((img) => {
          const { timestamp, ...imgRest } = img;
          return imgRest;
        });
      }
      return edRest;
    });
  }
  if (Array.isArray(rest.images)) {
    rest.images = rest.images.map((img) => {
      const { timestamp, ...imgRest } = img;
      return imgRest;
    });
  }
  return rest;
}

/**
 * Updates a single book document in Firebase
 * @param {string} docId - The document ID
 * @param {Object} data - The data to update (should include timestamp)
 * @param {number} timestamp - The update timestamp
 * @returns {Promise<void>}
 */
const updateBookDoc = async (docId, data, timestamp) => {
  await updateDocInCollection(
    "Bibliografia",
    docId,
    { ...data, timestamp },
    {},
  );
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

    showNotifyPositive(
      i18n.global.t("firebase.updatedLocally", { collection: collectionName }),
    );
  } catch (error) {
    console.error(
      `Error handling offline update for ${collectionName}:`,
      error,
    );
    showNotifyNegative(
      i18n.global.t("firebase.updateLocalFail", {
        collection: collectionName,
        error: error.message,
      }),
    );
    throw error;
  }
};

function getImageFileName(image) {
  return !image?.id || image.id === "placeholder"
    ? "placeholder.jpg"
    : image.id + ".jpg";
}

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

  const imageName = getImageFileName(imageToDelete);
  const isPlaceholder = imageName === "placeholder.jpg";

  if (!isPlaceholder) {
    const imagePath = `images/${imageName}`;
    const thumbnailPath = `thumbnails/${imageName}`;
    const trashImagePath = `trash/${imageName}`;
    const trashThumbnailPath = `trash-thumbnails/${imageName}`;

    try {
      // Sposta i file in parallelo con timeout ridotto su mobile
      await Promise.all([
        moveStorageObject(imagePath, trashImagePath),
        moveStorageObject(thumbnailPath, trashThumbnailPath),
      ]);
    } catch (error) {
      // Su mobile, se le operazioni di storage falliscono, logga ma continua
      if (Platform.is.mobile) {
        console.warn(
          `Storage operations failed on mobile for ${imageName}, continuing with deletion:`,
          error,
        );
      } else {
        throw error;
      }
    }
  }

  // Aggiorna array immagini senza quella cancellata
  const updatedImages = [...book.images];
  updatedImages.splice(imageIndex, 1);
  const updatedBook = { ...book, images: updatedImages };

  // Sincronizza il libro
  await updateDocInCollection(
    "Bibliografia",
    bookId,
    sanitizeBookForFirebase(updatedBook),
    { includeTimestamp: true },
  );

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
  const imageName = getImageFileName(imageData);

  // Se l'immagine è placeholder.jpg, salto lo spostamento
  if (imageName === "placeholder.jpg") {
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
  await updateDocInCollection(
    "Bibliografia",
    bookId,
    sanitizeBookForFirebase(updatedBook),
    { includeTimestamp: true },
  );
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
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      { images: imagesArray },
      { includeTimestamp: true },
    );

    // Sincronizza con Pinia
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      sanitizeBookForFirebase({ ...bookData, images: imagesArray }),
      { includeTimestamp: true },
    );
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

    showNotifyPositive(i18n.global.t("firebase.bookCreated"));

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
 * Aggiorna dati utente in Firebase (campo singolo o oggetto)
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Promise<void>}
 */
export const updateUserInFirebase = async (userId, updateData) => {
  try {
    await updateDocInCollection("Users", userId, updateData, { merge: true });
    showNotifyPositive(i18n.global.t("firebase.userUpdated"));
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Sposta un utente in trash (soft delete)
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} - I dati utente spostati in trash
 */
export const moveUserToTrash = async (userId) => {
  try {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const userData = userSnap.data();
    await setDocInCollection("UsersTrash", userId, userData);
    return userData;
  } catch (error) {
    console.error("Error moving user to trash:", error);
    throw error;
  }
};

/**
 * Ripristina un utente da UsersTrash a Users
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const restoreUserFromTrash = async (userId) => {
  try {
    const trashRef = doc(db, "UsersTrash", userId);
    const trashSnap = await getDoc(trashRef);
    if (!trashSnap.exists()) throw new Error("User not found in trash");
    const userData = trashSnap.data();
    await setDocInCollection("Users", userId, userData);
    await deleteDoc(trashRef);
  } catch (error) {
    console.error("Error restoring user from trash:", error);
    throw error;
  }
};

/**
 * Elimina un utente da Firebase (soft delete: sposta in trash)
 * @param {string} userId - ID dell'utente
 * @returns {Promise<void>}
 */
export const deleteUserFromFirebase = async (userId) => {
  try {
    // Sposta in trash
    await moveUserToTrash(userId);
    // Elimina da Users
    const userRef = doc(db, "Users", userId);
    await deleteDoc(userRef);

    showNotifyPositive(i18n.global.t("firebase.userDeleted"));
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
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Wrapper per setDoc con merge (default true)
 */
export const setDocInCollection = async (
  collectionName,
  docId,
  data,
  options = { merge: true },
) => {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, data, options);
};

/**
 * Scarica tutti i dati di una collezione come file JSON dal browser
 */
export const backupCollectionToJson = async (collectionName) => {
  const data = await fetchCollectionData(collectionName);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  saveAs(blob, `${collectionName}_${timestamp}.json`);
};

/**
 * Ripristina tutti i documenti di una collezione da un array JSON
 */
export const restoreCollectionFromJson = async (collectionName, jsonData) => {
  for (const doc of jsonData) {
    const { id, ...data } = doc;
    await setDocInCollection(collectionName, id, data, { merge: true });
  }
};

/**
 * Restituisce tutti i campi unici trovati nei documenti della collezione
 */
export const getAllFieldsInCollection = async (collectionName) => {
  const data = await fetchCollectionData(collectionName);
  const fields = new Set();
  data.forEach((doc) => {
    Object.keys(doc)
      .filter((f) => f !== "id") // escludi la chiave id
      .forEach((f) => fields.add(f));
  });
  return Array.from(fields);
};

/**
 * Elimina un campo da tutti i documenti della collezione
 */
export const removeFieldFromCollection = async (collectionName, field) => {
  const data = await fetchCollectionData(collectionName);
  let count = 0;
  for (const record of data) {
    if (record.id === undefined || record.id === null || record.id === "") {
      continue;
    }
    if (!(field in record)) {
      continue;
    }
    await updateDocInCollection(
      collectionName,
      String(record.id),
      { [field]: deleteField() },
      { merge: true },
    );
    count++;
  }
};

/**
 * Recupera tutti gli utenti eliminati (trash) da Firestore
 * @returns {Promise<Array>}
 */
export const fetchAllUsersTrash = async () => {
  try {
    const usersCollection = collection(db, "UsersTrash");
    const snapshot = await getDocs(usersCollection);

    return snapshot.docs.map((doc) => {
      const userData = {
        uid: doc.id,
        ...doc.data(),
      };
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
    console.error("Error fetching users trash:", error);
    throw error;
  }
};

/**
 * Crea un nuovo profilo utente in Firestore Users
 * @param {Object} newUser - Oggetto utente (deve contenere almeno uid, email, displayName)
 * @returns {Promise<Object>} - Il profilo utente appena creato
 */
export const createUserProfileInFirebase = async (newUser) => {
  if (!newUser || !newUser.uid) {
    throw new Error("createUserProfileInFirebase: manca l'UID dell'utente");
  }
  const userProfile = {
    uid: newUser.uid,
    email: newUser.email || "unknown@example.com",
    displayName: newUser.displayName || "Unknown User",
    role: "user",
    permissions: [],
    settings: {},
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
  await setDocInCollection("Users", newUser.uid, userProfile, { merge: true });
  return userProfile;
};

/**
 * Recupera il profilo utente dalla collezione Users dato l'uid
 * @param {string} uid
 * @returns {Promise<Object|null>} - I dati utente o null se non trovato
 */
export const getUserProfileFromFirebase = async (uid) => {
  if (!uid) return null;
  const userRef = doc(db, "Users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return { uid, ...userSnap.data() };
};

/**
 * Aggiorna il campo lastLogin dell'utente in Users
 * @param {string} uid
 * @returns {Promise<void>}
 */
export const updateUserLastLoginInFirebase = async (uid) => {
  if (!uid) return;
  await updateDocInCollection(
    "Users",
    uid,
    { lastLogin: Date.now() },
    { merge: true },
  );
};

/**
 * Aggiorna i settings dell'utente in Users
 * @param {string} uid
 * @param {Object} newSettings
 * @param {Object} [oldSettings] - opzionale, per merge lato client
 * @returns {Promise<void>}
 */
export const updateUserSettingsInFirebase = async (
  uid,
  newSettings,
  oldSettings = {},
) => {
  if (!uid) throw new Error("updateUserSettingsInFirebase: manca l'UID");
  const mergedSettings = { ...oldSettings, ...newSettings };
  await updateDocInCollection(
    "Users",
    uid,
    { settings: mergedSettings },
    { merge: true },
  );
};

/**
 * Recupera un documento da Firestore dato collection e id
 */
export const getDocFromFirebase = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  return await getDoc(docRef);
};

/**
 * Recupera una collezione da Firestore
 */
export const getCollectionFromFirebase = async (collectionName) => {
  const colRef = collection(db, collectionName);
  return await getDocs(colRef);
};

/**
 * Listener realtime su un documento
 */
export const onDocSnapshot = (collectionName, docId, callback) => {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, callback);
};

/**
 * Listener realtime su una collezione
 */
export const onCollectionSnapshot = (collectionName, callback) => {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, callback);
};

/**
 * Aggiorna il campo books dell'utente in Users
 * @param {string} uid
 * @param {Array} books
 * @returns {Promise<void>}
 */
export const updateUserBooksInFirebase = async (uid, books) => {
  if (!uid) throw new Error("updateUserBooksInFirebase: manca l'UID");
  await updateDocInCollection("Users", uid, { books }, { merge: true });
};

/**
 * Aggiorna un singolo campo di settings per l'utente su Firestore
 * @param {string} userId
 * @param {string} fieldKey
 * @param {any} value
 * @returns {Promise<void>}
 */
export const updateUserSettingInFirebase = async (userId, fieldKey, value) => {
  if (!userId)
    throw new Error("updateUserSettingInFirebase: manca l'UID dell'utente");
  await updateDocInCollection(
    "Users",
    userId,
    { [`settings.${fieldKey}`]: value },
    { merge: true },
  );
};
