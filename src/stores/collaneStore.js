import { defineStore } from "pinia";

export const useCollaneStore = defineStore("collane", {
  state: () => ({
    collane: [],
    error: null,
    lastError: null,
  }),
  actions: {
    updateCollane(newCollane) {
      try {
        if (!Array.isArray(newCollane)) {
          throw new Error("Collane must be an array");
        }

        // Ordina per nome durante il salvataggio
        this.collane = [...newCollane].sort((a, b) =>
          (a.collana || "").localeCompare(b.collana || ""),
        );

        this.lastError = null;
      } catch (error) {
        console.error("Error updating collane:", error);
        this.lastError = error.message;
        throw error;
      }
    },
    clearCollane() {
      try {
        this.collane = [];
        this.lastError = null;
      } catch (error) {
        console.error("Error clearing collane:", error);
        this.lastError = error.message;
        throw error;
      }
    },
  },
});
