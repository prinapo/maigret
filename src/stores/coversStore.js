import { defineStore } from "pinia";

export const useCoversStore = defineStore("covers", {
  state: () => ({
    covers: [],
    lastError: null,
  }),
  actions: {
    updateCovers(newCovers) {
      try {
        if (!Array.isArray(newCovers)) {
          throw new Error("Covers must be an array");
        }
        this.covers = newCovers;
        this.lastError = null;
      } catch (error) {
        console.error("Error updating covers:", error);
        this.lastError = error.message;
        throw error;
      }
    },
    clearCovers() {
      try {
        this.covers = [];
        this.lastError = null;
      } catch (error) {
        console.error("Error clearing covers:", error);
        this.lastError = error.message;
        throw error;
      }
    },
  },
});
