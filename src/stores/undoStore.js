import { defineStore } from "pinia";
import { restoreImageFromTrashAndSync } from "utils/firebaseDatabaseUtils";
import { Notify } from "quasar";

export const useUndoStore = defineStore("undo", {
  state: () => ({
    lastUndoOperation: null, // dati per undo locale
  }),
  actions: {
    setLastUndo(operation) {
      this.lastUndoOperation = operation;
    },
    clearUndo() {
      this.lastUndoOperation = null;
    },
    async undoLastOperation() {
      if (!this.lastUndoOperation) return null;

      const { bookId, operationType, imageData, imageIndex } =
        this.lastUndoOperation;

      try {
        if (operationType === "deleteImage") {
          const updatedImages = await restoreImageFromTrashAndSync(
            bookId,
            imageData,
            imageIndex,
          );

          Notify.create({
            message: `Immagine ripristinata: ${imageData.name}`,
            color: "green",
          });

          this.clearUndo();

          return updatedImages; // ✅ restituisce le immagini aggiornate
        }
      } catch (err) {
        Notify.create({
          message: "Errore durante l'annullamento",
          color: "negative",
        });
      }

      return null;
    },
  },
});
