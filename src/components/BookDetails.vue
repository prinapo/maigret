<template>
  <div
    v-if="book"
    id="details"
    style="max-width: 900px"
    class="q-mt-md q-px-md q-col-gutter-md"
  >
    <div
      v-for="field in visibleFields"
      :key="field.id"
      class="q-mb-xs q-pa-xs border rounded-borders"
    >
      <!-- Nome del campo -->
      <div class="text-bold q-mb-xs">{{ field.label }}</div>

      <!-- Campo array -->
      <template
        v-if="
          field.type === 'array' && Array.isArray(localFieldValues[field.id])
        "
      >
        <div v-if="localFieldValues[field.id].length">
          <div
            v-for="(item, index) in localFieldValues[field.id]"
            :key="item.uuid || index"
            class="q-mb-sm q-pa-sm border rounded-borders"
          >
            <div v-for="(value, key) in item" :key="key" class="q-mb-xs">
              <strong>{{ key }}:</strong>
              <span v-if="Array.isArray(value)">
                <div v-for="(sub, subIdx) in value" :key="subIdx" class="ml-md">
                  {{ sub }}
                </div>
              </span>
              <span v-else>{{ value }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-grey">(Nessun elemento)</div>
      </template>

      <!-- Campo boolean -->
      <template v-else-if="field.type === 'boolean'">
        <q-badge
          v-if="!isFieldEditable(field)"
          :color="localFieldValues[field.id] ? 'green' : 'red'"
          text-color="white"
        >
          {{ localFieldValues[field.id] ? "Sì" : "No" }}
        </q-badge>
        <q-toggle
          v-else
          :model-value="localFieldValues[field.id]"
          @update:model-value="
            (val) => {
              handleLocalChange(field.id, val);
              handleSaveField(field.id);
            }
          "
          color="primary"
        />
      </template>

      <!-- Campo select -->
      <template v-else-if="field.type === 'select'">
        <q-select
          :model-value="localFieldValues[field.id]"
          :options="fieldOptions[field.id]"
          emit-value
          map-options
          option-value="value"
          option-label="label"
          dense
          :outlined="isFieldEditable(field)"
          @update:model-value="(val) => handleLocalChange(field.id, val)"
          :disable="!isFieldEditable(field)"
          :readonly="!isFieldEditable(field)"
          :borderless="!isFieldEditable(field)"
          :hide-dropdown-icon="!isFieldEditable(field)"
          @popup-hide="handleSaveField(field.id)"
        />
      </template>

      <!-- Campo date -->
      <template v-else-if="field.type === 'date'">
        <q-input
          :model-value="localFieldValues[field.id]"
          :type="isFieldEditable(field) ? 'datetime-local' : 'text'"
          dense
          :readonly="!isFieldEditable(field)"
          :borderless="!isFieldEditable(field)"
          @update:model-value="(val) => handleLocalChange(field.id, val)"
          @blur="handleSaveField(field.id)"
        />
      </template>

      <!-- Campo testo / default -->
      <template v-else>
        <q-input
          :model-value="localFieldValues[field.id]"
          dense
          :readonly="!isFieldEditable(field)"
          :borderless="!isFieldEditable(field)"
          @update:model-value="(val) => handleLocalChange(field.id, val)"
          @blur="handleSaveField(field.id)"
        />
      </template>

      <!-- Linea separatrice -->
    </div>

    <!-- DELETE / RESTORE -->
    <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="canDeleteBooks">
      <q-btn
        v-if="!book?.deleted"
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
/* -------------------------
   Imports (grouped & clean)
   ------------------------- */
import {
  ref,
  computed,
  reactive,
  watch,
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onUpdated,
} from "vue";
import { Notify, Platform } from "quasar";
import { useBackButton } from "src/composables/useBackButton";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useUserStore } from "stores/userStore";
import { bookDetailsConfig } from "config/bookDetailsConfig";
import { updateDocInCollection } from "utils/firebaseDatabaseUtils";

/* -------------------------
   Props / emits / timers
   ------------------------- */
