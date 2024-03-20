<template>
  <div class="q-gutter-sm q-mb-md">
    <q-page-sticky position="top-left">
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
    </q-page-sticky>
  </div>
  <q-page-sticky position="top-center">
    <div class="q-pa-md">
      <div class="flex flex-center column">
        <q-virtual-scroll
          style="max-height: 90vh"
          :items="filteredBibliografia"
          separator
        >
          <!-- Card content -->
          <template v-slot="{ item }">
            <q-item clickable v-ripple @click="openDettaglioLibro(item.id)">
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
                <q-item-label caption>{{ item.collana }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="info" />
              </q-item-section>
            </q-item>
          </template>
        </q-virtual-scroll>
      </div>
    </div>
  </q-page-sticky>
</template>

<script setup>
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "src/store/database";
import { useFiltersStore } from "../store/filtersStore";
import { ref, computed, onMounted } from "vue";
import bookImage from "../assets/400x600.png"; // Import the book image from assets directory
import { fireStoreUrl } from "../firebase/firebaseInit"; // Import fireStoreUrl from firebaseInit
import { useRouter } from "vue-router";

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

onMounted(() => {
  bibliografia = bibliografiaStore.bibliografia;
  editori = editoriStore.editori;
  collane = collaneStore.collane;
  console.log("editori in Bibliografia", editori);
  console.log("collane in Bibliografia", collane);

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
  //console.log("Collana selected:", value);
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

  //console.log("searchQueryValue", searchQueryValue);
  //console.log("searchQueryValue.lowercase", searchQueryValue?.toLowerCase());

  let filtered = bibliografia;
  //console.log("filtered", filtered); // Use the local variable

  if (searchQueryValue) {
    filtered = filtered.filter((book) => {
      //console.log("Book Object:", book);
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
    //console.log("filter collana", selectedCollanaValue);
    return (filtered = filtered.filter(
      (book) => book.collana === selectedCollanaValue,
    ));
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
</script>

<style scoped>
/* Add custom styles here if needed */
html {
  font-size: 22px;
}
body {
  padding: 1rem;
}

.card {
  background-color: dodgerblue;
  color: white;
  padding: 1rem;
  height: 12rem;
}
.cards {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
.load-more-btn {
  margin-top: 20px; /* Adjust the margin value as needed */
}
.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px; /* Adjust the margin value as needed */
}
</style>
