// src/listeners/realtimeListeners.js
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "src/boot/firebase";
import { db } from "src/boot/firebase";
import { doc, collection, onSnapshot, query } from "firebase/firestore";
import { updateThemeFromSettings } from "utils/theme"; // Add this import
import { useEditoriStore } from "stores/editoriStore";
import { useCoversStore } from "stores/coversStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useUserStore } from "stores/userStore";
import { useAuthStore } from "stores/authStore";

// Gestione centralizzata dei listener
const activeListeners = {
  userDoc: null,
  auth: null,
  editori: null,
  covers: null,
  collane: null,
  lingue: null,
  bibliografia: null,
};

// === 1) Listener per i dati "statici" con cleanup ===
export function setupDatabaseListeners(i18nInstance) {
  try {
    // Editori
    activeListeners.editori = onSnapshot(
      doc(db, "Editori", "default"),
      (docSnap) => {
        if (docSnap.exists()) {
          const editoriStore = useEditoriStore();
          editoriStore.updateEditori(docSnap.data().editore || []);
        }
      },
    );

    // Covers
    activeListeners.covers = onSnapshot(
      doc(db, "Covers", "default"),
      (docSnap) => {
        if (docSnap.exists()) {
          const coversStore = useCoversStore();
          coversStore.updateCovers(docSnap.data().cover || []);
        }
      },
    );

    // Collane
    activeListeners.collane = onSnapshot(
      doc(db, "Collane", "default"),
      (docSnap) => {
        if (docSnap.exists()) {
          const collaneStore = useCollaneStore();
          collaneStore.updateCollane(docSnap.data().collana || []);
        }
      },
    );

    // Lingue
    activeListeners.lingue = onSnapshot(
      doc(db, "Lingue", "default"),
      (docSnap) => {
        if (docSnap.exists()) {
          const lingueStore = useLingueStore();
          lingueStore.updateLingue(docSnap.data().lingua || []);
        }
      },
    );

    // Bibliografia
    const bibliografiaStore = useBibliografiaStore();
    activeListeners.bibliografia = onSnapshot(
      query(collection(db, "Bibliografia")),
      (snapshot) => {
        const books = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        bibliografiaStore.updateBooksRaw(books);
      },
    );
  } catch (error) {
    console.error("Errore setup database listeners:", error);
    throw error;
  }
}

// === 2) Listener autenticazione con cleanup ===
function startUserDocListener(uid) {
  const userStore = useUserStore();

  if (activeListeners.userDoc) {
    activeListeners.userDoc();
    activeListeners.userDoc = null;
  }

  const userDocRef = doc(db, "Users", uid);
  activeListeners.userDoc = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      userStore.setUserDataFromDb(docSnap.data());
      // Apply theme after user data is loaded
      updateThemeFromSettings();
    } else {
      userStore.setUserDataFromDb({});
    }
  });
}

export function stopUserDocListener() {
  if (activeListeners.userDoc) {
    activeListeners.userDoc();
    activeListeners.userDoc = null;
  }
}

// ===============================
// GESTIONE STORE DI AUTENTICAZIONE E UTENTE
//
// authStore: gestisce SOLO lo stato di autenticazione Firebase (login, logout, loading, loggedIn, user base)
// userStore: gestisce SOLO i dati di profilo utente (ruolo, permessi, impostazioni, libri, ecc.)
//
// Nel listener di autenticazione:
//   - authStore.setUser: aggiorna solo i dati base di autenticazione (uid, email, emailVerified)
//   - authStore.setLoggedIn: aggiorna lo stato loggedIn
//   - userStore.setUser: aggiorna i dati base utente (uid, email, ecc.)
//   - userStore.ensureUserProfile: controlla/crea/aggiorna il profilo dettagliato su Firestore
//   - startUserDocListener: ascolta i cambiamenti del profilo utente su Firestore
// ===============================
export function setupAuthListener() {
  if (activeListeners.auth) return;

  activeListeners.auth = onAuthStateChanged(auth, async (firebaseUser) => {
    const userStore = useUserStore();
    const authStore = useAuthStore();

    if (firebaseUser) {
      // Aggiorna solo i dati base di autenticazione in authStore
      const authUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
      };
      authStore.setUser(authUserData);
      authStore.setLoggedIn(true);

      // Aggiorna i dati base utente in userStore
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified,
      };
      userStore.setUser(userData);

      // Controlla e crea il profilo utente se necessario
      try {
        await userStore.ensureUserProfile(firebaseUser);
      } catch (error) {
        console.error("Errore nella gestione del profilo utente:", error);
      }

      // Listener realtime sul documento utente
      startUserDocListener(firebaseUser.uid);
    } else {
      userStore.clearUser();
      authStore.clearUser();
      stopUserDocListener();
    }
  });
}

// === 3) Funzione unica da chiamare al boot ===
export function setupRealtimeListeners(i18nInstance) {
  setupDatabaseListeners(i18nInstance);
  setupAuthListener();
}

// === 4) CLEANUP GLOBALE ===
export function cleanupAllListeners(i18nInstance) {
  // Cleanup di tutti i listener attivi
  Object.keys(activeListeners).forEach((key) => {
    if (activeListeners[key]) {
      try {
        activeListeners[key]();
        activeListeners[key] = null;
      } catch (error) {
        console.error(`Error cleaning up ${key} listener:`, error);
      }
    }
  });
}

// === 5) Auto-cleanup su window unload ===
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () =>
    cleanupAllListeners(window.i18n),
  );

  // Per Hot Module Replacement durante sviluppo
  if (import.meta.hot) {
    import.meta.hot.dispose(() => cleanupAllListeners(window.i18n));
  }
}

// Solo per test
typeof window !== "undefined" && (window.__activeListeners = activeListeners);
export { activeListeners };
