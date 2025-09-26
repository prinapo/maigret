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
        <div class="q-pa-md">
          <q-table
            ref="coversTable"
            flat
            bordered
            :title="$t('tablesEdit.coverImageTypes')"
            :rows="coversRows"
            :columns="coversColumns"
            :table-row-class-fn="coversRowClassFn"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :label="$t('tablesEdit.addRow')"
                @click="addRow"
                unelevated
                size="md"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="label_it" :props="props">
                  {{ props.row.label_it }}
                  <q-popup-edit
                    v-model="props.row.label_it"
                    :title="$t('tablesEdit.updateTypeIt')"
                    buttons
                    @save="
                      (value) =>
                        saveTableData(
                          value,
                          props.row.value,
                          'label_it',
                          'covers',
                          covers,
                          $t('tablesEdit.coversSaved'),
                          $t('tablesEdit.errorSavingCovers'),
                        )
                    "
                    v-slot="scope"
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td key="label_en" :props="props">
                  {{ props.row.label_en }}
                  <q-popup-edit
                    v-model="props.row.label_en"
                    :title="$t('tablesEdit.updateTypeEn')"
                    buttons
                    @save="
                      (value) =>
                        saveTableData(
                          value,
                          props.row.value,
                          'label_en',
                          'covers',
                          covers,
                          $t('tablesEdit.coversSaved'),
                          $t('tablesEdit.errorSavingCovers'),
                        )
                    "
                    v-slot="scope"
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    round
                    dense
                    @click="confirmDelete('covers', props.row)"
                  />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </q-expansion-item>
      <q-expansion-item
        v-model="expandedEditori"
        icon="business"
        :label="$t('tablesEdit.publishersList')"
        caption="Adlephi, Mondadori, etc.."
      >
        <div class="q-pa-md">
          <q-table
            ref="editoriTable"
            flat
            bordered
            :title="$t('tablesEdit.publishers')"
            :rows="editoriRows"
            :columns="editoriColumns"
            :table-row-class-fn="editoriRowClassFn"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :label="$t('tablesEdit.addRow')"
                @click="addEditoriRow"
                unelevated
                size="md"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="label" :props="props">
                  {{ props.row.label }}
                  <q-popup-edit
                    v-model="props.row.label"
                    :title="$t('tablesEdit.updatePublisher')"
                    buttons
                    @save="
                      (value) =>
                        saveTableData(
                          value,
                          props.row.value,
                          'label',
                          'editori',
                          editori,
                          $t('tablesEdit.publisherSaved'),
                          $t('tablesEdit.errorSavingPublisher'),
                        )
                    "
                    v-slot="scope"
                  >
                    <q-input
                      v-model="scope.value"
                      dense
                      autofocus
                      counter
                      @keyup.enter="scope.set"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    round
                    dense
                    @click="confirmDelete('editori', props.row)"
                  />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </q-expansion-item>
      <q-expansion-item
        v-model="expandedCollane"
        icon="library_books"
        :label="$t('tablesEdit.series')"
        caption="I Maigret, etc.."
      >
        <div class="q-pa-md">
          <q-table
            ref="collaneTable"
            flat
            bordered
            :title="$t('tablesEdit.series')"
            :rows="collaneRows"
            :columns="collaneColumns"
            :table-row-class-fn="collaneRowClassFn"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :label="$t('tablesEdit.addRow')"
                @click="addCollaneRow"
                unelevated
                size="md"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="label" :props="props">
                  {{ props.row.label }}
                  <q-popup-edit
                    v-model="props.row.label"
                    :title="$t('tablesEdit.updateSeries')"
                    buttons
                    @save="
                      (value) =>
                        saveTableData(
                          value,
                          props.row.value,
                          'label',
                          'collane',
                          collane,
                          $t('tablesEdit.seriesSaved'),
                          $t('tablesEdit.errorSavingSeries'),
                        )
                    "
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
                    />
                  </q-popup-edit>
                </q-td>
                <q-td key="editore" :props="props">
                  {{ getEditoreLabel(props.row.editore) }}
                  <q-popup-edit
                    v-model="props.row.editore"
                    :title="$t('tablesEdit.updatePublisher')"
                    buttons
                    @save="
                      (value) =>
                        saveTableData(
                          value,
                          props.row.value,
                          'editore',
                          'collane',
                          collane,
                          $t('tablesEdit.seriesSaved'),
                          $t('tablesEdit.errorSavingSeries'),
                        )
                    "
                    v-slot="scope"
                    dense
                    unelevated
                  >
                    <q-select
                      v-model="scope.value"
                      :options="editoriOptions"
                      option-label="label"
                      option-value="value"
                      emit-value
                      map-options
                      dense
                      autofocus
                      @keyup.enter="scope.set"
                      style="min-width: 180px"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    round
                    dense
                    @click="confirmDelete('collane', props.row)"
                  />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </q-expansion-item>
      <q-expansion-item
        v-model="expandedLingue"
        icon="language"
        :label="$t('tablesEdit.languages')"
        caption="Italiano, Francese, etc.."
      >
        <div class="q-pa-md">
          <q-table
            ref="lingueTable"
            flat
            bordered
            :title="$t('tablesEdit.languages')"
            :rows="lingueRows"
            :columns="lingueColumns"
            :table-row-class-fn="lingueRowClassFn"
            row-key="value"
            binary-state-sort
            :rows-per-page-options="[0]"
          >
            <template v-slot:top>
              <q-btn
                color="primary"
                :label="$t('tablesEdit.addRow')"
                @click="addLingueRow"
                unelevated
                size="md"
              />
              <q-space />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="label" :props="props">
                  {{ props.row.label }}
                  <q-popup-edit
                    v-model="props.row.label"
                    :title="$t('tablesEdit.updateLanguage')"
                    buttons
                    @save="
                      (value) =>
                        saveTableData(
                          value,
                          props.row.value,
                          'label',
                          'lingue',
                          lingue,
                          $t('tablesEdit.languageSaved'),
                          $t('tablesEdit.errorSavingLanguage'),
                        )
                    "
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
                    />
                  </q-popup-edit>
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    round
                    dense
                    @click="confirmDelete('lingue', props.row)"
                  />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </q-expansion-item>
    </q-list>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t("tablesEdit.confirmDeleteTitle") }}</div>
        </q-card-section>

        <q-card-section>
          <p>{{ $t("tablesEdit.confirmDeleteItem") }}</p>
          <p class="text-weight-bold">
            {{ deleteItem?.label || deleteItem?.label_it }}
          </p>
        </q-card-section>

        <q-card-section v-if="usedBooks.length > 0">
          <div class="text-h6 text-negative q-mb-md">
            {{ $t("tablesEdit.itemInUse") }}
          </div>
          <p>{{ $t("tablesEdit.itemInUseMessage") }}</p>
          <q-list>
            <q-item
              v-for="book in usedBooks"
              :key="book.id"
              clickable
              @click="openBookDetails(book.id)"
            >
              <q-item-section>
                <q-item-label>{{ book.titolo }}</q-item-label>
                <q-item-label caption>{{ book.autore }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  dense
                  round
                  icon="visibility"
                  :label="$t('tablesEdit.viewBook')"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-section v-else>
          <div class="text-h6 text-positive q-mb-md">
            {{ $t("tablesEdit.itemNotUsed") }}
          </div>
          <p>{{ $t("tablesEdit.itemNotUsedMessage") }}</p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('tablesEdit.cancelDelete')"
            @click="deleteDialog = false"
          />
          <q-btn
            v-if="canDelete"
            color="negative"
            :label="$t('tablesEdit.deleteItem')"
            @click="executeDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Book Details Dialog -->
    <q-dialog v-model="isBookDialogOpen" full-width full-height persistent>
      <q-card
        class="full-height hide-scrollbar relative-position"
        style="padding-top: 0"
      >
        <q-btn
          icon="close"
          flat
          round
          dense
          v-close-popup
          class="absolute-top-left q-ma-md bg-dark"
          color="white"
          style="z-index: 1000; border-radius: 50%"
        />
        <q-card-section class="q-pa-none full-height">
          <BookDetailContent :bookId="selectedBookId" />
        </q-card-section>
      </q-card>
    </q-dialog>
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
import { ref, computed, nextTick } from "vue";
import short from "short-uuid";
import { useI18n } from "vue-i18n";

import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useCoversStore } from "stores/coversStore";
import { useUserStore } from "stores/userStore";
import { Notify } from "quasar";
import {
  syncSingleDocCollection,
  updateDocInCollection,
} from "utils/firebaseDatabaseUtils";

