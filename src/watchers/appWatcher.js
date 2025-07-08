// src/watchers/bibliografiaWatcher.js
import { watch } from "vue";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useUserStore } from "stores/userStore";
import { updateThemeFromSettings } from "utils/theme";

export function setupAppWatcher() {
  //console.log("appWatcher: setupAppWatcher called");
  const bibliografiaStore = useBibliografiaStore();
  const userStore = useUserStore();

  // Lancia una volta al montaggio, e poi ogni volta che cambia qualcosa
  watch(
    () => [bibliografiaStore.booksRaw, userStore.books],
    () => {
      // console.log('[appWatcher] Watcher triggered: booksRaw or userStore.books changed');
      mergeBibliografiaConUtente();
    },
    { deep: true }, // Removed immediate: true
  );
  // Nuovo watcher per il tema
  watch(
    () => userStore.settings.darkMode,
    (newDarkMode) => {
      if (newDarkMode !== undefined) {
        //console.log("appWatcher: Tema cambiato:", newDarkMode);
        updateThemeFromSettings();
      }
    },
    { immediate: true },
  );
  function mergeBibliografiaConUtente() {
    // console.log('[appWatcher] mergeBibliografiaConUtente called');
    // DEBUG: loggo i dati in ingresso
    const booksRaw = bibliografiaStore.booksRaw || [];
    const booksUtente = userStore.books || [];
    const defaultBookCoverTypeId = "qNvdwFMLNt2Uz7JjqTjacu";
    const merged = booksRaw.map((book, idx) => {
      // Trovo il corrispondente record utente (se esiste)
      const userBook = booksUtente.find((b) => b.bookId === book.id);
      // Ricreo l'array di edizioni, mantendo tutti i campi originali di `ed` e aggiungendo `posseduta`.
      const edizioniConPossesso = (book.edizioni || []).map((ed) => {
        const posseduta =
          userBook?.edizioni?.some(
            (ue) =>
              ue.uuid === ed.uuid &&
              (ue.posseduta === true || ue.posseduto === true),
          ) ?? false;
        return {
          ...ed,
          posseduta,
        };
      });
      const posseduto = edizioniConPossesso.some((ed) => ed.posseduta === true);

      // Calcolo defaultImageName dinamicamente
      let defaultImageName = "placeholder.jpg";
      if (Array.isArray(book.images) && book.images.length > 0) {
        const mainCover = book.images.find(
          (img) => img.coverTypeId === defaultBookCoverTypeId,
        );
        if (mainCover && mainCover.name) {
          defaultImageName = mainCover.name;
        } else {
          defaultImageName = book.images[0].name || "placeholder.jpg";
        }
      }

      const mergedBook = {
        ...book,
        edizioni: edizioniConPossesso,
        posseduto,
        defaultImageName,
      };
      return mergedBook;
    });
    bibliografiaStore.updateBibliografia(merged);
  }
}
