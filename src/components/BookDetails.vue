<template>
  <div
    v-if="bookDetails"
    id="details"
    style="max-width: 900px"
    class="items-start q-mt-md q-px-md q-col-gutter-md"
  >
    <div v-for="field in visibleFields" :key="field.id">
      <div class="row items-center q-gutter-x-md">
        <div class="col">
          <template
            v-if="
              Array.isArray(bookDetails[field.id]) &&
              bookDetails[field.id].length > 0 &&
              typeof bookDetails[field.id][0] === 'object' &&
              field.type === 'array'
            "
          >
            <div>{{ field.label }}</div>
            <q-table
              :rows="bookDetails[field.id]"
              :columns="
                Object.keys(bookDetails[field.id][0] || {}).map((key) => ({
                  name: key,
                  label: key,
                  field: key,
                }))
              "
              row-key="id"
              dense
              flat
              hide-bottom
            />
          </template>
          <template
            v-else-if="
              Array.isArray(bookDetails[field.id]) &&
              field.type === 'array' &&
              (bookDetails[field.id].length === 0 ||
                typeof bookDetails[field.id][0] !== 'object')
            "
          >
            <div class="q-mb-xs">{{ field.label }}</div>
            <q-chip
              v-for="(item, idx) in bookDetails[field.id]"
              :key="idx"
              color="primary"
              text-color="white"
              class="q-mr-xs"
            >
              {{ item }}
            </q-chip>
            <div v-if="!bookDetails[field.id]?.length" class="text-grey">
              (Nessun elemento)
            </div>
          </template>
          <template
            v-else-if="
              Array.isArray(bookDetails[field.id]) && field.type === 'array'
            "
          >
            <div
              class="q-mt-xs q-mb-xs bg-warning text-black q-pa-sm rounded-borders"
            >
              <strong>⚠️ Config Warning:</strong> Campo
              <code>{{ field.id }}</code> (<code>{{ field.label }}</code
              >)<br />
              <span
                >Type: <code>{{ field.type }}</code> | Value:
                <code>{{ JSON.stringify(bookDetails[field.id]) }}</code></span
              ><br />
              <span
                >Config: <code>{{ JSON.stringify(field) }}</code></span
              >
              <div class="text-caption text-grey-8">
                Questo campo array non è gestito da tabella/chip. Correggi
                <code>bookDetailsConfig</code> o la logica di visualizzazione.
              </div>
            </div>
          </template>
          <template v-else>
            <template v-if="field.type === 'boolean'">
              <q-badge
                v-if="!isFieldEditable(field)"
                :color="bookDetails[field.id] ? 'green' : 'red'"
                text-color="white"
              >
                {{ bookDetails[field.id] ? "Sì" : "No" }}
              </q-badge>
              <q-toggle
                v-else
                :model-value="bookDetails[field.id]"
                @update:model-value="
                  (val) => saveDetail(props.bookId, field.id, val)
                "
                color="primary"
              />
              <span v-if="saveStatus[field.id] === 'saving'" class="q-ml-xs"
                ><q-spinner size="xs" color="primary"
              /></span>
              <q-icon
                v-else-if="saveStatus[field.id] === 'success'"
                name="check_circle"
                color="green"
                class="q-ml-xs"
              />
              <q-icon
                v-else-if="saveStatus[field.id] === 'error'"
                name="error"
                color="red"
                class="q-ml-xs"
              />
            </template>
            <q-select
              v-else-if="field.type === 'select'"
              :model-value="bookDetails[field.id]"
              :options="fieldOptions[field.id]"
              emit-value
              map-options
              option-value="value"
              option-label="label"
              dense
              :outlined="isFieldEditable(field)"
              :borderless="!isFieldEditable(field)"
              :hide-dropdown-icon="!isFieldEditable(field)"
              :readonly="!isFieldEditable(field)"
              @update:model-value="
                (val) =>
                  isFieldEditable(field) &&
                  saveDetail(props.bookId, field.id, val)
              "
              :label="field.label"
            >
              <template #append>
                <span v-if="saveStatus[field.id] === 'saving'" class="q-ml-xs"
                  ><q-spinner size="xs" color="primary"
                /></span>
                <q-icon
                  v-else-if="saveStatus[field.id] === 'success'"
                  name="check_circle"
                  color="green"
                  class="q-ml-xs"
                />
                <q-icon
                  v-else-if="saveStatus[field.id] === 'error'"
                  name="error"
                  color="red"
                  class="q-ml-xs"
                />
              </template>
            </q-select>
            <q-input
              v-else-if="field.type === 'date'"
              :model-value="
                bookDetails[field.id]
                  ? new Date(bookDetails[field.id]).toISOString().slice(0, 16)
                  : ''
              "
              :type="isFieldEditable(field) ? 'datetime-local' : 'text'"
              :readonly="!isFieldEditable(field)"
              @update:model-value="
                (val) =>
                  isFieldEditable(field) &&
                  saveDetail(props.bookId, field.id, val)
              "
              :label="field.label"
              dense
              :outlined="isFieldEditable(field)"
              :borderless="!isFieldEditable(field)"
            >
              <template #append>
                <span v-if="saveStatus[field.id] === 'saving'" class="q-ml-xs"
                  ><q-spinner size="xs" color="primary"
                /></span>
                <q-icon
                  v-else-if="saveStatus[field.id] === 'success'"
                  name="check_circle"
                  color="green"
                  class="q-ml-xs"
                />
                <q-icon
                  v-else-if="saveStatus[field.id] === 'error'"
                  name="error"
                  color="red"
                  class="q-ml-xs"
                />
              </template>
            </q-input>
            <q-input
              v-else-if="!Array.isArray(bookDetails[field.id])"
              :model-value="localFieldValues[field.id]"
              :readonly="!isFieldEditable(field)"
              @update:model-value="
                (val) =>
                  isFieldEditable(field) && (localFieldValues[field.id] = val)
              "
              @blur="
                () =>
                  isFieldEditable(field) &&
                  saveDetail(props.bookId, field.id, localFieldValues[field.id])
              "
              :label="field.label"
              dense
              :outlined="isFieldEditable(field)"
              :borderless="!isFieldEditable(field)"
            >
              <template #append>
                <span v-if="saveStatus[field.id] === 'saving'" class="q-ml-xs"
                  ><q-spinner size="xs" color="primary"
                /></span>
                <q-icon
                  v-else-if="saveStatus[field.id] === 'success'"
                  name="check_circle"
                  color="green"
                  class="q-ml-xs"
                />
                <q-icon
                  v-else-if="saveStatus[field.id] === 'error'"
                  name="error"
                  color="red"
                  class="q-ml-xs"
                />
              </template>
            </q-input>
          </template>
        </div>
      </div>
    </div>

    <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="canDeleteBooks">
      <q-btn
        v-if="!book.value?.deleted"
        :label="$t('bookDetails.deleteBook')"
        color="negative"
        @click="confirmDeleteBook = true"
        style="min-height: 48px"
      />
      <q-btn
        v-else
        label="Ripristina libro"
        color="positive"
        @click="handleRestoreBook"
        style="min-height: 48px"
      />
      <q-dialog v-model="confirmDeleteBook" persistent>
        <q-card>
          <q-card-section class="q-pa-md">
            <p>{{ $t("bookDetails.confirmDeleteBook") }}</p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              :label="$t('common.cancel')"
              color="primary"
              @click="confirmDeleteBook = false"
              style="min-height: 48px"
            />
            <q-btn
              flat
              :label="$t('common.confirm')"
              color="negative"
              @click="handleDeleteBook"
              style="min-height: 48px"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from "vue";
