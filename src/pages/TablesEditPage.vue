<template>
  <div v-if="userStore.canManageBooks">
    <q-toggle
      v-model="expandedAll"
      :label="$t('tablesEdit.expandAll')"
      class="q-mb-md"
      @click="toggleGlobalExpansion"
    />

    <q-list>
      <q-expansion-item
        v-model="expandedCovers"
        icon="auto_stories"
        :label="$t('tablesEdit.coverTypes')"
        caption="Copertina, quarta di copertina etc.."
      >
        <div class="q-pa-md" id="Covers">
          <q-table
            flat
            bordered
            :title="$t('tablesEdit.coverImageTypes')"
            :rows="coversRows"
            :columns="coversColumns"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :disable="loading"
                :label="$t('tablesEdit.addRow')"
                @click="addRow"
                unelevated
                style="min-height: 48dp"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="value" :props="props">{{ props.row.value }}</q-td>
                <q-td key="label_it" :props="props">
                  {{ props.row.label_it }}
                  <q-popup-edit
                    v-model="props.row.label_it"
                    :title="$t('tablesEdit.updateTypeIt')"
                    buttons
                    v-slot="scope"
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                      style="min-height: 48dp"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td key="label_en" :props="props">
                  {{ props.row.label_en }}
                  <q-popup-edit
                    v-model="props.row.label_en"
                    :title="$t('tablesEdit.updateTypeEn')"
                    buttons
                    v-slot="scope"
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                      style="min-height: 48dp"
                    />
                  </q-popup-edit>
                </q-td>
              </q-tr>
            </template>
          </q-table>

          <!-- Confirmation dialog -->
          <q-btn
            color="secondary"
            :disable="loading"
            :label="$t('tablesEdit.saveCovers')"
            @click="saveCoverData"
            unelevated
            style="min-height: 48dp"
          />
          <q-space />
        </div>
      </q-expansion-item>
      <q-expansion-item
        v-model="expandedEditori"
        icon="business"
        :label="$t('tablesEdit.publishersList')"
        caption="Adlephi, Mondadori, etc.."
      >
        <div class="q-pa-md" id="Editori">
          <q-table
            flat
            bordered
            :title="$t('tablesEdit.publishers')"
            :rows="editoriRows"
            :columns="editoriColumns"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :disable="loading"
                :label="$t('tablesEdit.addRow')"
                @click="addEditoriRow"
                unelevated
                style="min-height: 48dp"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="value" :props="props">{{ props.row.value }}</q-td>

                <q-td key="label" :props="props">
                  {{ props.row.label }}
                  <q-popup-edit
                    v-model="props.row.label"
                    :title="$t('tablesEdit.updatePublisher')"
                    buttons
                    v-slot="scope"
                    dense
                    unelevated
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                      style="min-height: 48dp"
                    />
                  </q-popup-edit>
                </q-td>
              </q-tr>
            </template>
          </q-table>

          <!-- Confirmation dialog -->
          <q-btn
            color="secondary"
            :disable="loading"
            :label="$t('tablesEdit.savePublishers')"
            @click="saveEditoriData"
            unelevated
            style="min-height: 48dp"
          />
          <q-space />
        </div>
      </q-expansion-item>
      <q-expansion-item
        v-model="expandedCollane"
        icon="library_books"
        :label="$t('tablesEdit.series')"
        caption="I Maigret, etc.."
      >
        <div class="q-pa-md" id="Collane">
          <q-table
            flat
            bordered
            :title="$t('tablesEdit.series')"
            :rows="collaneRows"
            :columns="collaneColumns"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :disable="loading"
                :label="$t('tablesEdit.addRow')"
                @click="addCollaneRow"
                unelevated
                style="min-height: 48dp"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="value" :props="props">{{ props.row.value }}</q-td>
                <q-td key="label" :props="props">
                  {{ props.row.label }}
                  <q-popup-edit
                    v-model="props.row.label"
                    :title="$t('tablesEdit.updateSeries')"
                    buttons
                    v-slot="scope"
                    dense
                    unelevated
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                      style="min-height: 48dp"
                    />
                  </q-popup-edit>
                </q-td>
              </q-tr>
            </template>
          </q-table>
          <!-- Confirmation dialog -->
          <q-btn
            color="secondary"
            :disable="loading"
            :label="$t('tablesEdit.saveSeries')"
            @click="saveCollaneData"
            unelevated
            style="min-height: 48dp"
          />
          <q-space />
        </div>
      </q-expansion-item>
      <q-expansion-item
        v-model="expandedLingue"
        icon="language"
        :label="$t('tablesEdit.languages')"
        caption="Italiano, Francese, etc.."
      >
        <div class="q-pa-md" id="Lingue">
          <q-table
            flat
            bordered
            :title="$t('tablesEdit.languages')"
            :rows="lingueRows"
            :columns="lingueColumns"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :disable="loading"
                :label="$t('tablesEdit.addRow')"
                @click="addLingueRow"
                unelevated
                style="min-height: 48dp"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="value" :props="props">{{ props.row.value }}</q-td>
                <q-td key="label" :props="props">
                  {{ props.row.label }}
                  <q-popup-edit
                    v-model="props.row.label"
                    :title="$t('tablesEdit.updateLanguage')"
                    buttons
                    v-slot="scope"
                    dense
                    unelevated
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                      style="min-height: 48dp"
                    />
                  </q-popup-edit>
                </q-td>
              </q-tr>
            </template>
          </q-table>
          <!-- Confirmation dialog -->
          <q-btn
            color="secondary"
            :disable="loading"
            :label="$t('tablesEdit.saveLanguages')"
            @click="saveLingueData"
            unelevated
            style="min-height: 48dp"
          />
          <q-space />
        </div>
      </q-expansion-item>
    </q-list>
  </div>
  <div v-else class="q-pa-md text-center">
    <q-icon name="lock" size="4em" color="grey-6" />
    <div class="text-h6 q-mt-md">{{ $t("tablesEdit.accessDenied") }}</div>
    <div class="text-body2 text-grey-6">
      You don't have permission to manage tables.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import short from "short-uuid";
