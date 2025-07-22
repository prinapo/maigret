import { onMounted, onBeforeUnmount } from "vue";
import { backButtonHandler } from "boot/back-button-handler";

/**
 * @param {Function} callback La funzione da eseguire quando il pulsante back viene premuto.
 * @param {Function} condition Una funzione che ritorna true se il gestore deve essere attivo.
 */
export function useBackButton(callback, condition = () => true) {
  const setHandler = () => {
    if (condition()) {
      backButtonHandler.handler = callback;
    }
  };

  const clearHandler = () => {
    // Rimuove il gestore solo se è quello attualmente impostato
    if (backButtonHandler.handler === callback) {
      backButtonHandler.handler = null;
    }
  };

  onMounted(() => {
    // Imposta il gestore quando il componente è montato e la condizione è vera
    setHandler();
  });

  onBeforeUnmount(() => {
    // Pulisce il gestore quando il componente viene distrutto
    clearHandler();
  });

  // Ritorna le funzioni per un controllo manuale, se necessario
  return { setHandler, clearHandler };
}