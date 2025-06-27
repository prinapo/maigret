import { defineStore } from "pinia";

export const useLingueStore = defineStore("lingue", {
  state: () => ({
    lingue: [],
    error: null,
    lastError: null,
  }),
  actions: {
    updateLingue(newLingue) {
      try {
        if (!Array.isArray(newLingue)) {
          throw new Error("Lingue must be an array");
        }

        // Sort by label during save
        this.lingue = [...newLingue].sort((a, b) =>
          (a.label || "").localeCompare(b.label || ""),
        );

        this.lastError = null;
      } catch (error) {
        console.error("Error updating lingue:", error);
        this.lastError = error.message;
        throw error;
      }
    },
    clearLingue() {
      try {
        this.lingue = [];
        this.lastError = null;
      } catch (error) {
        console.error("Error clearing lingue:", error);
        this.lastError = error.message;
        throw error;
      }
    },
  },
});