import { Notify, Platform } from "quasar";
import { useBackButton } from "src/composables/useBackButton";

import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useUserStore } from "stores/userStore";
import { bookDetailsConfig } from "config/bookDetailsConfig";
import { updateDocInCollection } from "utils/firebaseDatabaseUtils";
const props = defineProps({ bookId: { type: String, required: true } });
const emit = defineEmits(["bookDeleted"]);

const getOptionValue = (field) => {
  if (
    field !== null &&
    typeof field === "object" &&
    Object.prototype.hasOwnProperty.call(field, "value")
  ) {
    return field.value;
  }
  return field;
};

// --- Stores
const bibliografiaStore = useBibliografiaStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const lingueStore = useLingueStore();
const userStore = useUserStore();

// --- Book & Field Options
const book = computed(() =>
  bibliografiaStore.bibliografia.find((b) => b.id === props.bookId),
);

const bookDetails = computed(() => {
  if (!book.value) return {};
  const details = {};
  bookDetailsConfig.forEach((field) => {
    details[field.id] = book.value[field.id] ?? "";
  });
  return details;
});

const storeOptions = {
  editori: editoriStore.editori,
  collane: collaneStore.collane,
  lingue: lingueStore.lingue,
};

const fieldOptions = computed(() => {
  const options = {};
  bookDetailsConfig.forEach((field) => {
    if (field.type === "select") {
      if (Array.isArray(field.options)) {
        options[field.id] = field.options;
      } else {
        options[field.id] = storeOptions[field.options] || [];
      }
    }
  });
  return options;
});

const isFieldEditable = (field) =>
  isFieldEditableGlobal.value && !field.readOnly;
const isFieldEditableGlobal = computed(() =>
  userStore.hasPermission("manage_books"),
);
const canDeleteBooks = computed(() => userStore.hasPermission("manage_books"));

