import {
  useBibliografiaStore,
  useCollaneStore,
  useEditoriStore,
  useCoversStore,
} from "../store/database";
import { clearIndexedDB } from "./indexedDB"; // Import the function to clear IndexedDB
import { initializeData } from "./dataInitialization"; // Import the initialization function
import { useRouter } from "vue-router";

export const resyncData = async () => {
  // Clear IndexedDB
  await clearIndexedDB();

  // Clear Pinia stores
  const bibliografiaStore = useBibliografiaStore();
  const collaneStore = useCollaneStore();
  const editoriStore = useEditoriStore();
  const coversStore = useCoversStore();
  editoriStore.clearEditori();
  bibliografiaStore.clearBibliografia();
  collaneStore.clearCollane();
  coversStore.clearCovers();

  // Initialize data
  await initializeData();

  // Redirect to home page
  const router = useRouter();
  router.push({ path: "/" });
};
