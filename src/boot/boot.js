import { boot } from "quasar/wrappers";
import FirebaseUploader from "../firebase/FirebaseUploader"; // Adjust the path as needed
import { createPinia } from "pinia";
import { fetchAndUpdateBibliografia } from "../utils/fetchBibliografia"; // Import the fetchDataAndUpdateLocalStorage function
import { fetchAndUpdateEditori } from "../utils/fetchEditori"; // Import the fetchDataAndUpdateLocalStorage function
import { fetchAndUpdateCollane } from "src/utils/fetchCollane";
import {
  Loading,

  // optional!, for example below
  // with custom spinner
  QSpinnerGears,
} from "quasar";
Loading.show();

export default boot(async ({ app }) => {
  // Initialize Pinia
  const pinia = createPinia();

  // Register FirebaseUploader component globally
  app.component("FirebaseUploader", FirebaseUploader);

  // Use Pinia globally in your app
  app.use(pinia);

  // Fetch data and update local storage
  try {
    await fetchAndUpdateBibliografia();
  } catch (error) {
    console.error(
      "Error fetching Bibliografia and updating local storage:",
      error,
    );
  }
  Loading.hide();

  try {
    await fetchAndUpdateEditori();
  } catch (error) {
    console.error("Error fetching Editori and updating local storage:", error);
  }
  try {
    await fetchAndUpdateCollane();
  } catch (error) {
    console.error("Error fetching Collane and updating local storage:", error);
  }
});