import { storeToRefs } from "pinia";
import { useBibliografiaStore } from "stores/bibliografiaStore";

// Components
import BookDetailContent from "components/BookDetailContent.vue";

// Stores
const coversStore = useCoversStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const lingueStore = useLingueStore();
const bibliografiaStore = useBibliografiaStore();
const { covers } = storeToRefs(coversStore);
const { editori } = storeToRefs(editoriStore);
const { collane } = storeToRefs(collaneStore);
const { lingue } = storeToRefs(lingueStore);

// UUID generator
const translator = short();
const { t: $t } = useI18n();

// Data properties - using storeToRefs for automatic reactivity
const coversRows = covers;
const editoriRows = editori;
const collaneRows = collane;
const lingueRows = lingue;

// Table refs for scrolling
const coversTable = ref(null);
const editoriTable = ref(null);
const collaneTable = ref(null);
const lingueTable = ref(null);

// Delete confirmation dialog
const deleteDialog = ref(false);
const deleteItem = ref(null);
const deleteTable = ref("");

// Book details dialog
const isBookDialogOpen = ref(false);
const selectedBookId = ref(null);

// Computed property for used books that updates automatically
const usedBooks = computed(() => {
  if (!deleteItem.value || !deleteTable.value) return [];
  return checkUsage(deleteTable.value, deleteItem.value.value);
});

