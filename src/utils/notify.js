import { Notify } from "quasar";

export function showNotifyPositive(message, options = {}) {
  Notify.create({
    type: "positive",
    message,
    position: "top",
    ...options,
  });
}

export function showNotifyNegative(message, options = {}) {
  Notify.create({
    type: "negative",
    message,
    position: "top",
    ...options,
  });
}

export function showNotifyUndo(message, undoLabel, onUndo, options = {}) {
  Notify.create({
    message,
    color: "primary",
    timeout: 6000,
    position: "bottom",
    actions: [
      {
        label: undoLabel || "Undo",
        color: "white",
        handler: onUndo,
      },
    ],
    ...options,
  });
}
