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
        this.$patch((state) => {
          state.bibliografia[bookIndex].posseduto = newValue;
        });
      } else {
        console.error("Book not found in bibliografia.");
      }
    },
    // Update edizioni for a specific book
    updateEdizioni(bookId, newEdizioni) {
      const bookIndex = this.bibliografia.findIndex(
        (book) => book.id === bookId,
      );
      if (bookIndex !== -1) {
        this.$patch((state) => {
          state.bibliografia[bookIndex].edizioni = newEdizioni;
        });
      } else {
        console.error("Book not found in bibliografia.");
      }
    },
    // Remove a specific edizione from a book
    removeEdizione(bookId, uuid) {
      const bookIndex = this.bibliografia.findIndex(
        (book) => book.id === bookId,
      );
      if (bookIndex !== -1) {
        this.$patch((state) => {
          state.bibliografia[bookIndex].edizioni = state.bibliografia[
            bookIndex
          ].edizioni.filter((edizione) => edizione.uuid !== uuid);
        });
      } else {
        console.error("Book not found in bibliografia.");
      }
    },
    updateBookDetail(bookId, itemId, value) {
      const index = this.bibliografia.findIndex((book) => book.id === bookId);
      if (index !== -1) {
        this.$patch((state) => {
          state.bibliografia[index][itemId] = value;
        });
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

export const useUserStore = defineStore("user", {
  state: () => ({
    userData: null,
  }),
  actions: {
    setUserData(newUserData) {
      this.userData = newUserData;
    },
    clearUserData() {
      this.userData = null;
    },
    updateUserField(field, value) {
      if (this.userData) {
        this.userData[field] = value;
      }
    },
  },
});