const props = defineProps({ bookId: { type: String, required: true } });
const emit = defineEmits(["bookDeleted"]);

/* -------------------------
   Lifecycle hooks
   ------------------------- */
onBeforeMount(() => {});
onBeforeUpdate(() => {});
onUpdated(() => {});

/* -------------------------
   Stores
   ------------------------- */
const bibliografiaStore = useBibliografiaStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const lingueStore = useLingueStore();
const userStore = useUserStore();

/* -------------------------
   Get book (static snapshot)
   ------------------------- */
const book = computed(() =>
  bibliografiaStore.bibliografia.find((b) => b.id === props.bookId),
);
/* -------------------------
   Build bookDetails (plain object)
   ------------------------- */
const bookDetails = {};
bookDetailsConfig.forEach((field) => {
  bookDetails[field.id] = book?.[field.id] ?? "";
});

/* -------------------------
   Field options (plain)
   ------------------------- */
const storeOptions = {
  editori: editoriStore.editori,
  collane: collaneStore.collane,
  lingue: lingueStore.lingue,
};
const fieldOptions = {};
bookDetailsConfig.forEach((field) => {
  if (field.type === "select") {
    fieldOptions[field.id] = Array.isArray(field.options)
      ? field.options
      : storeOptions[field.options] || [];
  }
});

/* -------------------------
    LOCAL STATE (critical: initialize before any watch)
    ------------------------- */
const localFieldValues = reactive({});
const originalFieldValues = reactive({});
/* -------------------------
   helper per gestire le modifiche locali (centralizzato)
   ------------------------- */
const handleLocalChange = (fieldId, val) => {
  localFieldValues[fieldId] = val;
};
const handleSaveField = async (fieldId) => {
  const newValue = getOptionValue(localFieldValues[fieldId]); // <-- normalizzo
  const oldValue = getOptionValue(originalFieldValues[fieldId]);

  // confronto normalizzato
  if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
    return;
  }

  try {
    await saveDetail(props.bookId, fieldId, newValue);
    // Aggiorno il valore originale per futuri confronti
    originalFieldValues[fieldId] = JSON.parse(JSON.stringify(newValue));
  } catch (error) {
    Notify.create({
      message: `Errore nel salvataggio del campo "${fieldId}"`,
      type: "negative",
    });
  }
};

/* -------------------------
   mergedFields + visibleFields (metadata)
   ------------------------- */
const mergedFields = bookDetailsConfig.map((field) => ({
  ...field,
  value: bookDetails[field.id],
}));

// --- Computed per i campi visibili ---
const visibleFields = computed(() =>
  mergedFields
    .filter((f) => {
      const hasPermission = userStore.hasPermission("manage_books");
      const currentValue = localFieldValues[f.id];
      if (!hasPermission) {
        return (
          currentValue !== "" &&
          currentValue !== undefined &&
          currentValue !== null &&
          !f.readOnly
        );
      }
      return true;
    })
    .sort((a, b) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0)),
);

// --- Funzione helper per editabilità di un campo ---
const isFieldEditable = (field) =>
  userStore.hasPermission("manage_books") && !field.readOnly;

// variabile usata nel template per mostrare i bottoni di delete/restore
const canDeleteBooks = computed(() => userStore.hasPermission("manage_books"));
/* -------------------------
   WATCH (debug): moved AFTER localFieldValues initialization
   (this avoids TDZ / Cannot access before initialization)
   ------------------------- */
watch(
  () =>
    Object.keys(localFieldValues).reduce(
      (acc, k) => acc + (localFieldValues[k] === undefined ? 0 : 1),
      0,
    ),
  () => {},
);
watch(
  book,
  (newBook) => {
    if (newBook) {
      Object.keys(localFieldValues).forEach((k) => delete localFieldValues[k]); // reset
      Object.keys(originalFieldValues).forEach(
        (k) => delete originalFieldValues[k],
      ); // reset
      bookDetailsConfig.forEach((field) => {
        const value = newBook[field.id] ?? "";
        localFieldValues[field.id] = value;
        originalFieldValues[field.id] = JSON.parse(JSON.stringify(value));
      });
    }
  },
  { immediate: true, deep: true },
);
/* -------------------------
   small reactive state
   ------------------------- */
