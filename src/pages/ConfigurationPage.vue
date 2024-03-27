<template>
  <div class="container">
    <!-- Button to trigger resync -->
    <div class="text-center mt-6">
      <q-btn label="Confirm" color="primary" @click="confirm = true" />
    </div>

    <!-- Popup dialog -->
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="alert" color="primary" text-color="white" />
          <span class="q-ml-sm">Stai per risoncronizzare tutti i dati.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Risincronizza tutti i dati"
            color="negative"
            @click="resyncData"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router"; // Import useRouter from vue-router

import { fetchAndUpdateBibliografia } from "../utils/fetchBibliografia";
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "../store/database";

export default {
  setup() {
    const confirm = ref(false); // Define confirm as a reactive variable
    const router = useRouter();

    const resyncData = async () => {
      // Clear local storage
      localStorage.removeItem("bilbliografia");
      localStorage.removeItem("bibliografiaLastUpdate");
      localStorage.removeItem("collane");

      // Clear Pinia storage
      const bibliografiaStore = useBibliografiaStore();
      const collaneStore = useCollaneStore();
      const editoriStore = useEditoriStore();
      editoriStore.clearEditori();
      bibliografiaStore.clearBibliografia();
      collaneStore.clearCollane();

      // Fetch and update Bibliografia data
      await fetchAndUpdateBibliografia();

      // Redirect to home page
      router.push({ path: "/" });
    };

    return { confirm, resyncData }; // Expose confirm and resyncData to the template
  },
};
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
