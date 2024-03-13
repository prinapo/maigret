<template>
  <div>
    <!-- Button to trigger resync -->
    <q-btn @click="confirmResync">Resync</q-btn>

    <!-- Popup dialog -->
    <q-dialog v-model="confirmDialog">
      <q-card>
        <q-card-section class="text-center"
          >Are you sure you want to resync?</q-card-section
        >
        <q-card-actions align="center">
          <q-btn
            label="Cancel"
            color="primary"
            @click="confirmDialog = false"
          />
          <q-btn label="Confirm" color="negative" @click="resyncData" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
  <div>
    <!-- here the editori editor -->

    <!-- Other configuration page content -->
    <!-- ... -->
  </div>
</template>

<script>
import { fetchAndUpdateBibliografia } from "../utils/fetchData";

export default {
  data() {
    return {
      confirmDialog: false,
    };
  },
  methods: {
    confirmResync() {
      // Show the confirmation dialog
      this.confirmDialog = true;
    },
    resyncData() {
      // Clear local storage
      localStorage.setItem("bilbiografia", "");
      localStorage.setItem("bibliografiaLastUpdate", "0");
      fetchAndUpdateBibliografia();

      // Restart fetchdata.js process (you may need to import and call the appropriate function)
      // Example: fetchData();

      // Close the confirmation dialog
      this.confirmDialog = false;
    },
  },
};
</script>
