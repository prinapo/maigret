import { fetchAndUpdateEditori } from "./fetchEditori";
import { fetchAndUpdateCollane } from "./fetchCollane";
import { fetchAndUpdateCovers } from "./fetchCovers";
import { fetchUserData } from "./fetchUserData";
import { fetchAndUpdateBibliografia } from "./fetchBibliografia";
import { Dialog, Dark } from "quasar";
import { useUserSettingsStore } from "../store/userSettings"; // Importa lo store

export async function initializeData() {
  let messages = [];
  let dialogRef = null;

  const updatePopup = (message) => {
    messages.push(message);
    if (dialogRef) {
      dialogRef.update({
        message: messages.join("<br>"),
        html: true,
      });
    } else {
      dialogRef = Dialog.create({
        title: "Current Activities",
        message: messages.join("<br>"),
        persistent: true,
        ok: false,
        html: true,
      });
    }
  };

  try {
    updatePopup("Starting data fetch...");

    const userSettingsStore = useUserSettingsStore();
    await userSettingsStore.loadSettings();

    // Applica il tema scuro se necessario
    Dark.set(userSettingsStore.theme === "dark");

    updatePopup("Fetching Editori...");
    const editoriResponse = await fetchAndUpdateEditori();
    updatePopup(editoriResponse);

    updatePopup("Fetching Collane...");
    const collaneResponse = await fetchAndUpdateCollane();
    updatePopup(collaneResponse);

    updatePopup("Fetching Covers...");
    const coversResponse = await fetchAndUpdateCovers();
    updatePopup(coversResponse);

    updatePopup("Fetching User Data...");
    const userDataResponse = await fetchUserData();
    updatePopup(userDataResponse);

    updatePopup("Fetching Bibliografia...");
    const bibliografiaResponse =
      await fetchAndUpdateBibliografia(userDataResponse);
    updatePopup(bibliografiaResponse);
    //image cache is managed within the fetchAndUpdateBibliografia function

    updatePopup("All tasks completed successfully!");

    setTimeout(() => {
      if (dialogRef) {
        dialogRef.hide();
      }
    }, 1000); // Close the popup after 3 seconds
  } catch (error) {
    console.error("Error during data fetching and updating:", error);
    updatePopup(`Error: ${error.message}`);
  }
}