// Computed property for canDelete that depends on usedBooks
const canDelete = computed(() => usedBooks.value.length === 0);

// Row highlighting - one for each table
const highlightedRows = ref({
  covers: null,
  editori: null,
  collane: null,
  lingue: null,
});

// Table columns
const coversColumns = [
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
  {
    name: "actions",
    label: "Azioni",
    align: "center",
  },
];

const editoriColumns = [
  {
    name: "label",
    required: true,
    label: "Editore",
    align: "left",
    field: (row) => row.label,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "actions",
    label: "Azioni",
    align: "center",
  },
];

const collaneColumns = [
  {
    name: "label",
    required: true,
    label: "Collana",
    align: "left",
    field: (row) => row.label,
    sortable: true,
  },
  {
    name: "editore",
    required: true,
    label: "Editore",
    align: "left",
    field: (row) => row.editore,
    sortable: true,
  },
  {
    name: "actions",
    label: "Azioni",
    align: "center",
  },
];

const lingueColumns = [
  {
    name: "label",
    required: true,
    label: "Lingua",
    align: "left",
    field: (row) => row.label,
    sortable: true,
  },
  {
    name: "actions",
    label: "Azioni",
    align: "center",
  },
];

// Generic function to save table data
const saveTableData = async (
  newValue,
  rowValue,
  field,
  tableType,
  store,
  successMessage,
  errorMessage,
  isAdding = false,
) => {
  // Skip validation for row addition operations
  if (!isAdding) {
    // Validate input based on table type and field
    let isValid = true;
    let errorMsg = "";

    if (tableType === "covers") {
      if (!newValue || !newValue.trim()) {
        isValid = false;
        errorMsg = $t("tablesEdit.valueRequired");
      }
    } else if (tableType === "editori") {
      if (!newValue || !newValue.trim()) {
        isValid = false;
        errorMsg = $t("tablesEdit.publisherRequired");
      }
    } else if (tableType === "collane") {
      if (field === "label" && (!newValue || !newValue.trim())) {
        isValid = false;
        errorMsg = $t("tablesEdit.seriesRequired");
      } else if (field === "editore" && !newValue) {
        isValid = false;
        errorMsg = $t("tablesEdit.selectValidPublisher");
      }
    } else if (tableType === "lingue") {
      if (!newValue || !newValue.trim()) {
        isValid = false;
        errorMsg = $t("tablesEdit.languageRequired");
      }
    }

    if (!isValid) {
      Notify.create({
        message: errorMsg,
        type: "warning",
        timeout: 2000,
      });
      return;
    }

    if (!rowValue) {
      Notify.create({
        message: $t("tablesEdit.invalidRow"),
        type: "negative",
        timeout: 3000,
      });
      return;
    }
  }

  try {
    let serializableData;
    const data = store.value || store;

    // For adding operations, just serialize the current data
    if (isAdding) {
      if (tableType === "covers") {
        serializableData = data.map((row) => ({
          value: row.value,
          label_it: row.label_it,
          label_en: row.label_en,
        }));
      } else if (tableType === "editori") {
        serializableData = data.map((row) => ({
          value: row.value,
          label: row.label,
        }));
      } else if (tableType === "collane") {
        serializableData = data.map((row) => ({
          value: row.value,
          label: row.label,
          editore: row.editore || "",
        }));
      } else if (tableType === "lingue") {
        serializableData = data.map((row) => ({
          value: row.value,
          label: row.label,
        }));
      }
    } else {
      // For editing operations, update the specific field
      if (tableType === "covers") {
        serializableData = data.map((row) => ({
          value: row.value,
          label_it:
            row.value === rowValue && field === "label_it"
              ? newValue.trim()
              : row.label_it,
          label_en:
            row.value === rowValue && field === "label_en"
              ? newValue.trim()
              : row.label_en,
        }));
      } else if (tableType === "editori") {
        serializableData = data.map((row) => ({
          value: row.value,
          label: row.value === rowValue ? newValue.trim() : row.label,
        }));
      } else if (tableType === "collane") {
        serializableData = data.map((row) => ({
          value: row.value,
          label:
            row.value === rowValue && field === "label"
              ? newValue.trim()
              : row.label,
          editore:
            row.value === rowValue && field === "editore"
              ? newValue
              : row.editore || "",
        }));
      } else if (tableType === "lingue") {
        serializableData = data.map((row) => ({
          value: row.value,
          label: row.value === rowValue ? newValue.trim() : row.label,
        }));
      }
    }

    const collectionMap = {
      covers: "Covers",
      editori: "Editori",
      collane: "Collane",
      lingue: "Lingue",
    };

    const docKeyMap = {
      covers: { cover: serializableData },
      editori: { editore: serializableData },
      collane: { collana: serializableData },
      lingue: { lingua: serializableData },
    };

    await updateDocInCollection(
      collectionMap[tableType],
      "default",
      docKeyMap[tableType],
      { includeTimestamp: true },
    );

    // Update store
    if (tableType === "covers") coversStore.updateCovers(serializableData);
    else if (tableType === "editori")
      editoriStore.updateEditori(serializableData);
    else if (tableType === "collane")
      collaneStore.updateCollane(serializableData);
    else if (tableType === "lingue") lingueStore.updateLingue(serializableData);

    Notify.create({
      message: successMessage,
      type: "positive",
      timeout: 2000,
    });
  } catch (error) {
    console.error(`Error saving ${tableType} to Firestore:`, error);
    Notify.create({
      message: `${errorMessage}: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

// Functions
const addRow = async () => {
  try {
    const shortUUID = translator.new();
    const newRow = {
      value: shortUUID,
      label_it: $t("tablesEdit.defaultCoverTypeIt"),
      label_en: $t("tablesEdit.defaultCoverTypeEn"),
    };
    coversStore.updateCovers([newRow, ...covers.value]);
    await saveTableData(
      null, // No specific value for adding
      null, // No specific row for adding
      null, // No specific field for adding
      "covers",
      covers,
      $t("tablesEdit.coversSaved"),
      $t("tablesEdit.errorSavingCovers"),
      true, // isAdding
    );

    // Highlight the new row
    highlightedRows.value.covers = shortUUID;

    // Remove highlight after 3 seconds
    setTimeout(() => {
      highlightedRows.value.covers = null;
    }, 3000);

    // Scroll to the new row (first row)
    await nextTick();
    if (coversTable.value) {
      coversTable.value.scrollTo(0);
    }
  } catch (error) {
    console.error("Error adding cover row:", error);
    Notify.create({
      message: $t("tablesEdit.errorAddingCover") + `: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const addEditoriRow = async () => {
  try {
    const shortUUID = translator.new();
    const newRow = {
      label: $t("tablesEdit.defaultPublisher"),
      value: shortUUID,
    };
    editoriStore.updateEditori([newRow, ...editori.value]);
    await saveTableData(
      null,
      null,
      null,
      "editori",
      editori,
      $t("tablesEdit.publisherSaved"),
      $t("tablesEdit.errorSavingPublisher"),
      true, // isAdding
    );

    // Highlight the new row
    highlightedRows.value.editori = shortUUID;

    // Remove highlight after 3 seconds
    setTimeout(() => {
      highlightedRows.value.editori = null;
    }, 3000);

    // Scroll to the new row (first row)
    await nextTick();
    if (editoriTable.value) {
      editoriTable.value.scrollTo(0);
    }
  } catch (error) {
    console.error("Error adding editori row:", error);
    Notify.create({
      message: $t("tablesEdit.errorAddingPublisher") + `: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const addCollaneRow = async () => {
  try {
    const shortUUID = translator.new();
    const newRow = {
      label: $t("tablesEdit.defaultSeries"),
      value: shortUUID,
      editore: "",
    };
    collaneStore.updateCollane([newRow, ...collane.value]);
    await saveTableData(
      null,
      null,
      null,
      "collane",
      collane,
      $t("tablesEdit.seriesSaved"),
      $t("tablesEdit.errorSavingSeries"),
      true, // isAdding
    );

    // Highlight the new row
    highlightedRows.value.collane = shortUUID;

    // Remove highlight after 3 seconds
    setTimeout(() => {
      highlightedRows.value.collane = null;
    }, 3000);

    // Scroll to the new row (first row)
    await nextTick();
    if (collaneTable.value) {
      collaneTable.value.scrollTo(0);
    }
  } catch (error) {
    console.error("Error adding collane row:", error);
    Notify.create({
      message: $t("tablesEdit.errorAddingSeries") + `: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const addLingueRow = async () => {
  try {
    const shortUUID = translator.new();
    const newRow = {
      label: $t("tablesEdit.defaultLanguage"),
      value: shortUUID,
    };
    lingueStore.updateLingue([newRow, ...lingue.value]);
    await saveTableData(
      null,
      null,
      null,
      "lingue",
      lingue,
      $t("tablesEdit.languageSaved"),
      $t("tablesEdit.errorSavingLanguage"),
      true, // isAdding
    );

    // Highlight the new row
    highlightedRows.value.lingue = shortUUID;

    // Remove highlight after 3 seconds
    setTimeout(() => {
      highlightedRows.value.lingue = null;
    }, 3000);

    // Scroll to the new row (first row)
    await nextTick();
    if (lingueTable.value) {
      lingueTable.value.scrollTo(0);
    }
  } catch (error) {
    console.error("Error adding lingue row:", error);
    Notify.create({
      message: $t("tablesEdit.errorAddingLanguage") + `: ${error.message}`,
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

// Permission check is already handled in template with v-if="userStore.canManageBooks"

const editoriOptions = computed(() =>
  editori.value.map((e) => ({ label: e.label, value: e.value })),
);

function getEditoreLabel(editoreValue) {
  const found = editori.value.find((e) => e.value === editoreValue);
  return found ? found.label : editoreValue;
}

// Row highlighting functions for all tables
const coversRowClassFn = (row) => {
  return row.value === highlightedRows.value.covers ? "bg-blue-grey-2" : "";
};

const editoriRowClassFn = (row) => {
  return row.value === highlightedRows.value.editori ? "bg-blue-grey-2" : "";
};

const collaneRowClassFn = (row) => {
  return row.value === highlightedRows.value.collane ? "bg-blue-grey-2" : "";
};

const lingueRowClassFn = (row) => {
  return row.value === highlightedRows.value.lingue ? "bg-blue-grey-2" : "";
};

// Delete functions
const confirmDelete = async (tableType, item) => {
  deleteTable.value = tableType;
  deleteItem.value = item;

  // usedBooks and canDelete are now computed properties that update automatically
  deleteDialog.value = true;
};

// Open book details dialog
const openBookDetails = (bookId) => {
  const idStr = String(bookId);

  // GUARD: se stiamo già mostrando lo stesso libro e il dialog è aperto, non fare nulla
  if (isBookDialogOpen.value && selectedBookId.value === idStr) {
    return;
  }

  // Set the selected book ID
  selectedBookId.value = idStr;
  isBookDialogOpen.value = true;
};

const checkUsage = (tableType, itemValue) => {
  // Check if bibliografia is loaded
  if (!bibliografiaStore.isLoaded) {
    return []; // Return empty array, will show as "not used"
  }

  const books = bibliografiaStore.bibliografia || [];

  const usedBooks = books.filter((book) => {
    if (tableType === "editori") {
      return book.editore === itemValue;
    } else if (tableType === "collane") {
      return book.collana === itemValue;
    } else if (tableType === "lingue") {
      return book.lingua === itemValue;
    } else if (tableType === "covers") {
      // Check if any image in the book uses this cover type
      const images = book.images || [];
      return images.some((image) => image.coverTypeId === itemValue);
    }
    return false;
  });

  return usedBooks;
};

const executeDelete = async () => {
  if (!canDelete.value || !deleteItem.value) return;

  try {
    const tableType = deleteTable.value;
    const itemValue = deleteItem.value.value;

    // Remove item from store
    let updatedData;
    if (tableType === "covers") {
      updatedData = covers.value.filter((item) => item.value !== itemValue);
      coversStore.updateCovers(updatedData);
    } else if (tableType === "editori") {
      updatedData = editori.value.filter((item) => item.value !== itemValue);
      editoriStore.updateEditori(updatedData);
    } else if (tableType === "collane") {
      updatedData = collane.value.filter((item) => item.value !== itemValue);
      collaneStore.updateCollane(updatedData);
    } else if (tableType === "lingue") {
      updatedData = lingue.value.filter((item) => item.value !== itemValue);
      lingueStore.updateLingue(updatedData);
    }

    // Save to Firebase
    await saveTableData(
      null,
      null,
      null,
      tableType,
      tableType === "covers"
        ? covers
        : tableType === "editori"
          ? editori
          : tableType === "collane"
            ? collane
            : lingue,
      $t("tablesEdit.deleteSuccess"),
      $t("tablesEdit.deleteError"),
      true, // isAdding=true to skip validation
    );

    // Reset dialog state
    deleteDialog.value = false;
    deleteTable.value = "";
    deleteItem.value = null;
  } catch (error) {
    console.error("Error deleting item:", error);
    Notify.create({
      message: $t("tablesEdit.deleteError") + `: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};
</script>
