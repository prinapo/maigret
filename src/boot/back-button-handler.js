import { Platform } from "quasar";

// Una semplice variabile reattiva per tenere traccia del gestore di chiusura attivo
// Non usiamo ref() qui perché questo non è un componente Vue, ma un semplice modulo JS.
// Esportiamo un oggetto che può essere modificato globalmente.
export const backButtonHandler = {
  handler: null,
};

export default ({ app }) => {
  if (Platform.is.capacitor) {
    document.addEventListener("backbutton", (evt) => {
      // Se c'è un gestore attivo (es. un dialog aperto), lo esegue
      if (backButtonHandler.handler) {
        evt.preventDefault(); // Impedisce la navigazione o la chiusura dell'app
        backButtonHandler.handler();
      }
      // Altrimenti, non fa nulla e lascia che Capacitor gestisca l'evento
      // (es. tornare indietro nella cronologia del router).
    }, false);
  }
};