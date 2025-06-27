<template>
  <div
    v-if="bookDetails"
    id="details"
    style="max-width: 900px"
    class="items-start q-mt-md q-px-md q-col-gutter-md"
  >
    <div v-for="section in visibleSections" :key="section.name">
      <q-expansion-item
        :label="section.name"
        :default-opened="section.sectionOrder === 0"
        header-class="text-weight-bold"
        expand-separator
      >
        <q-card>
          <q-card-section>
            <div
              v-for="detail in section.items"
              :key="detail.id"
              class="q-mb-md"
            >
              <div class="row items-center q-gutter-x-md">
                <div class="col-12 col-sm-3">{{ detail.label }}:</div>

                <div class="col">
                  <q-input
                    v-if="detail.type === 'text'"
                    v-model="bookDetails[detail.id]"
                    dense
                    outlined
                    :readonly="!isFieldEditable"
                    @change="saveDetail(bookId, detail.id, $event)"
                  />
                  <q-select
                    v-else-if="detail.type === 'select'"
                    v-model="bookDetails[detail.id]"
                    :options="fieldOptions[detail.id]"
                    emit-value
                    map-options
                    option-value="value"
                    option-label="label"
                    dense
                    outlined
                    :readonly="!isFieldEditable"
                    @update:model-value="saveDetail(bookId, detail.id, $event)"
                  />
                  <q-input
                    v-else-if="detail.type === 'array'"
                    :model-value="bookDetails[detail.id]"
                    dense
                    outlined
                    readonly
                    hint="Campo array - visualizzazione sola lettura"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>

    <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="canDeleteBooks">
      <q-btn
        :label="$t('bookDetails.deleteBook')"
        color="negative"
        @click="confirmDeleteBook = true"
        style="min-height: 48px"
      />

      <q-dialog v-model="confirmDeleteBook" persistent>
        <q-card>
          <q-card-section class="q-pa-md">
            <p>{{ $t('bookDetails.confirmDeleteBook') }}</p>
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
import { ref, computed } from "vue";
import { Notify } from "quasar";

import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useUserStore } from "stores/userStore";
import { useAuthStore } from "stores/authStore";
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
const auth = useAuthStore();

const { settings } = storeToRefs(userStore);
const isLoggedIn = computed(() => auth.isLoggedIn);

// --- Book & Field Options
const book = computed(() =>
  bibliografiaStore.bibliografia.find((b) => b.id === props.bookId),
);

const bookDetails = computed(() => {
  if (!book.value) return null;
  const details = {};
  const hasManagePermission = userStore.hasPermission("manage_books");
  console.log("VisibleSections: hasManagePermission", hasManagePermission);
  console.log("BookDetails: hasManagePermission", hasManagePermission);

  if (hasManagePermission) {
    // Per gli utenti con permessi di gestione: TUTTI i campi dalla configurazione
    bookDetailsConfig.forEach((field) => {
      console.log("field", field);
      const value = book.value[field.id];
      if (Array.isArray(value)) {
        // Per gli array, mostra una rappresentazione leggibile
        details[field.id] =
          value.length > 0 ? `Array (${value.length} elementi)` : "Array vuoto";
      } else {
        details[field.id] = value ?? "";
      }
    });
  } else {
    // Per gli altri utenti: solo i campi con dati significativi
    bookDetailsConfig.forEach((field) => {
      const value = book.value[field.id];
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          details[field.id] = `Array (${value.length} elementi)`;
        } else if (!Array.isArray(value)) {
          details[field.id] = value;
        }
      }
    });
  }

  console.log("BookDetails: final details", details);
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

const visibleFields = computed(() => {
  const hasManagePermission = userStore.hasPermission("manage_books");
  if (hasManagePermission) {
    return bookDetailsConfig;
  }
  return bookDetailsConfig.filter((field) => {
    switch (field.visibility) {
      case "public":
        return true;
      case "read_basic":
        return isLoggedIn.value;
      case "read_advanced":
        return isLoggedIn.value;
      case "read_admin":
        return userStore.hasPermission("manage_books");
      case "read_system":
        return userStore.hasPermission("manage_books");
      default:
        return false;
    }
  });
});

const visibleSections = computed(() => {
  const sections = {};
  const hasManagePermission = userStore.hasPermission("manage_books");

  visibleFields.value.forEach((field) => {
    const section = field.section;
    if (!sections[section]) sections[section] = [];

    if (hasManagePermission) {
      sections[section].push(field);
    } else {
      if (
        bookDetails.value &&
        bookDetails.value[field.id] &&
        bookDetails.value[field.id] !== ""
      ) {
        sections[section].push(field);
      }
    }
  });

  let finalSections = Object.entries(sections);

  // Rimuovi sezioni vuote solo se l'utente NON ha i permessi di gestione
  if (!hasManagePermission) {
    finalSections = finalSections.filter(([name, items]) => items.length > 0);
  }

  return finalSections
    .map(([name, items]) => ({
      name,
      sectionOrder: items[0]?.sectionOrder ?? 0,
      items,
    }))
    .sort((a, b) => a.sectionOrder - b.sectionOrder);
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
</script>
