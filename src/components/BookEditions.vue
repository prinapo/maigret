<template>
  <div id="edizioni" class="row items-start q-mt-md q-px-md q-col-gutter-md">
    <div class="row q-gutter-md q-mb-lg">
      <q-card
        v-for="(edizione, edizioneIndex) in edizioni"
        :key="edizioneIndex"
        class="column q-mr-xl q-ml-xl"
        :class="edizione.posseduto ? 'primary' : 'positive'"
        style="max-width: 200px"
      >
        <q-card-section class="overflow-auto">
          <div class="row q-gutter-md items-center">
            <div class="col">
              <q-input
                v-model="edizione.numero"
                label="Edizione"
                color="accent"
                style="max-width: 100px"
                :readonly="!adminMode"
                @focus="handleInputFocus(edizione.numero)"
                @blur="
                  handleEdizioneInputBlur(
                    'numero',
                    edizioneIndex,
                    edizione.numero,
                    bookId,
                  )
                "
              />
            </div>
          </div>

          <div class="row q-gutter-md items-center">
            <div class="col">
              <q-input
                v-model.number="edizione.anno"
                label="Anno"
                color="accent"
                class="col"
                type="number"
                style="max-width: 100px; min-height: 48dp"
                :readonly="!adminMode"
                @focus="handleInputFocus(edizione.anno)"
                @blur="handleInputBlur('anno', edizioneIndex, edizione.anno)"
              />
            </div>
          </div>
          <div>
            <!-- Your content here -->
          </div>
          <div
            class="row q-gutter-md items-center"
            v-if="isCollector || isAdmin"
          >
            <div class="col">
              <q-toggle
                v-model="edizione.posseduto"
                :disable="adminMode"
                label="Posseduto"
                color="green"
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
          <div v-if="adminMode">
            <q-btn
              fab
              icon="add"
              @click="confirmAddEdizione = true"
              style="min-height: 48dp"
            />
            <q-dialog v-model="confirmAddEdizione" persistent>
              <q-card>
                <q-card-section class="q-pa-md">
                  <p>Sei sicuro di voler aggiungere una edizione?</p>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn
                    flat
                    label="Annulla"
                    color="primary"
                    @click="confirmAddEdizione = false"
                    style="min-height: 48dp"
                  />
                  <q-btn
                    flat
                    label="Conferma"
                    color="negative"
                    @click="handleAddEdizione"
                    style="min-height: 48dp"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
          <div v-if="adminMode && edizioni.length > 1">
            <q-btn
              fab
              icon="delete"
              color="warning"
              @click="confirmRemoveEdizione = true"
              style="min-height: 48dp"
            />
            <q-dialog v-model="confirmRemoveEdizione" persistent>
              <q-card>
                <q-card-section class="q-pa-md">
                  <p>Sei sicuro di voler rimuovere questa edizione?</p>
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
import { ref, onMounted, toRefs } from "vue";
import { useAuth } from "../composable/auth";
import {
  saveEdizioneDetail,
  savePossessoEdizione,
  removePossessoEdizione,
  removeEdizione,
  addEdizione,
  fetchEditions,
} from "../utils/edizioniUtils";

import { useUserSettingsStore } from "src/store/userSettings";
import { storeToRefs } from "pinia";

const userSettings = useUserSettingsStore();
const { adminMode } = storeToRefs(userSettings);
// Props destructuring
const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
});
const { bookId } = toRefs(props);

// Auth composable destructuring
const { userId, isAdmin, isCollector, checkAuthState } = useAuth();

// Store initialization

// Reactive refs
const detailOriginalValue = ref("");
const confirmAddEdizione = ref(false);
const confirmRemoveEdizione = ref(false);
const edizioni = ref("");

// Event handlers
const handleAddEdizione = async () => {
  const success = await addEdizione(bookId.value, edizioni);
  if (success) confirmAddEdizione.value = false;
};

// Update handleSavePossessoEdizione to not run in admin mode
const handleSavePossessoEdizione = async (
  edizioneUuid,
  edizionePosseduto,
  userId,
) => {
  try {
    if (edizionePosseduto) {
      await savePossessoEdizione(
        edizioneUuid,
        edizionePosseduto,
        userId,
        bookId.value,
      );
    } else {
      await removePossessoEdizione(edizioneUuid, userId, bookId.value);
    }
  } catch (error) {
    console.error("Error saving possession status:", error);
  }
};

const handleRemoveEdizione = async (index) => {
  // Add check for minimum editions
  if (edizioni.value.length <= 1) {
    Notify.create({
      message: `Non è possibile rimuovere l'ultima edizione`,
      type: "negative",
      color: "red",
    });
    return;
  }

  const success = await removeEdizione(bookId.value, edizioni, index);
  if (success) confirmRemoveEdizione.value = false;
};

const handleInputBlur = async (field, index, value) => {
  // removed bookId parameter
  if (detailOriginalValue.value !== value) {
    saveEdizioneDetail(field, index, value, bookId.value);
  }
};
const handleInputFocus = (detailValue) => {
  setTimeout(() => {
    detailOriginalValue.value = detailValue;
  }, 100);
};

// Lifecycle hooks
onMounted(async () => {
  await checkAuthState();

  // Load editions with possession info
  console.log("loadedEdizioni passed value", bookId.value, userId.value);

  const loadedEdizioni = await fetchEditions(bookId.value, userId.value);
  if (!loadedEdizioni || loadedEdizioni.length === 0) {
    // If no editions, create one and fetch again
    await addEdizione(bookId.value);
    edizioni.value = await fetchEditions(bookId.value, userId.value);
    console.log("edizioni", edizioni.value);
  } else {
    // Use loaded editions directly
    edizioni.value = loadedEdizioni;
    console.log("edizioni", edizioni.value);
  }
});
</script>
