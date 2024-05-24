import { boot } from "quasar/wrappers";
import FirebaseUploader from "../firebase/FirebaseUploader"; // Adjust the path as needed
import { createPinia } from "pinia";
import { fetchAndUpdateBibliografia } from "../utils/fetchBibliografia"; // Import the fetchDataAndUpdateLocalStorage function
import { fetchAndUpdateEditori } from "../utils/fetchEditori"; // Import the fetchDataAndUpdateLocalStorage function
import { fetchAndUpdateCollane } from "../utils/fetchCollane";
import { fetchAndUpdateCovers } from "../utils/fetchCovers";

export default boot(async ({ app }) => {
  // Initialize Pinia
  const pinia = createPinia();

  // Register FirebaseUploader component globally
  app.component("FirebaseUploader", FirebaseUploader);

  // Use Pinia globally in your app
  app.use(pinia);

  // Fetch data and update local storage

  try {
    //console.log("Fetching Editori and updating local storage...");
    await fetchAndUpdateEditori();

    //console.log("Fetching Collane and updating local storage...");
    await fetchAndUpdateCollane();

    //console.log("Fetching Covers and updating local storage...");
    await fetchAndUpdateCovers();

    //console.log("Fetching Bibliografia and updating local storage...");
    await fetchAndUpdateBibliografia();
  } catch (error) {
    console.error("Error during data fetching and updating:", error);
  }
});