import { useI18n } from "vue-i18n";

import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useCoversStore } from "stores/coversStore";
import { useUserStore } from "stores/userStore";
import { Notify } from "quasar";
import { syncSingleDocCollection } from "utils/firebaseDatabaseUtils";

import { storeToRefs } from "pinia";
// UUID generator
const translator = short();
const { t } = useI18n();

// Data properties
const coversRows = ref([]);
const editoriRows = ref([]);
const collaneRows = ref([]);
const lingueRows = ref([]);
const loading = ref(false);

// Table columns
const coversColumns = [
  {
    name: "value",
    required: true,
    label: "Reference ID",
    align: "left",
    field: (row) => row.value,
  },
  {
    name: "label_it",
    required: true,
    label: "Tipo di immagine (IT)",
    align: "left",
    field: (row) => row.label_it,
    sortable: true,
  },
  {
    name: "label_en",
    required: true,
    label: "Tipo di immagine (EN)",
    align: "left",
    field: (row) => row.label_en,
    sortable: true,
  },
];

const editoriColumns = [
  {
    name: "value",
    required: true,
    label: "Reference ID",
    align: "left",
    field: (row) => row.value,
    format: (val) => `${val}`,
  },
  {
    name: "label",
    required: true,
    label: "Editore",
    align: "left",
    field: (row) => row.label,
    format: (val) => `${val}`,
    sortable: true,
  },
];

const collaneColumns = [
  {
    name: "value",
    required: true,
    label: "Reference ID",
    align: "left",
    field: (row) => row.value,
  },
  {
    name: "label",
    required: true,
    label: "Collane",
    align: "left",
    field: (row) => row.label,
    sortable: true,
  },
];

const lingueColumns = [
  {
    name: "value",
    required: true,
    label: "Reference ID",
    align: "left",
    field: (row) => row.value,
  },
  {
    name: "label",
    required: true,
    label: "Lingua",
    align: "left",
    field: (row) => row.label,
    sortable: true,
  },
];

// Stores
const coversStore = useCoversStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const lingueStore = useLingueStore();
const { covers } = storeToRefs(coversStore);
const { editori } = storeToRefs(editoriStore);
const { collane } = storeToRefs(collaneStore);
const { lingue } = storeToRefs(lingueStore);

onMounted(() => {
  coversRows.value = covers.value || [];
  editoriRows.value = editori.value || [];
  collaneRows.value = collane.value || [];
  lingueRows.value = lingue.value || [];
});

