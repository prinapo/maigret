import { boot } from "quasar/wrappers";
import { createPinia } from "pinia";
import { initializeData } from "../utils/dataInitialization";

export default boot(async ({ app, router }) => {
  // Initialize Pinia
  const pinia = createPinia();
  app.use(pinia);

  // Initialize data
  await initializeData();
});
