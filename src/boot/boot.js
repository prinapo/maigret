import { boot } from "quasar/wrappers";
import { createPinia } from "pinia";
import { initializeData } from "../utils/dataInitialization"; // Import the initialization function

export default boot(async ({ app }) => {
  // Initialize Pinia
  const pinia = createPinia();
  app.use(pinia);

  // Initialize data
  await initializeData();
});
