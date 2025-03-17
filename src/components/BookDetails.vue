<template>
  <div
    v-if="bookDetails"
    id="details"
    style="max-width: 900px"
    class="items-start q-mt-md q-px-md q-col-gutter-md"
  >
    <div v-for="section in orderedSections" :key="section.name">
      <q-expansion-item
        :label="section.name"
        :default-opened="section.order === 0"
        expand-separator
      >
        <q-list>
          <q-item
            v-for="detail in section.items"
            :key="detail.id"
            class="q-gutter-md full-width"
          >
            <template v-if="detail.type === 'select'">
              <q-item-section top class="full-width">
                <div class="row items-center q-gutter-sm full-width">
                  <q-select
                    :options="getOptions(detail.options)"
                    v-model="bookDetails[detail.id]"
                    option-value="id"
                    option-label="label"
                    color="accent"
                    fill-input
                    :outlined="adminMode"
                    :label="detail.label"
                    @update:model-value="
                      handleSelectChange(bookId, detail.id, $event.id)
                    "
                    :readonly="!adminMode"
                    :hide-dropdown-icon="!adminMode"
                    :borderless="!adminMode"
                    class="col-grow text-h6"
                    style="min-height: 48dp"
                  />
                </div>
              </q-item-section>
            </template>
            <template v-else>
              <q-item-section top class="full-width">
                <div class="row items-center q-gutter-sm full-width">
                  <q-input
                    :outlined="adminMode"
                    v-model="bookDetails[detail.id]"
                    :label="detail.label"
                    :readonly="!adminMode"
                    :borderless="!adminMode"
                    class="text-h6 col-grow"
                    color="accent"
                    @focus="handleInputFocus(bookDetails[detail.id])"
                    @blur="
                      handleInputBlur(bookId, detail.id, bookDetails[detail.id])
                    "
                    style="min-height: 48dp"
                  />
                </div>
              </q-item-section>
            </template>
          </q-item>
        </q-list>
      </q-expansion-item>
    </div>

    <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="adminMode">
      <q-btn
        label="Elimina il libro"
        color="negative"
        @click="confirmDeleteBook = true"
        style="min-height: 48dp"
      />

      <q-dialog v-model="confirmDeleteBook" persistent>
        <q-card>
          <q-card-section class="q-pa-md">
            <p>Sei sicuro di voler eliminare questo libro?</p>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Annulla"
              color="primary"
              @click="confirmDeleteBook = false"
              style="min-height: 48dp"
            />
            <q-btn
              flat
              label="Conferma"
              color="negative"
              @click="handleDeleteBook"
              style="min-height: 48dp"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>

  <!--   <div
    v-if="bookDetails"
    id="details"
    style="max-width: 900px"
    class="items-start q-mt-md q-px-md q-col-gutter-md"
  >
    <q-list>
      <q-item
        v-for="(detail, index) in bookDetails"
        :key="index"
        class="q-gutter- full-width"
      >
        <q-item-section top v-if="detail.id === 'editore'" class="full-width">
          <div class="row items-center q-gutter-sm full-width">
            <q-select
              :options="editoriOptionList"
              v-model="detail.value"
              :option-value="(option) => option.id"
              :option-label="(option) => option.editore"
              color="accent"
              fill-input
              :outlined="adminMode"
              label="Editore"
              @update:model-value="saveDetail(bookId, detail.id, $event.id)"
              dark
              :readonly="!adminMode"
              :hide-dropdown-icon="!adminMode"
              :borderless="!adminMode"
              class="col-grow text-h6"
              style="min-height: 48dp"
            >
            </q-select>
          </div>
        </q-item-section>
        <q-item-section
          top
          v-else-if="detail.id === 'collana'"
          class="full-width"
        >
          <div class="row items-center q-gutter-sm full-width">
            <q-select
              :options="collaneOptionList"
              v-model="detail.value"
              :option-value="(option) => option.id"
              :option-label="(option) => option.collana"
              color="accent"
              fill-input
              :outlined="adminMode"
              label="Collana"
              @update:model-value="saveDetail(bookId, detail.id, $event.id)"
              dark
              :readonly="!adminMode"
              :hide-dropdown-icon="!adminMode"
              :borderless="!adminMode"
              class="col-grow text-h6"
              style="min-height: 48dp"
            >
            </q-select>
          </div>
        </q-item-section>

        <q-item-section top v-else class="full-width">
          <div class="row items-center q-gutter-sm full-width">
            <q-input
              :outlined="adminMode"
              v-model="detail.value"
              :label="detail.label"
              :readonly="!adminMode"
              :borderless="!adminMode"
              class="text-h6 col-grow"
              dark
              color="accent"
              @focus="handleInputFocus(detail.value)"
              @blur="handleInputBlur(bookId, detail.id, detail.value)"
              style="min-height: 48dp"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="adminMode">
      <q-btn
        label="Elimina il libro"
        color="negative"
        @click="confirmDeleteBook = true"
        style="min-height: 48dp"
      />

      <q-dialog v-model="confirmDeleteBook" persistent>
        <q-card>
          <q-card-section class="q-pa-md">
            <p>Sei sicuro di voler eliminare questo libro?</p>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Annulla"
              color="primary"
              @click="confirmDeleteBook = false"
              style="min-height: 48dp"
            />
            <q-btn
              flat
              label="Conferma"
              color="negative"
              @click="handleDeleteBook"
              style="min-height: 48dp"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div> -->
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useBibliografiaStore } from "../store/database";
import { useAuth } from "../composable/auth";
import { saveDetail } from "../utils/detailsUtils";
import { deleteBook } from "../utils/deleteBookUtils";
import { useUserSettingsStore } from "src/store/userSettings";
import { storeToRefs } from "pinia";
import { bookDetailsConfig } from "src/config/bookDetailsConfig";

