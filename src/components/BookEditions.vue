<template>
  <div id="edizioni" class="row items-start q-mt-md q-px-md q-col-gutter-md">
    <div v-if="edizioni.length === 0" class="text-center full-width">
      <q-banner class="bg-grey-3">
        Nessuna edizione disponibile per questo libro.
        <template v-if="!canManageBooks">
          <br />
          Solo gli amministratori possono aggiungere edizioni.
        </template>
      </q-banner>
    </div>
    <div v-else class="row q-gutter-md q-mb-lg">
      <q-card
        v-for="(edizione, edizioneIndex) in edizioni"
        :key="edizioneIndex"
        class="column q-mr-xl q-ml-xl"
        :class="{
          'bg-positive text-dark': edizione.posseduto && !$q.dark.isActive,
          'bg-positive text-white': edizione.posseduto && $q.dark.isActive,
          'bg-grey-2 text-dark': !edizione.posseduto && !$q.dark.isActive,
          'bg-grey-9 text-white': !edizione.posseduto && $q.dark.isActive,
        }"
        style="max-width: 200px"
      >
        <q-card-section class="overflow-auto">
          <div class="row q-gutter-md items-center">
            <div class="col">
              <q-input
                v-model="edizione.numero"
                :label="$t('bookEditions.edition')"
                color="accent"
                style="max-width: 100px"
                :readonly="!canManageBooks"
                @focus="handleInputFocus(edizione.numero)"
                @blur="
                  handleInputBlur('numero', edizioneIndex, edizione.numero)
                "
              />
            </div>
          </div>

          <div class="row q-gutter-md items-center">
            <div class="col">
              <q-input
                v-model.number="edizione.anno"
                :label="$t('bookEditions.year')"
                color="accent"
                class="col"
                type="number"
                style="max-width: 100px; min-height: 48dp"
                :readonly="!canManageBooks"
                @focus="handleInputFocus(edizione.anno)"
                @blur="handleInputBlur('anno', edizioneIndex, edizione.anno)"
              />
            </div>
          </div>
          <div>
            <!-- Your content here -->
          </div>
          <div class="row q-gutter-md items-center" v-if="canCollectBooks">
            <div class="col">
              <q-toggle
                v-model="edizione.posseduto"
                :label="$t('bookEditions.owned')"
                color="positive"
                @update:model-value="
                  handleSavePossessoEdizione(
                    edizione.uuid,
                    edizione.posseduto,
                    userId,
                  )
                "
              />
            </div>
          </div>
        </q-card-section>
        <q-card-section
          id="Aggiunta rimozione Edizione"
          class="row items-center q-gutter-md justify-end"
        >
          <div v-if="canManageBooks">
            <q-btn
              fab
              icon="add"
              color="secondary"
              @click="confirmAddEdizione = true"
              style="min-height: 48dp"
            />
            <q-dialog v-model="confirmAddEdizione" persistent>
              <q-card>
                <q-card-section class="q-pa-md">
                  <p>{{ $t("bookEditions.confirmAddEdition") }}</p>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn
                    flat
                    :label="$t('common.cancel')"
                    color="primary"
                    @click="confirmAddEdizione = false"
                    style="min-height: 48dp"
                  />
                  <q-btn
                    flat
                    :label="$t('common.confirm')"
                    color="negative"
                    @click="handleAddEdizione"
                    style="min-height: 48dp"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
          <div v-if="canManageBooks && edizioni.length > 1">
            <q-btn
              fab
              icon="delete"
              color="secondary"
              @click="confirmRemoveEdizione = true"
              style="min-height: 48dp"
            />
            <q-dialog v-model="confirmRemoveEdizione" persistent>
              <q-card>
                <q-card-section class="q-pa-md">
                  <p>{{ $t("bookEditions.confirmRemoveEdition") }}</p>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn
                    flat
                    label="Annulla"
                    color="primary"
                    @click="confirmRemoveEdizione = false"
                    style="min-height: 48dp"
                  />
                  <q-btn
                    flat
                    label="Conferma"
                    color="negative"
                    @click="handleRemoveEdizione(edizioneIndex)"
                    style="min-height: 48dp"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
        </q-card-section>
      </q-card>
    </div>
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
    console.log("[BookEditions] handleSavePossessoEdizione called", {
      edizioneUuid,
      edizionePosseduto,
      userId,
      bookId: props.bookId,
    });
    if (edizionePosseduto) {
      const result = await savePossessoEdizione(
        edizioneUuid,
        edizionePosseduto,
        userId,
        props.bookId,
      );
      console.log("[BookEditions] savePossessoEdizione result", result);
    } else {
      const result = await removePossessoEdizione(
        edizioneUuid,
        userId,
        props.bookId,
      );
      console.log("[BookEditions] removePossessoEdizione result", result);
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
