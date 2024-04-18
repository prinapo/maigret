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
    // Add a new book to bibliografia
    addBook(book) {
      this.bibliografia.push(book);
    },
    // Remove a book from bibliografia by ID
    removeBook(bookId) {
      this.bibliografia = this.bibliografia.filter(
        (book) => book.id !== bookId,
      );
    },
    updateEdizioni(newEdizioni) {
      this.edizioni = newEdizioni;
    },
    removeEdizione(uuid) {
      this.edizioni = this.edizioni.filter(
        (edizione) => edizione.uuid !== uuid,
      );
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

export const useCollaneStore = defineStore("collane", {
  state: () => ({
    collane: [],
  }),
  actions: {
    // Update editori state with new data
    updateCollane(newCollane) {
      this.collane = newCollane;
    },
    // Clear editori state
    clearCollane() {
      this.collane = [];
    },
  },
});
