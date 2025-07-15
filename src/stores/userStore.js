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
import { i18n } from "src/boot/i18n";
import {
  getUserProfileFromFirebase,
  createUserProfileInFirebase,
  updateUserSettingsInFirebase,
  updateUserLastLoginInFirebase,
} from "../utils/firebaseDatabaseUtils";

export const useUserStore = defineStore("user", () => {
  const books = ref([]);
  const settings = ref({});
  const user = ref(null);
  const lastLogin = ref(null);

  function setUser(newUser) {
    user.value = newUser;
  }

  function setUserDataFromDb(userData) {
    books.value = userData.books || [];
    settings.value = userData.settings || {};
    if (userData.role !== undefined) {
      user.value = { ...user.value, role: userData.role };
    }
    if (userData.permissions !== undefined) {
      // Normalizza i permessi: array di stringhe
      let perms = userData.permissions;
      if (
        Array.isArray(perms) &&
        perms.length > 0 &&
        typeof perms[0] === "object" &&
        perms[0].value
      ) {
        perms = perms.map((p) => p.value);
      }
      user.value = { ...user.value, permissions: perms };
    }
    if (userData.displayName !== undefined) {
      user.value = { ...user.value, displayName: userData.displayName };
    }
    // Imposta la lingua globale se presente nelle impostazioni
    if (
      userData.settings &&
      userData.settings.language &&
      i18n &&
      i18n.global
    ) {
      i18n.global.locale.value = userData.settings.language;
    }
  }

  async function createUserProfile(newUser) {
    try {
      // Usa funzione centralizzata
      const userProfile = await createUserProfileInFirebase(newUser);
      setUserDataFromDb(userProfile);
      user.value = userProfile;
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
      // Usa funzione centralizzata
      const userData = await getUserProfileFromFirebase(userToEnsure.uid);
      if (!userData) {
        return await createUserProfile(userToEnsure);
      } else {
        setUserDataFromDb(userData);
        // Aggiorna la data dell'ultimo login
        await updateUserLastLoginInFirebase(userToEnsure.uid);
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
      if (!user.value || !user.value.uid) {
        throw new Error("User not logged in or UID not available.");
      }
      await updateUserSettingsInFirebase(
        user.value.uid,
        newSettings,
        settings.value,
      );
      settings.value = { ...settings.value, ...newSettings };
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  }

  function updateUserRole(role, permissions = []) {
    if (user.value) {
      let newPermissions = [];
      if (role === "superadmin") {
        newPermissions = [
          "manage_books",
          "manage_users",
          "manage_system",
          "view_analytics",
          "moderate_content",
          "export_data",
          "manage_roles",
          // superadmin NON ha collect_books di default
        ];
      } else if (role === "admin") {
        newPermissions = [
          "view_analytics",
          "moderate_content",
          "export_data",
          // admin NON ha manage_books, manage_users, manage_system, manage_roles
        ];
      } else if (role === "user") {
        // Un user può essere anche collector se ha collect_books
        if (permissions.includes("collect_books")) {
          newPermissions = ["collect_books"];
        } else {
          newPermissions = [];
        }
      }
      user.value = {
        ...user.value,
        role,
        permissions: newPermissions,
      };
    }
  }

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

  const canManageRoles = computed(() => {
    if (!user.value) return false;
    const role = user.value.role?.toLowerCase();
    return (
      role === "superadmin" ||
      (role === "admin" && user.value.permissions?.includes("manage_roles"))
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
    darkMode,
    isAdmin,
    isSuperAdmin,
    userRole,
    hasPermission,
    userPermissions,
    canCollectBooks,
    canManageBooks,
    canManageUsers,
    canManageRoles,
  };
});
