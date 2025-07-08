<template>
  <div
    v-if="bookDetails"
    id="details"
    style="max-width: 900px"
    class="items-start q-mt-md q-px-md q-col-gutter-md"
  >
    <div v-for="field in visibleFields" :key="field.id" class="q-mb-md">
      <div class="row items-center q-gutter-x-md">
        <div class="col-12 col-sm-3">{{ field.label }}:</div>

        <div class="col">
          <div
            v-if="
              field.type === 'array' &&
              Array.isArray(bookDetails[field.id]) &&
              typeof bookDetails[field.id][0] === 'object'
            "
          >
            <div class="q-mb-xs">{{ field.label }}</div>
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
          </div>
          <div v-else-if="field.type === 'array'">
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
          </div>
          <q-select
            v-else-if="field.type === 'select'"
            :model-value="bookDetails[field.id]"
            :options="fieldOptions[field.id]"
            emit-value
            map-options
            option-value="value"
            option-label="label"
            dense
            outlined
            readonly
            :label="field.label"
          />
          <q-input
            v-else
            :model-value="bookDetails[field.id]"
            :label="field.label"
            dense
            outlined
            readonly
          />
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

    <div v-if="book">
      <div class="q-mt-lg">
        <div class="text-bold">Campi extra non configurati:</div>
        <div v-for="(value, key) in extraFields" :key="key" class="q-mb-xs">
          <span class="text-primary">{{ key }}:</span>
          <span>{{ value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Notify } from "quasar";

import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useUserStore } from "stores/userStore";
import { bookDetailsConfig } from "config/bookDetailsConfig";
import { syncBook } from "utils/firebaseDatabaseUtils";
import { storeToRefs } from "pinia";
console.log("bookdetails", bookDetailsConfig);
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
      options[field.id] = storeOptions[field.options] || [];
    }
  });
  return options;
});

const isFieldEditable = computed(() => userStore.hasPermission("manage_books"));
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
  if (isFieldEditable.value) {
    return mergedFields.value;
  }
  const filtered = mergedFields.value.filter(
    (f) => f.value !== "" && f.value !== undefined && f.value !== null,
  );
  return filtered;
});

const confirmDeleteBook = ref(false);

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
    await syncBook({ bookId: props.bookId, book: updatedBook });

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
    await syncBook({ bookId: props.bookId, book: updatedBook });
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

const saveDetail = async (bookId, itemId, value) => {
  const cleanValue = getOptionValue(value);

  // Input validation
  if (!bookId || !itemId) {
    Notify.create({
      message: `Invalid input parameters`,
      type: "negative",
      color: "red",
    });
    return;
  }

  try {
    // Validate value based on field type
    if (cleanValue === undefined || cleanValue === null) {
      throw new Error("Invalid value provided");
    }

    // Update the book data in Firebase
    await syncBook({
      bookId,
      book: { [itemId]: cleanValue },
    });

    Notify.create({
      message: `Detail ${itemId} Saved`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    console.error("Error saving detail:", error);
    Notify.create({
      message: `Error saving ${itemId}: ${error.message}`,
      type: "negative",
      color: "red",
    });
  }
};

const extraFields = computed(() => {
  if (!book.value) return {};
  const configIds = new Set(bookDetailsConfig.map((f) => f.id));
  return Object.fromEntries(
    Object.entries(book.value).filter(([key]) => !configIds.has(key)),
  );
});
</script>
