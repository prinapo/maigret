// src/stores/bibliografiaStore.js

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useUserStore } from "stores/userStore";

export const useBibliografiaStore = defineStore("bibliografia", () => {
  // booksRaw = lista dei libri da Firestore (senza dati utente)
  const booksRaw = ref([]);

  // bibliografia = lista completa con dati utente (merged)
  const bibliografia = ref([]);

  const isLoaded = ref(false);

  function updateBooksRaw(firestoreBooks) {
    booksRaw.value = firestoreBooks;
    isLoaded.value = true;
  }

  function updateBibliografia(mergedBooks) {
    // Patch: aggiorna solo se i dati sono effettivamente diversi
    const current = JSON.stringify(bibliografia.value);
    const next = JSON.stringify(mergedBooks);
    if (current === next) {
      // Nessun cambiamento reale, non aggiornare la reference!
      return;
    }
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
    isLoaded,
  };
});
