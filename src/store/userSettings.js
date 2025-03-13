import { defineStore } from "pinia";
import { getUserData, setUserData } from "../utils/indexedDB"; // Correzione del percorso

export const useUserSettingsStore = defineStore("userSettings", {
  state: () => ({
    theme: "light", // Impostazione predefinita
    adminMode: false, // Impostazione predefinita
  }),
  actions: {
    async loadSettings() {
      try {
        const userData = await getUserData();
        if (userData) {
          this.theme = userData.theme || "light";
          this.adminMode = userData.adminMode ?? false; // Usa ?? per i booleani
        }
      } catch (error) {
        console.error(
          "Errore durante il caricamento delle impostazioni:",
          error,
        );
      }
    },
    async saveSettings() {
      try {
        await setUserData({
          theme: this.theme,
          adminMode: this.adminMode,
        });
      } catch (error) {
        console.error(
          "Errore durante il salvataggio delle impostazioni:",
          error,
        );
      }
    },
    setTheme(theme) {
      this.theme = theme;
      this.saveSettings();
    },
    setAdminMode(isAdmin) {
      this.adminMode = isAdmin;
      this.saveSettings();
    },
  },
});
