<template>
  <div>
    <div class="q-gutter-sm q-mb-md" style="color: secondary">
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
        ></q-select>
        <!-- Filter by collane -->
        <q-select
          v-model="selectedCollana"
          outlined
          label="Filter by collana"
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
    <div v-if="isDesktop">
      <div class="q-pa-md" style="height: 100vh">
        <!-- Use q-virtual-scroll to efficiently render large lists -->
        <q-virtual-scroll
          :items="rowsOfBooks"
          :item-size="600"
          style="height: 100%"
        >
          <template v-slot="{ item }">
            <!-- Render each row of books -->
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
                    <div>{{ book.collanaName }}</div>
                    <div>{{ book.possessed }}</div>
                    <div>{{ book.imageUrl }}</div>
                  </q-card-section>
                </q-card>
              </template>
            </div>
          </template>
        </q-virtual-scroll>
      </div>
    </div>
  </div>

  <div class="q-pa-md" v-if="!isDesktop">
    <div class="flex flex-center">
      <q-virtual-scroll
        style="max-height: 90vh"
        :items="filteredBibliografia"
        separator
        :virtual-scroll-item-size="200"
      >
        <!-- Card content -->
        <template v-slot="{ item }">
          <q-item
            clickable
            v-ripple
            @click="openDettaglioLibro(item.id)"
            :class="item.possessed ? 'bg-green-3' : 'bg-grey-2'"
          >
            <!-- Open modal on click -->
            <q-item-section>
              <!-- Use QImg component -->
              <!-- q-img for lazy loading the image -->
              <q-img
                :src="
                  item && item.signedUrl
                    ? fireStoreUrl + item.signedUrl
                    : bookImage
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
</template>

<script setup>
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "src/store/database";
import { useFiltersStore } from "../store/filtersStore";
import { ref, computed, onMounted, watchEffect } from "vue";
import bookImage from "../assets/400x600.png"; // Import the book image from assets directory
import { fireStoreUrl } from "../firebase/firebaseInit"; // Import fireStoreUrl from firebaseInit
import { useRouter } from "vue-router";
import { useAuth } from "../composable/auth";
import { Platform } from "quasar";
import { useQuasar } from "quasar";

const isDesktop = ref(Platform.is.desktop);
console.log("Platform information:", Platform);

const router = useRouter();
let bibliografia = [];
let editori = [];
let collane = [];

const bibliografiaStore = useBibliografiaStore();
const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();

const searchQuery = ref("");
const selectedEditore = ref("");
const selectedCollana = ref("");
const showFranceseBooks = ref(false);
const isInitialized = ref(false);
const isOpen = ref(false);
const { userID, isLoggedIn, checkAuthState } = useAuth();

onMounted(() => {
  bibliografia = bibliografiaStore.bibliografia;
  editori = editoriStore.editori;
  collane = collaneStore.collane.collana;
  console.log("editori in Bibliografia", editori);
  console.log("collane in Bibliografia", collane);
  console.log("Bibliografia in Bibilografia", bibliografia);

  checkAuthState();

  searchQuery.value = filtersStore.searchQuery;
  selectedEditore.value = filtersStore.selectedEditore;
  selectedCollana.value = filtersStore.selectedCollana;
  showFranceseBooks.value = filtersStore.showFranceseBooks;
  isOpen.value = filtersStore.isOpen;
  //console.log("bibliografia onMount", bibliografia);
  isInitialized.value = true;
  // Set initialization status to true after onMounted
});
const openDettaglioLibro = (id) => {
  router.push({ name: "DettaglioLibro", params: { id } });
};

const handleEditoreChange = (value) => {
  //console.log("Editore selected:", value);
  filtersStore.updateSelectedEditore(value);
};

const handleCollanaChange = (value) => {
  console.log("Collana selected:", value);
  filtersStore.updateSelectedCollana(value);
};

const handleFranceseChange = (value) => {
  //console.log("francese changed:", value);
  filtersStore.updateShowFranceseBooks(value);
};

const toggleExpansion = () => {
  filtersStore.toggleIsOpen();
  isOpen.value = filtersStore.isOpen;
};

const updateSearchQuery = (value) => {
  //console.log("Search query updated:", value);
  filtersStore.updateSearchQuery(value);
};

const filteredBibliografia = computed(() => {
  //console.log("bibliografia in computed", bibliografia);
  // Retrieve the filter values from the Pinia store
  if (!isInitialized.value) return [];

  const searchQueryValue = filtersStore.searchQuery;
  const selectedEditoreValue = filtersStore.selectedEditore;
  const selectedCollanaValue = filtersStore.selectedCollana;
  const showFranceseBooksValue = filtersStore.showFranceseBooks;

  console.log("Selected collana:", selectedCollanaValue);

  //console.log("searchQueryValue", searchQueryValue);
  //console.log("searchQueryValue.lowercase", searchQueryValue?.toLowerCase());

  let filtered = bibliografia;
  //console.log("filtered", filtered); // Use the local variable

  if (searchQueryValue) {
    filtered = filtered.filter((book) => {
      console.log("Filtering by search query:", searchQueryValue);
      return (
        book.titolo &&
        book.titolo.toLowerCase().includes(searchQueryValue.toLowerCase())
      );
    });
  }

  if (selectedEditoreValue) {
    console.log("filter editore", selectedEditoreValue);
    return (filtered = filtered.filter(
      (book) => book.editore === selectedEditoreValue,
    ));
  }
  if (selectedCollanaValue) {
    // Extract the collana name from the selectedCollana object
    const selectedCollanaId = selectedCollanaValue.id;
    console.log("Selected collana:", selectedCollanaId);

    // Filter the books based on the collana name
    filtered = filtered.filter((book) => book.collana === selectedCollanaId);
  }
  if (!showFranceseBooksValue) {
    //console.log("frnacese", showFranceseBooksValue);
    return (filtered = filtered.filter((book) => book.lingua !== "Francese"));
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
};
// Function to group books into rows with specified number of columns

const $q = useQuasar();
const calculateColumnsAndGroupBooks = (books) => {
  const screenWidth = $q.screen.width;
  let columns;
  if (screenWidth < 770) {
    columns = 1;
  } else if (screenWidth < 1122) {
    columns = 2;
  } else if (screenWidth < 1470) {
    columns = 3;
  } else if (screenWidth < 1600) {
    columns = 4;
  } else {
    columns = 5;
  }

  console.log("Number of columns:", columns);

  const rows = [];
  for (let i = 0; i < books.length; i += columns) {
    rows.push(books.slice(i, i + columns));
  }

  return rows;
};

// Usage:
const rowsOfBooks = computed(() =>
  calculateColumnsAndGroupBooks(filteredBibliografia.value),
);
</script>

<style scoped></style>
