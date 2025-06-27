import { defineStore } from "pinia";

export const useEditoriStore = defineStore("editori", {
  state: () => ({
    editori: [],
    error: null,
    lastError: null,
  }),
  actions: {
    updateEditori(newEditori) {
      try {
        if (!Array.isArray(newEditori)) {
          throw new Error("Editori must be an array");
        }

        // Ordina per nome durante il salvataggio
        this.editori = [...newEditori].sort((a, b) =>
          (a.editore || "").localeCompare(b.editore || ""),
        );

        this.lastError = null;
      } catch (error) {
        console.error("Error updating editori:", error);
        this.lastError = error.message;
        throw error;
      }
    },
    clearEditori() {
      try {
        this.editori = [];
        this.lastError = null;
      } catch (error) {
        console.error("Error clearing editori:", error);
        this.lastError = error.message;
        throw error;
      }
    },
  },
});