const confirmDeleteBook = ref(false);
const saveStatus = reactive({});

/* -------------------------
   helpers / saving
   ------------------------- */
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
    Notify.create({ message: `Invalid input parameters`, type: "negative" });
    setSaveStatus(itemId, "error");
    return;
  }

  try {
    setSaveStatus(itemId, "saving");
    if (cleanValue === undefined || cleanValue === null)
      throw new Error("Invalid value provided");
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

// --- Back button handler (mobile)
if (Platform.is.capacitor) {
  useBackButton(
    () => {
      if (confirmDeleteBook.value) confirmDeleteBook.value = false;
    },
    () => confirmDeleteBook.value,
  );
}

// --- Delete / Restore
const handleDeleteBook = async () => {
  if (!props.bookId) {
    Notify.create({ message: "Invalid book ID", type: "negative" });
    return;
  }
  if (!userStore.hasPermission("manage_books")) {
    Notify.create({
      message: "Non hai i permessi per eliminare libri",
      type: "negative",
    });
    return;
  }

  try {
    const bookToDelete = bibliografiaStore.bibliografia.find(
      (b) => b.id === props.bookId,
    );
    if (!bookToDelete) throw new Error("Book not found");

    await updateDocInCollection(
      "Bibliografia",
      props.bookId,
      {
        ...bookToDelete,
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: userStore.user?.email || "system",
      },
      { includeTimestamp: true },
    );

    emit("bookDeleted", props.bookId);
    confirmDeleteBook.value = false;
    Notify.create({
      message: "Book marked as deleted successfully",
      type: "positive",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    Notify.create({
      message: `Failed to delete book: ${error.message}`,
      type: "negative",
    });
  }
};

const handleRestoreBook = async () => {
  if (!props.bookId) {
    Notify.create({ message: "Invalid book ID", type: "negative" });
    return;
  }

  try {
    const bookToRestore = bibliografiaStore.bibliografia.find(
      (b) => b.id === props.bookId,
    );
    if (!bookToRestore) throw new Error("Book not found");

    await updateDocInCollection(
      "Bibliografia",
      props.bookId,
      {
        ...bookToRestore,
        deleted: false,
        deletedAt: "",
        deletedBy: "",
      },
      { includeTimestamp: true },
    );

    Notify.create({
      message: "Libro ripristinato con successo",
      type: "positive",
    });
  } catch (error) {
    console.error("Error restoring book:", error);
    Notify.create({
      message: `Errore nel ripristino: ${error.message}`,
      type: "negative",
    });
  }
};

// --- Mounted
onMounted(() => {});

// --- Cleanup
onUnmounted(() => {});

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                               PERMISSION MATRIX                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

Legenda:
- "Campo vuoto" = value = "", null o undefined
- "Campo valorizzato" = value presente
- "Editable" = campo NON ha readOnly = true

╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ Ruolo / Permessi              │ Vede campi vuoti │ Vede campi valorizzati │ Può editare campi │ Può editare readOnly ║
╠═══════════════════════════════╪══════════════════╪════════════════════════╪═══════════════════╪══════════════════════╣
║ Utente ANONIMO                │ NO               │ SÌ                     │ NO                │ NO                   ║
║ Loggato senza "manage_books"  │ NO               │ SÌ                     │ NO                │ NO                   ║
║ Loggato con "manage_books"    │ SÌ               │ SÌ                     │ SÌ (se Editable)  │ NO                   ║
╚═══════════════════════════════╧══════════════════╧════════════════════════╧═══════════════════╧══════════════════════╝

Nota:
- readOnly = true disabilita sempre l'editing, anche per chi ha "manage_books".
- Utente anonimo e loggato senza permessi vedono SOLO campi valorizzati.
- Utente con "manage_books" vede tutti i campi, anche vuoti.
*/
</script>
