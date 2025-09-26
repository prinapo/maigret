// src/watchers/bibliografiaWatcher.js
import { watch } from "vue";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useUserStore } from "stores/userStore";
import { updateThemeFromSettings } from "utils/theme";

export function setupAppWatcher() {
  const bibliografiaStore = useBibliografiaStore();
  const userStore = useUserStore();

  // Lancia una volta al montaggio, e poi ogni volta che cambia qualcosa
  watch(
    () => [bibliografiaStore.booksRaw, userStore.books],
    () => {
      mergeBibliografiaConUtente();
    },
    { deep: true }, // Removed immediate: true
  );
  // Watcher per il tema (non immediato per evitare flicker al boot)
  watch(
    () => userStore.settings.darkMode,
    (newDarkMode) => {
      if (newDarkMode !== undefined) {
        updateThemeFromSettings();
      }
    },
    { immediate: false },
  );
  function mergeBibliografiaConUtente() {
    // DEBUG: loggo i dati in ingresso
    const booksRaw = bibliografiaStore.booksRaw || [];
    const booksUtente = userStore.books || [];
    const defaultBookCoverTypeId = "qNvdwFMLNt2Uz7JjqTjacu";
    const merged = booksRaw.map((book, idx) => {
      // Trovo il corrispondente record utente (se esiste)
      const userBook = booksUtente.find((b) => b.bookId === book.id);
      // Ricreo l'array di edizioni, mantendo tutti i campi originali di `ed` e aggiungendo `posseduto` coerente con Firebase.
      const edizioniConPossesso = (book.edizioni || []).map((ed) => {
        const posseduto =
          userBook?.edizioni?.some(
            (ue) => ue.uuid === ed.uuid && ue.posseduto === true,
          ) ?? false;
        return {
          ...ed,
          posseduto,
        };
      });
      const posseduto = edizioniConPossesso.some((ed) => ed.posseduto === true);

      function getImageFileName(img) {
        return !img?.id || img.id === "placeholder"
          ? "placeholder.jpg"
          : img.id + ".jpg";
      }

      // Calcolo defaultImageName dinamicamente
      let defaultImageName = "placeholder.jpg";
      if (Array.isArray(book.images) && book.images.length > 0) {
        const mainCover = book.images.find(
          (img) => img.coverTypeId === defaultBookCoverTypeId,
        );
        if (mainCover && mainCover.id) {
          defaultImageName = getImageFileName(mainCover);
        } else {
          defaultImageName = getImageFileName(book.images[0]);
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
