// src/watchers/bibliografiaWatcher.js
import { watch } from "vue";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useUserStore } from "stores/userStore";
import { updateThemeFromSettings } from "utils/theme";

export function setupAppWatcher() {
  console.log('appWatcher: setupAppWatcher called');
  const bibliografiaStore = useBibliografiaStore();
  const userStore = useUserStore();

  // Lancia una volta al montaggio, e poi ogni volta che cambia qualcosa
  watch(
    () => [bibliografiaStore.booksRaw, userStore.books],
    () => {
      console.log('appWatcher: bibliografiaStore.booksRaw or userStore.books changed');
      mergeBibliografiaConUtente();
    },
    { deep: true }, // Removed immediate: true
  );
  // Nuovo watcher per il tema
  watch(
    () => userStore.settings.darkMode,
    (newDarkMode) => {
      if (newDarkMode !== undefined) {
        console.log("appWatcher: Tema cambiato:", newDarkMode);
        updateThemeFromSettings();
      }
    },
    { immediate: true },
  );
  function mergeBibliografiaConUtente() {
    console.log('appWatcher: mergeBibliografiaConUtente called');
    const booksRaw = bibliografiaStore.booksRaw || [];
    const booksUtente = userStore.books || [];

    const merged = booksRaw.map((book) => {
      // Trovo il corrispondente record utente (se esiste)
      const userBook = booksUtente.find((b) => b.bookId === book.id);

      // Ricreo l'array di edizioni, mantendo tutti i campi originali di `ed` e aggiungendo `posseduta`.
      const edizioniConPossesso = (book.edizioni || []).map((ed) => {
        const posseduta =
          userBook?.edizioni?.some((ue) => ue.id === ed.id && ue.posseduta) ??
          false;
        return {
          // SPREAD di tutti i campi originali di `ed`
          ...ed,
          // sovrascrivo/aggiungo la proprietà `posseduta`
          posseduta,
        };
      });

      // Se almeno un’edizione è posseduta, allora `posseduto = true`
      const posseduto = edizioniConPossesso.some((ed) => ed.posseduta === true);

      // Restituisco TUTTI i campi di `book`, sostituendo l’array `edizioni` e aggiungendo `posseduto`
      return {
        // SPREAD di tutti i campi originali di `book`
        ...book,
        // sovrascrivo l’array di edizioni con quello aggiornato
        edizioni: edizioniConPossesso,
        // aggiungo il campo `posseduto`
        posseduto,
      };
    });

    bibliografiaStore.updateBibliografia(merged);
    console.log('appWatcher: bibliografiaStore.updateBibliografia called');
  }
}
