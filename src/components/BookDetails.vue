<template>
  <div
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "../store/database";
import { useAuth } from "../composable/auth";
import { saveDetail } from "../utils/detailsUtils";
import { deleteBook } from "../utils/deleteBookUtils";
import { useUserSettingsStore } from "src/store/userSettings";
import { storeToRefs } from "pinia";

const userSettings = useUserSettingsStore();
const { adminMode } = storeToRefs(userSettings);

const { checkAuthState } = useAuth();
const editoriStore = useEditoriStore();
const editoriOptionList = computed(() => editoriStore.editori);
const collaneStore = useCollaneStore();
const collaneOptionList = computed(() => collaneStore.collane);
const detailOriginalValue = ref("");
const confirmDeleteBook = ref(false);

const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
});

const handleDeleteBook = async () => {
  await deleteBook(props.bookId);
  confirmDeleteBook.value = false;
};

const bibliografiaStore = useBibliografiaStore();
const bookDetails = computed(() => {
  const book = bibliografiaStore.bibliografia.find(
    (b) => b.id === props.bookId,
  );
  return book ? transformBookToDetails(book) : null;
});

const transformBookToDetails = (book) => {
  return [
    { id: "titolo", label: "Titolo", value: book.titolo },
    {
      id: "editore",
      label: "Editore",
      value: editoriOptionList.value.find((e) => e.id === book.editore) || null,
    },
    {
      id: "collana",
      label: "Collana",
      value: collaneOptionList.value.find((c) => c.id === book.collana) || null,
    },
    { id: "numeroCollana", label: "Numero", value: book.numeroCollana },

    // Add other book details as needed
  ];
};

const handleInputBlur = (bookId, detailId, detailValue) => {
  if (detailOriginalValue.value !== detailValue) {
    saveDetail(bookId, detailId, detailValue);
  }
};

const handleInputFocus = (detailValue) => {
  setTimeout(() => {
    detailOriginalValue.value = detailValue;
  }, 100);
};
onMounted(() => {
  checkAuthState();
});
</script>