// Functions
const addRow = () => {
  loading.value = true;
  const shortUUID = translator.new();
  coversRows.value.push({
    value: shortUUID,
    label_it: "nuovo tipo",
    label_en: "new type",
  });
  loading.value = false;
};

const addEditoriRow = () => {
  loading.value = true;
  const shortUUID = translator.new();
  editoriRows.value.push({ label: "insert editore", value: shortUUID });
  loading.value = false;
};

const addCollaneRow = () => {
  loading.value = true;
  const shortUUID = translator.new();
  collaneRows.value.push({ label: "insert collana", value: shortUUID });
  loading.value = false;
};

const addLingueRow = () => {
  loading.value = true;
  const shortUUID = translator.new();
  lingueRows.value.push({ label: "insert lingua", value: shortUUID });
  loading.value = false;
};

const saveCoverData = async () => {
  try {
    // Convert to plain objects to ensure serializability
    const serializableData = coversRows.value.map((row) => ({
      value: row.value,
      label_it: row.label_it,
      label_en: row.label_en,
    }));

    await syncSingleDocCollection({
      collectionName: "Covers",
      fieldName: "cover",
      data: serializableData,
      storeUpdateFn: (data) => coversStore.updateCovers(data),
      indexedDBUpdateFn: async () => {
        // IndexedDB update is handled automatically by syncSingleDocCollection
        // No need for direct IndexedDB calls
      },
    });
  } catch (error) {
    console.error("Error saving array to Firestore:", error);
    Notify.create({
      message: `Failed to save covers: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const saveEditoriData = async () => {
  try {
    // Convert to plain objects to ensure serializability
    const serializableData = editoriRows.value.map((row) => ({
      value: row.value,
      label: row.label,
    }));

    await syncSingleDocCollection({
      collectionName: "Editori",
      fieldName: "editore",
      data: serializableData,
      storeUpdateFn: (data) => editoriStore.updateEditori(data),
      indexedDBUpdateFn: async () => {
        // IndexedDB update is handled automatically by syncSingleDocCollection
        // No need for direct IndexedDB calls
      },
    });
  } catch (error) {
    console.error("Error saving array to Firestore:", error);
    Notify.create({
      message: `Failed to save editori: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const saveCollaneData = async () => {
  try {
    // Convert to plain objects to ensure serializability
    const serializableData = collaneRows.value.map((row) => ({
      value: row.value,
      label: row.label,
    }));

    await syncSingleDocCollection({
      collectionName: "Collane",
      fieldName: "collana",
      data: serializableData,
      storeUpdateFn: (data) => collaneStore.updateCollane(data),
      indexedDBUpdateFn: async () => {
        // IndexedDB update is handled automatically by syncSingleDocCollection
        // No need for direct IndexedDB calls
      },
    });
  } catch (error) {
    console.error("Error saving array to Firestore:", error);
    Notify.create({
      message: `Failed to save collane: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const saveLingueData = async () => {
  try {
    // Convert to plain objects to ensure serializability
    const serializableData = lingueRows.value.map((row) => ({
      value: row.value,
      label: row.label,
    }));

    await syncSingleDocCollection({
      collectionName: "Lingue",
      fieldName: "lingua",
      data: serializableData,
      storeUpdateFn: (data) => lingueStore.updateLingue(data),
      indexedDBUpdateFn: async () => {
        // IndexedDB update is handled automatically by syncSingleDocCollection
        // No need for direct IndexedDB calls
      },
    });
  } catch (error) {
    console.error("Error saving array to Firestore:", error);
    Notify.create({
      message: `Failed to save lingue: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const expandedAll = ref(false);
const expandedCovers = ref(false);
const expandedEditori = ref(false);
const expandedCollane = ref(false);
const expandedLingue = ref(false);

const toggleGlobalExpansion = () => {
  expandedCovers.value = expandedAll.value;
  expandedEditori.value = expandedAll.value;
  expandedCollane.value = expandedAll.value;
  expandedLingue.value = expandedAll.value;
};

const userStore = useUserStore();

// Aggiungere controllo di accesso all'inizio:
if (!userStore.canManageBooks) {
  // Redirect o mostra messaggio di errore
  console.warn("User does not have permission to access this page");
}
</script>