const mergedFields = computed(() => {
  if (!book.value) return [];
  const merged = bookDetailsConfig.map((field) => ({
    ...field,
    value: book.value[field.id] ?? "",
  }));
  return merged;
});

const visibleFields = computed(() => {
  let fields = [];
  if (isFieldEditable.value) {
    // Admin/editor: tutti i campi
    fields = mergedFields.value;
  } else {
    // Utente normale o non loggato: solo campi non-readOnly e valorizzati
    fields = mergedFields.value.filter(
      (f) =>
        f.readOnly === false &&
        f.value !== "" &&
        f.value !== undefined &&
        f.value !== null,
    );
  }
  // Ordina per sectionOrder
  return fields
    .slice()
    .sort((a, b) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0));
});

const confirmDeleteBook = ref(false);

// Gestione del pulsante "back" su mobile per chiudere il dialog di conferma
if (Platform.is.capacitor) {
  useBackButton(() => {
    if (confirmDeleteBook.value) {
      confirmDeleteBook.value = false;
    }
  }, () => confirmDeleteBook.value);
}

const handleDeleteBook = async () => {
  if (!props.bookId) {
    Notify.create({
      message: "Invalid book ID",
      type: "negative",
    });
    return;
  }

  try {
    // Verifica permessi
    if (!userStore.hasPermission("manage_books")) {
      Notify.create({
        message: "Non hai i permessi per eliminare libri",
        type: "negative",
      });
      return;
    }

    const userEmail = userStore.user?.email || "system";
    const book = bibliografiaStore.bibliografia.find(
      (b) => b.id === props.bookId,
    );

    if (!book) {
      throw new Error("Book not found");
    }

    const now = new Date();
    const updatedBook = {
      ...book,
      deleted: true,
      deletedAt: now.toISOString(),
      deletedBy: userEmail,
    };

    // Usa la funzione centralizzata per sincronizzare
    await updateDocInCollection("Bibliografia", props.bookId, updatedBook, {
      includeTimestamp: true,
    });

    Notify.create({
      message: "Book marked as deleted successfully",
      type: "positive",
    });

    confirmDeleteBook.value = false;
    emit("bookDeleted", props.bookId);
  } catch (error) {
    console.error("Error marking book as deleted:", error);
    Notify.create({
      message: `Failed to mark book as deleted: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

const handleRestoreBook = async () => {
  if (!props.bookId) {
    Notify.create({
      message: "Invalid book ID",
      type: "negative",
    });
    return;
  }
  try {
    const book = bibliografiaStore.bibliografia.find(
      (b) => b.id === props.bookId,
    );
    if (!book) {
      throw new Error("Book not found");
    }
    const updatedBook = {
      ...book,
      deleted: false,
      deletedAt: "",
      deletedBy: "",
    };
    await updateDocInCollection("Bibliografia", props.bookId, updatedBook, {
      includeTimestamp: true,
    });
    Notify.create({
      message: "Libro ripristinato con successo",
      type: "positive",
    });
  } catch (error) {
    console.error("Error restoring book:", error);
    Notify.create({
      message: `Errore nel ripristino: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};

// Stato di salvataggio per ogni campo
const saveStatus = reactive({}); // { [fieldId]: 'success' | 'error' | 'saving' | undefined }

const setSaveStatus = (fieldId, status) => {
  saveStatus[fieldId] = status;
  if (status === "success" || status === "error") {
    setTimeout(() => {
      if (saveStatus[fieldId] === status) saveStatus[fieldId] = undefined;
    }, 2000);
  }
};

const saveDetail = async (bookId, itemId, value) => {
  const cleanValue = getOptionValue(value);
  if (!bookId || !itemId) {
    Notify.create({
      message: `Invalid input parameters`,
      type: "negative",
      color: "red",
    });
    setSaveStatus(itemId, "error");
    return;
  }
  try {
    setSaveStatus(itemId, "saving");
    if (cleanValue === undefined || cleanValue === null) {
      throw new Error("Invalid value provided");
    }
    await updateDocInCollection(
      "Bibliografia",
      bookId,
      { [itemId]: cleanValue },
      { includeTimestamp: true },
    );
    setSaveStatus(itemId, "success");
  } catch (error) {
    console.error("Error saving detail:", error);
    setSaveStatus(itemId, "error");
  }
};

// Stato locale per i valori dei campi testuali
const localFieldValues = reactive({});

// Inizializza i valori locali quando cambia il libro
watch(
  () => bookDetails.value,
  (details) => {
    if (details) {
      for (const key of Object.keys(details)) {
        localFieldValues[key] = details[key];
      }
    }
  },
  { immediate: true, deep: true },
);
</script>