// Initialize refs and stores
const stores = ref({});
const detailOriginalValue = ref("");
const confirmDeleteBook = ref(false);
const selectFields = bookDetailsConfig.filter(
  (field) => field.type === "select",
);

// Props definition
const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
});

// Initialize stores and options
const initializeStores = async () => {
  for (const field of selectFields) {
    if (field.store?.use) {
      const storeModule = await import(`../store/database`);
      stores.value[field.store.name] = storeModule[field.store.use]();
    }
  }
};

// Create select options after stores are initialized
const selectOptions = computed(() =>
  selectFields.reduce((acc, field) => {
    if (stores.value[field.store?.name]) {
      const store = stores.value[field.store.name];
      acc[field.options] = store[field.options].map((item) => ({
        id: item.id,
        label: item[field.store.labelField],
      }));
    }
    return acc;
  }, {}),
);

// Initialize everything
await initializeStores();

const userSettings = useUserSettingsStore();
const { adminMode } = storeToRefs(userSettings);
const { checkAuthState } = useAuth();
const bibliografiaStore = useBibliografiaStore();

// Computed properties
const sections = computed(() => {
  const result = bookDetailsConfig.reduce((acc, detail) => {
    if (!acc[detail.section]) {
      acc[detail.section] = [];
    }
    acc[detail.section].push(detail);
    acc[detail.section].sort((a, b) => a.sectionOrder - b.sectionOrder);
    return acc;
  }, {});
  console.log("Computed sections:", result);
  return result;
});

const orderedSections = computed(() => {
  const sectionEntries = Object.entries(sections.value).map(
    ([name, items]) => ({
      name,
      order: items[0]?.sectionOrder ?? 0,
      items,
    }),
  );

  return sectionEntries.sort((a, b) => a.order - b.order);
});
const bookDetails = computed(() => {
  const book = bibliografiaStore.bibliografia.find(
    (b) => b.id === props.bookId,
  );
  if (book) {
    const transformed = transformBookToDetails(book);
    console.log("Transformed book:", transformed);
    return transformed;
  }
  return null;
});

// Helper functions
const getOptions = (optionType) => selectOptions.value[optionType] || [];

const transformBookToDetails = (book) => {
  const details = { ...book };

  bookDetailsConfig.forEach((detail) => {
    if (details[detail.id] === undefined) {
      // Don't initialize with empty value, leave undefined
      details[detail.id] = undefined;
    } else if (detail.type === "select") {
      const options = getOptions(detail.options);
      const value = details[detail.id];
      const option = options.find((opt) => opt.id === value);
      details[detail.id] = option || { id: value, label: "" };
    }
  });

  return details;
};

// Event handlers
const handleInputBlur = (bookId, detailId, detailValue) => {
  // Only save if there's an actual value
  if (detailValue !== undefined && detailValue !== "") {
    if (detailOriginalValue.value !== detailValue) {
      console.log(`Saving ${detailId}:`, detailValue);
      saveDetail(bookId, detailId, detailValue);
    }
  }
};

const handleInputFocus = (detailValue) => {
  setTimeout(() => {
    detailOriginalValue.value = detailValue;
  }, 100);
};

const handleSelectChange = (bookId, detailId, value) => {
  // Only save if there's a valid selection
  if (value) {
    console.log(`Saving select ${detailId}:`, value);
    saveDetail(bookId, detailId, value);
  }
};

const handleDeleteBook = async () => {
  await deleteBook(props.bookId);
  confirmDeleteBook.value = false;
};

// Debug helpers
const debugOptions = () => {
  Object.entries(selectOptions.value).forEach(([key, value]) => {
    console.log(`Options for ${key}:`, {
      raw: value,
      count: value?.length || 0,
    });
  });
};

// Lifecycle hooks
onMounted(() => {
  checkAuthState();
  debugOptions();
  console.log({
    bookId: props.bookId,
    bookDetails: bookDetails.value,
    sections: sections.value,
    stores: stores.value,
    selectOptions: selectOptions.value,
  });
});
</script>
