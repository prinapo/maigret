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
    // Update the posseduto field for a book in bibliografia
    updatePosseduto(bookId, newValue) {
      const bookIndex = this.bibliografia.findIndex(
        (book) => book.id === bookId,
      );
      if (bookIndex !== -1) {
        this.bibliografia[bookIndex].possessed = newValue;
      } else {
        console.error("Book not found in bibliografia.");
      }
    },
    updateEdizioni(newEdizioni) {
      this.edizioni = newEdizioni;
    },
    removeEdizione(uuid) {
      this.edizioni = this.edizioni.filter(
        (edizione) => edizione.uuid !== uuid,
      );
    },
    updateBookDetail(bookId, itemId, value) {
      const index = this.bibliografia.findIndex((book) => book.id === bookId);
      if (index !== -1) {
        // Assuming the item exists in the bibliografia array
        this.bibliografia[index][itemId] = value;
      } else {
        console.error("Book not found in bibliografia.");
      }
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

export const useCoversStore = defineStore("covers", {
  state: () => ({
    covers: [],
  }),
  actions: {
    // Update covers state with new data
    updateCovers(newCovers) {
      this.covers = newCovers;
    },
    // Clear editori state
    clearCovers() {
      this.covers = [];
    },
  },
});
