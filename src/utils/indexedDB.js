import { openDB } from "idb";

// Add this utility function at the top
const toPlainObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => toPlainObject(item));
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, toPlainObject(value)]),
    );
  }
  return obj;
};
const dbPromise = openDB("maigret-db", 6, {
  // Incremented version number to 6
  upgrade(db) {
    if (!db.objectStoreNames.contains("bibliografia")) {
      db.createObjectStore("bibliografia", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("editori")) {
      db.createObjectStore("editori", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("collane")) {
      db.createObjectStore("collane", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("covers")) {
      db.createObjectStore("covers", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("timestamps")) {
      db.createObjectStore("timestamps", { keyPath: "key" });
    }
    if (!db.objectStoreNames.contains("userData")) {
      db.createObjectStore("userData", { keyPath: "id" });
    }
  },
});

export const cacheImage = async (fileName, imageUrl, timestamp) => {
  try {
    // Fetch the image data
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Ensure IndexedDB is initialized
    const db = await dbPromise;
    const tx = db.transaction("images", "readwrite");

    // Store the image as a Blob (instead of Base64)
    await tx.store.put({ fileName, blob, timestamp });

    // Wait for the transaction to complete
    await tx.done;
  } catch (error) {
    console.error("Error caching image:", fileName, error);
  }
};
export const getCachedImage = async (fileName) => {
  const db = await dbPromise;
  return db.get("images", fileName);
};

export const getAllCachedImages = async () => {
  const db = await dbPromise;
  const tx = db.transaction("images", "readonly");
  const images = await tx.store.getAll();
  await tx.done;
  return images;
};
export const removeFromCache = async (fileName) => {
  const db = await dbPromise;
  const tx = db.transaction("images", "readwrite");
  await tx.store.delete(fileName);
  await tx.done;
};
export const setBibliografia = async (bibliografia) => {
  try {
    const db = await dbPromise;
    const tx = db.transaction("bibliografia", "readwrite");
    const plainBibliografia = toPlainObject(bibliografia);

    // Validate data before saving
    const validBooks = plainBibliografia.filter((book) => {
      if (!book.id) {
        console.error("Book missing ID:", book);
        return false;
      }
      return true;
    });

    // Log the operation

    // Update books in IndexedDB
    await Promise.all(
      validBooks.map((book) => {
        return tx.store.put(book);
      }),
    );

    await tx.done;
  } catch (error) {
    console.error("Error updating bibliografia:", error);
    throw error;
  }
};

export const getBibliografia = async () => {
  const db = await dbPromise;
  return db.getAll("bibliografia");
};

export const setEditori = async (editori) => {
  const db = await dbPromise;
  const tx = db.transaction("editori", "readwrite");
  const plainEditori = toPlainObject(editori);

  await Promise.all(
    plainEditori.map((editore) => {
      if (!editore.id) {
        throw new Error("Each editore must have an 'id' field");
      }
      return tx.store.put(editore);
    }),
  );
  await tx.done;
};

export const getEditori = async () => {
  const db = await dbPromise;
  return db.getAll("editori");
};

export const setCollane = async (collane) => {
  const db = await dbPromise;
  const tx = db.transaction("collane", "readwrite");
  const plainCollane = toPlainObject(collane);

  await Promise.all(
    plainCollane.map((collana) => {
      if (!collana.id) {
        console.error("Missing 'id' field in collana:", collana);
        throw new Error("Each collana must have an 'id' field");
      }
      return tx.store.put(collana);
    }),
  );
  await tx.done;
};

export const getCollane = async () => {
  const db = await dbPromise;
  return db.getAll("collane");
};

export const setCovers = async (covers) => {
  const db = await dbPromise;
  const tx = db.transaction("covers", "readwrite");
  const plainCovers = toPlainObject(covers);

  await Promise.all(
    plainCovers.map((cover) => {
      if (!cover.id) {
        throw new Error("Each cover must have an 'id' field");
      }
      return tx.store.put(cover);
    }),
  );
  await tx.done;
};

export const getCovers = async () => {
  const db = await dbPromise;
  return db.getAll("covers");
};

// Functions to set and get last update timestamps
export const setLastUpdate = async (key, timestamp) => {
  const db = await dbPromise;

  const tx = db.transaction("timestamps", "readwrite");
  await tx.store.put({ key, value: timestamp });
  await tx.done;
};
export const getLastUpdate = async (key) => {
  const db = await dbPromise;
  const tx = db.transaction("timestamps", "readonly");
  const entry = await tx.store.get(key);
  await tx.done;
  return entry ? entry.value : 0;
};

export const setUserData = async (userData) => {
  try {
    const db = await dbPromise;

    const tx = db.transaction("userData", "readwrite");
    await tx.store.put({ id: "currentUser", ...userData });
    await tx.done;
  } catch (error) {
    throw error;
  }
};

export const getUserData = async () => {
  const db = await dbPromise;
  const tx = db.transaction("userData", "readonly");
  const userData = await tx.store.get("currentUser");
  await tx.done;
  return userData;
};

// Clear all data from IndexedDB
export const clearIndexedDB = async () => {
  const db = await dbPromise;
  const tx = db.transaction(
    ["images", "bibliografia", "editori", "collane", "covers", "timestamps"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("images").clear(),
    tx.objectStore("bibliografia").clear(),
    tx.objectStore("editori").clear(),
    tx.objectStore("collane").clear(),
    tx.objectStore("covers").clear(),
    tx.objectStore("timestamps").clear(),
  ]);
  await tx.done;
};
