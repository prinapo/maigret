// src/stores/bibliografiaStore.js

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useUserStore } from './userStore';

export const useBibliografiaStore = defineStore("bibliografia", () => {
  // booksRaw = lista dei libri da Firestore (senza dati utente)
  const booksRaw = ref([]);

  // bibliografia = lista completa con dati utente (merged)
  const bibliografia = ref([]);

  function updateBooksRaw(firestoreBooks) {
    booksRaw.value = firestoreBooks;
  }

  function updateBibliografia(mergedBooks) {
    bibliografia.value = mergedBooks;
  }
  function clearBibliografia() {
    booksRaw.value = [];
    bibliografia.value = [];
  }
  const canAddImage = computed(() => {
    const userStore = useUserStore();
    return userStore.isSuperAdmin;
  });

  return {
    booksRaw,
    bibliografia,
    updateBooksRaw,
    updateBibliografia,
    clearBibliografia,
    canAddImage,
  };
});
