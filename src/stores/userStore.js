// src/stores/userStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  doc,
  setDoc,
  getDoc,
  getFirestore,
  updateDoc,
} from "firebase/firestore";

export const useUserStore = defineStore("user", () => {
  const books = ref([]);
  const settings = ref({});
  const user = ref(null);
  const lastLogin = ref(null);

  function setUser(newUser) {
    // console.log("[userStore] setUser called with:", newUser);
    user.value = newUser;
  }

  function setUserDataFromDb(userData) {
    // console.log("[userStore] setUserDataFromDb called with:", userData);
    books.value = userData.books || [];
    settings.value = userData.settings || {};
    if (userData.role !== undefined) {
      user.value = { ...user.value, role: userData.role };
    }
    if (userData.permissions !== undefined) {
      user.value = { ...user.value, permissions: userData.permissions };
    }
  }

  async function createUserProfile(newUser) {
    try {
      const db = getFirestore();

      const userProfile = {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName || "",
        photoURL: newUser.photoURL || "",
        role: "user", // Ruolo base è user
        permissions: [], // Nessun permesso per i nuovi utenti
        books: [],
        settings: {
          darkMode: false,
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(doc(db, "Users", newUser.uid), userProfile, { merge: true });
      setUserDataFromDb(userProfile);
      user.value = userProfile;

      // console.log("Profilo utente creato con successo:", newUser.uid);
      return userProfile;
    } catch (error) {
      console.error("Errore nella creazione del profilo utente:", error);

      if (error.code === "permission-denied") {
        console.error(
          "Errore di permessi: verifica le regole di sicurezza Firestore",
        );
      }

      throw error;
    }
  }

  async function ensureUserProfile(userToEnsure) {
    try {
      const db = getFirestore();

      const userDocRef = doc(db, "Users", userToEnsure.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // console.log("Profilo utente non trovato, creazione in corso...");
        return await createUserProfile(userToEnsure);
      } else {
        const userData = userDoc.data();
        setUserDataFromDb(userData);

        // Aggiorna la data dell'ultimo login
        await updateDoc(userDocRef, {
          lastLogin: new Date().toISOString(),
        });

        return userData;
      }
    } catch (error) {
      console.error(
        "Errore nel controllo/creazione del profilo utente:",
        error,
      );
      throw error;
    }
  }

  function clearUser() {
    user.value = null;
    books.value = [];
    settings.value = {};
  }

  async function updateSettings(newSettings) {
    try {
      const db = getFirestore();

      if (!user.value || !user.value.uid) {
        throw new Error("User not logged in or UID not available.");
      }

      const userDocRef = doc(db, "Users", user.value.uid);
      await updateDoc(userDocRef, {
        settings: { ...settings.value, ...newSettings },
      });

      settings.value = { ...settings.value, ...newSettings };
      // console.log("User settings updated successfully:", settings.value);
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  }

  function updateUserRole(role, permissions = []) {
    if (user.value) {
      const newPermissions =
        role === "superadmin"
          ? [
              "manage_books",
              "manage_users",
              "manage_system",
              "view_analytics",
              "moderate_content",
              "export_data",
              "manage_roles",
              "collect_books",
            ]
          : permissions;

      user.value = {
        ...user.value,
        role,
        permissions: newPermissions,
      };
    }
  }

  const posseduta = computed(() => (bookId, editionId) => {
    const book = books.value.find((b) => b.bookId === bookId);
    const ed = book?.edizioni.find((e) => e.id === editionId);
    return ed?.posseduta || false;
  });

  const darkMode = computed(() => settings.value.darkMode ?? false);

  const isAdmin = computed(() => {
    if (!user.value) return false;
    return user.value.role?.toLowerCase() === "admin";
  });

  const isSuperAdmin = computed(() => {
    if (!user.value) return false;
    return user.value.role?.toLowerCase() === "superadmin";
  });

  const userRole = computed(() => {
    return user.value?.role || "user";
  });

  const hasPermission = computed(() => (permission) => {
    if (!user.value) return false;

    const role = user.value.role?.toLowerCase();
    const userPermissions = user.value.permissions || [];

    if (role === "superadmin" || role === "admin") {
      return userPermissions.includes(permission);
    }

    return false;
  });

  const userPermissions = computed(() => {
    return user.value?.permissions || [];
  });

  const canCollectBooks = computed(() => {
    if (!user.value) return false;
    return user.value.permissions?.includes("collect_books") || false;
  });

  const canManageBooks = computed(() => {
    if (!user.value) return false;
    const role = user.value.role?.toLowerCase();
    return (
      role === "superadmin" ||
      (role === "admin" && user.value.permissions?.includes("manage_books"))
    );
  });

  const canManageUsers = computed(() => {
    if (!user.value) return false;
    const role = user.value.role?.toLowerCase();
    return (
      role === "superadmin" ||
      (role === "admin" && user.value.permissions?.includes("manage_users"))
    );
  });

  return {
    books,
    settings,
    user,
    lastLogin,
    setUser,
    setUserDataFromDb,
    createUserProfile,
    ensureUserProfile,
    clearUser,
    updateSettings,
    updateUserRole,
    posseduta,
    darkMode,
    isAdmin,
    isSuperAdmin,
    userRole,
    hasPermission,
    userPermissions,
    canCollectBooks,
    canManageBooks,
    canManageUsers,
  };
});
