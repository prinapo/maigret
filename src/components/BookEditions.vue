<template>
  <div class="q-pa-md" style="max-width: 500px; margin: auto">
    <q-toolbar class="bg-primary text-white shadow-2 q-mb-md">
      <q-toolbar-title>{{
        $t("bookEditions.editionsListTitle") || "Edizioni"
      }}</q-toolbar-title>
    </q-toolbar>
    <q-list bordered>
      <q-item-label header v-if="ownedEditions.length">{{
        $t("bookEditions.ownedHeader") || "Possedute"
      }}</q-item-label>
      <q-item
        v-for="(edizione, edizioneIndex) in ownedEditions"
        :key="'owned-' + edizioneIndex"
        class="edition-item-tight"
        clickable
        v-ripple
        @click="togglePossesso(edizione)"
      >
        <q-item-section avatar>
          <q-avatar
            color="grey-4"
            text-color="dark"
            size="32px"
            font-size="14px"
          >
            {{ edizione.numero }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label caption lines="1"
            >{{ $t("bookEditions.year") }}: {{ edizione.anno }}</q-item-label
          >
        </q-item-section>
        <q-item-section side>
          <q-icon
            name="check_circle"
            color="positive"
            size="md"
            class="cursor-pointer"
            @click.stop="togglePossesso(edizione)"
          >
            <q-tooltip>{{ $t("bookEditions.removeFromCollection") }}</q-tooltip>
          </q-icon>
        </q-item-section>
      </q-item>
      <q-separator v-if="ownedEditions.length && notOwnedEditions.length" />
      <q-item-label header v-if="notOwnedEditions.length">{{
        $t("bookEditions.notOwnedHeader") || "Non possedute"
      }}</q-item-label>
      <q-item
        v-for="(edizione, edizioneIndex) in notOwnedEditions"
        :key="'notowned-' + edizioneIndex"
        class="edition-item-tight"
        clickable
        v-ripple
        @click="togglePossesso(edizione)"
      >
        <q-item-section avatar>
          <q-avatar
            color="grey-4"
            text-color="dark"
            size="32px"
            font-size="14px"
          >
            {{ edizione.numero }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label caption lines="1"
            >{{ $t("bookEditions.year") }}: {{ edizione.anno }}</q-item-label
          >
        </q-item-section>
        <q-item-section side>
          <q-icon
            name="radio_button_unchecked"
            color="grey"
            size="md"
            class="cursor-pointer"
            @click.stop="togglePossesso(edizione)"
          >
            <q-tooltip>{{ $t("bookEditions.addToCollection") }}</q-tooltip>
          </q-icon>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, toRefs } from "vue";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { storeToRefs } from "pinia";
import { Notify } from "quasar";
import {
  saveEdizioneDetail,
  savePossessoEdizione,
  removePossessoEdizione,
  removeEdizione,
  addEdizione,
  fetchEditions,
} from "utils/edizioniUtils";
import { useBibliografiaStore } from "stores/bibliografiaStore";

// Props
const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
});

// State
const detailOriginalValue = ref(null);
const confirmRemoveEdizione = ref(false);
const confirmAddEdizione = ref(false);
const isLoading = ref(true);
const loadingError = ref(null);
const auth = useAuthStore();
const userId = auth.user?.uid;
const userStore = useUserStore();
const { settings } = storeToRefs(userStore);
const bibliografiaStore = useBibliografiaStore();
const { bibliografia } = storeToRefs(bibliografiaStore);

const canManageBooks = computed(() => userStore.hasPermission("manage_books"));
const { canCollectBooks } = storeToRefs(userStore);

const book = computed(() =>
  bibliografia.value.find((b) => b.id === props.bookId),
);
const edizioni = computed(() => book.value?.edizioni || []);

// Computed per separare edizioni possedute e non possedute
const ownedEditions = computed(() => edizioni.value.filter((e) => e.posseduto));
const notOwnedEditions = computed(() =>
  edizioni.value.filter((e) => !e.posseduto),
);

const handleSavePossessoEdizione = async (
  edizioneUuid,
  edizionePosseduto,
  userId,
) => {
  if (!edizioneUuid || !userId) {
    Notify.create({
      message: "Missing required information for possession update",
      type: "negative",
    });
    return;
  }

  try {
    if (edizionePosseduto) {
      const result = await savePossessoEdizione(
        edizioneUuid,
        edizionePosseduto,
        userId,
        props.bookId,
      );
    } else {
      const result = await removePossessoEdizione(
        edizioneUuid,
        userId,
        props.bookId,
      );
    }
  } catch (error) {
    console.error("Error updating possession status:", error);
    Notify.create({
      message: `Failed to update possession: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const handleAddEdizione = async () => {
  try {
    const success = await addEdizione(props.bookId);
    if (success) {
      // Refresh editions list
      const updatedEdizioni = await fetchEditions(props.bookId, userId.value);
      edizioni.value = updatedEdizioni;
      confirmAddEdizione.value = false;
    }
  } catch (error) {
    console.error("Error adding edition:", error);
    Notify.create({
      message: `Failed to add edition: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const handleRemoveEdizione = async (index) => {
  try {
    // Add check for minimum editions
    if (edizioni.value.length <= 1) {
      Notify.create({
        message: "Cannot remove the last edition",
        type: "negative",
        timeout: 3000,
      });
      return;
    }

    const success = await removeEdizione(props.bookId, edizioni, index);
    if (success) {
      confirmRemoveEdizione.value = false;
    }
  } catch (error) {
    console.error("Error removing edition:", error);
    Notify.create({
      message: `Failed to remove edition: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const handleInputBlur = async (field, index, value) => {
  try {
    if (!field || index === undefined || value === undefined) {
      throw new Error("Missing required parameters for saving edition detail");
    }

    if (detailOriginalValue.value !== value) {
      await saveEdizioneDetail(field, index, value, props.bookId);
    }
  } catch (error) {
    console.error("Error saving edition detail:", error);
    Notify.create({
      message: `Failed to save edition detail: ${error.message}`,
      type: "negative",
      color: "negative",
      timeout: 3000,
    });
  }
};

const handleInputFocus = (detailValue) => {
  setTimeout(() => {
    detailOriginalValue.value = detailValue;
  }, 100);
};

const togglePossesso = (edizione) => {
  handleSavePossessoEdizione(edizione.uuid, !edizione.posseduto, userId);
};

// Lifecycle hooks
onMounted(async () => {
  try {
    isLoading.value = true;
    loadingError.value = null;
    // Se il libro non ha edizioni e l'utente può gestire, aggiungi una edizione
    if (
      (!book.value?.edizioni || book.value.edizioni.length === 0) &&
      canManageBooks.value
    ) {
      await addEdizione(props.bookId);
    }
  } catch (error) {
    console.error("Error initializing component:", error);
    loadingError.value = error.message;
    Notify.create({
      message: `Error loading editions: ${error.message}`,
      type: "negative",
      color: "negative",
      timeout: 3000,
    });
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.edition-item-tight {
  margin-top: 2px !important;
  margin-bottom: 2px !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
</style>
