import { defineStore } from "pinia";

export const useBibliografiaStore = defineStore("bibliografia", {
  state: () => ({
    bibliografia: [],
  }),
  actions: {
    // Update bibliografia state with new data
    updateBibliografia(newBibliografia) {
      this.bibliografia = newBibliografia;
    },
    // Clear bibliografia state
    clearBibliografia() {
      this.bibliografia = [];
    },
  },
});

export const useEditoriStore = defineStore("editori", {
  state: () => ({
    editori: [],
  }),
  actions: {
    // Update editori state with new data
    updateEditori(newEditori) {
      this.editori = newEditori;
    },
    // Clear editori state
    clearEditori() {
      this.editori = [];
    },
  },
});
