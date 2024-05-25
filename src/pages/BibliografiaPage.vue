<template>
  <div>
    <div class="q-gutter-sm q-mb-md" style="color: secondary">
      <q-card-section>
        <div class="row items-center">
          <!-- Filters Section -->
          <div class="col" style="max-width: 600px">
            <q-expansion-item
              label="Filters"
              v-model="isOpen"
              @update:model-value="toggleExpansion"
            >
              <!-- Filter by Title -->
              <q-input
                v-model="searchQuery"
                outlined
                label="Filter by Title"
                dense
                @update:model-value="updateSearchQuery"
                clearable
                style="height: 48px"
              ></q-input>
              <!-- Filter by Editore -->
              <q-select
                v-model="selectedEditore"
                outlined
                label="Filter by Editore"
                dense
                :options="editori"
                @update:model-value="handleEditoreChange"
                clearable
                option-value="id"
                option-label="editore"
              ></q-select>
              <!-- Filter by Collana -->
              <q-select
                v-model="selectedCollana"
                outlined
                label="Filter by Collana"
                dense
                :options="collane"
                option-value="id"
                option-label="collana"
                @update:model-value="handleCollanaChange"
                clearable
              ></q-select>
              <!-- Tick selection to show/hide books with language "Francese" -->
              <q-checkbox
                v-model="showFranceseBooks"
                label="Show Francese Books"
                @update:model-value="handleFranceseChange"
              />
            </q-expansion-item>
          </div>

          <!-- Toggle Section -->
          <div class="col-auto" v-show="isListView">
            <q-btn
              @click="toggleViewMode"
              color="primary"
              flat
              icon="grid_view"
            />
          </div>

          <!-- Toggle Button (Grid View) -->
          <div class="col-auto" v-show="!isListView">
            <q-btn @click="toggleViewMode" color="primary" flat icon="list" />
          </div>
        </div>
      </q-card-section>
    </div>

    <!-- Grid View -->
    <div v-if="!isListView">
      <div class="q-pa-md" style="height: 100vh">
        <q-virtual-scroll
          :items="rowsOfBooks"
          :item-size="600"
          style="height: 100%"
        >
          <template v-slot="{ item }">
            <div class="row items-start q-mt-md q-px-md q-col-gutter-md">
              <template v-for="book in item" :key="book.id">
                <q-card
                  flat
                  bordered
                  class="column q-mr-xl q-ml-xl"
                  style="width: 250px; height: 400px"
                  @click="openDettaglioLibro(book.id)"
                  :class="book.possessed ? 'bg-green-3' : 'bg-grey-2'"
                >
                  <q-img
                    class="col"
                    :src="
                      fireStoreUrl + book.imageUrl + '?alt=media' || bookImage
                    "
                    style="width: 200px; height: 280px"
                    fit="contain"
                  />
                  <q-card-section>
                    <div>{{ book.titolo }}</div>
                    <div>{{ book.editoreName }}</div>
                    <div>{{ book.collanaName }} {{ book.numeroCollana }}</div>
                  </q-card-section>
                </q-card>
              </template>
            </div>
          </template>
        </q-virtual-scroll>
      </div>
    </div>

    <!-- List View -->
    <div v-if="isListView" class="list-view q-pa-md">
      <div class="q-ma-auto q-gutter-md row">
        <q-virtual-scroll
          :style="{ 'max-height': '90vh' }"
          class="col-xs-12 col-sm-10 col-md-8 col-lg-6 col-xl-4"
          :items="filteredBibliografia"
          separator
          :virtual-scroll-item-size="200"
        >
          <template v-slot="{ item }">
            <q-item
              clickable
              v-ripple
              @click="openDettaglioLibro(item.id)"
              :class="item.possessed ? 'bg-green-3' : 'bg-grey-2'"
            >
              <q-item-section>
                <q-img
                  :src="
                    fireStoreUrl + item.imageUrl + '?alt=media' || bookImage
                  "
                  width="120px"
                  fit="scale-down"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label lines="1">{{ item.titolo }}</q-item-label>
                <q-item-label caption>{{ item.editore }}</q-item-label>
                <q-item-label caption>{{ item.collanaName }}</q-item-label>
                <q-item-label caption>{{ item.possessed }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="info" />
              </q-item-section>
            </q-item>
          </template>
        </q-virtual-scroll>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composable/auth";
import { useQuasar } from "quasar";
import { useFiltersStore } from "../store/filtersStore";
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "src/store/database";
import bookImage from "../assets/400x600.png"; // Import the book image from assets directory
import { fireStoreUrl } from "../firebase/firebaseInit"; // Import fireStoreUrl from firebaseInit

const router = useRouter();
const bibliografiaStore = useBibliografiaStore();
const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const { checkAuthState } = useAuth();
const $q = useQuasar();

const searchQuery = ref("");
const selectedEditore = ref("");
const selectedCollana = ref("");
const showFranceseBooks = ref(false);
const isOpen = ref(false);
const isListView = ref(false);
const isInitialized = ref(false);

let bibliografia = [];
let editori = [];
let collane = [];

onMounted(() => {
  bibliografia = bibliografiaStore.bibliografia;
  editori = editoriStore.editori.editore;
  collane = collaneStore.collane.collana;

  checkAuthState();

  searchQuery.value = filtersStore.searchQuery;
  selectedEditore.value = filtersStore.selectedEditore;
  selectedCollana.value = filtersStore.selectedCollana;
  showFranceseBooks.value = filtersStore.showFranceseBooks;
  isOpen.value = filtersStore.isOpen;
  isListView.value = filtersStore.isListView;
  isInitialized.value = true;
});

const openDettaglioLibro = (id) => {
  router.push({ name: "DettaglioLibro", params: { id } });
};

const handleEditoreChange = (value) => {
  //console.log("selected editore", value);
  filtersStore.updateSelectedEditore(value);
};

const handleCollanaChange = (value) => {
  filtersStore.updateSelectedCollana(value);
};

const handleFranceseChange = (value) => {
  filtersStore.updateShowFranceseBooks(value);
};

const toggleExpansion = () => {
  filtersStore.toggleIsOpen();
  isOpen.value = filtersStore.isOpen;
};

const updateSearchQuery = (value) => {
  filtersStore.updateSearchQuery(value);
};

const filteredBibliografia = computed(() => {
  if (!isInitialized.value) return [];

  const searchQueryValue = filtersStore.searchQuery;
  const selectedEditoreValue = filtersStore.selectedEditore;
  const selectedCollanaValue = filtersStore.selectedCollana;
  const showFranceseBooksValue = filtersStore.showFranceseBooks;

  let filtered = bibliografia;

  if (searchQueryValue) {
    filtered = filtered.filter((book) =>
      book.titolo?.toLowerCase().includes(searchQueryValue.toLowerCase()),
    );
  }

  if (selectedEditoreValue) {
    filtered = filtered.filter(
      (book) => book.editore === selectedEditoreValue.id,
    );
  }

  if (selectedCollanaValue) {
    filtered = filtered.filter(
      (book) => book.collana === selectedCollanaValue.id,
    );
  }

  if (!showFranceseBooksValue) {
    filtered = filtered.filter((book) => book.lingua !== "Francese");
  }

  return filtered;
});

const clearFilters = () => {
  filtersStore.updateSearchQuery("");
  filtersStore.updateSelectedEditore("");
  filtersStore.updateSelectedCollana("");
  filtersStore.updateShowFranceseBooks(false);

  searchQuery.value = "";
  selectedEditore.value = "";
  selectedCollana.value = "";
};

const calculateColumnsAndGroupBooks = (books) => {
  const screenWidth = $q.screen.width;
  let columns;

  if (screenWidth < 750) {
    columns = 1;
  } else if (screenWidth < 1100) {
    columns = 2;
  } else if (screenWidth < 1450) {
    columns = 3;
  } else if (screenWidth < 1800) {
    columns = 4;
  } else {
    columns = 5;
  }

  const groupedBooks = [];
  for (let i = 0; i < books.length; i += columns) {
    groupedBooks.push(books.slice(i, i + columns));
  }
  return groupedBooks;
};

const rowsOfBooks = computed(() =>
  calculateColumnsAndGroupBooks(filteredBibliografia.value),
);

const toggleViewMode = () => {
  filtersStore.updateListView(!filtersStore.isListView);
  isListView.value = filtersStore.isListView;
};
</script>

<style scoped></style>
