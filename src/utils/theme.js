import { Dark } from "quasar";
import { useUserStore } from "stores/userStore";

export function updateThemeFromSettings() {
  // Ottieni lo store utente
  const userStore = useUserStore();

  // Recupera il valore del tema dallo store delle impostazioni
  // CORREZIONE: usa darkMode invece di theme
  const isDarkMode = userStore.settings.darkMode || false;

  // Se il tema non è uguale, aggiorna il tema di Quasar
  if (Dark.isActive !== isDarkMode) {
    Dark.set(isDarkMode);
  }
}

export function getUserTheme() {
  const userStore = useUserStore();
  return userStore.settings.theme;
}
