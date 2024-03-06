<template>
  <div>
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
      ></q-input>

      <!-- Filter by Editore -->
      <q-select
        v-model="selectedEditore"
        outlined
        label="Filter by Editore"
        dense
        :options="editoriOptions"
        @update:model-value="handleEditoreChange"
      ></q-select>

      <!-- Tick selection to show/hide books with language "Francese" -->
      <q-checkbox
        v-model="showFranceseBooks"
        label="Show Francese Books"
        @update:model-value="handleFranceseChange"
      />
    </q-expansion-item>
    <!-- Filter by Title -->
    <q-btn
      @click="clearFilters"
      label="Clear Filters"
      color="primary"
      dense
      v-if="searchQuery || selectedEditore"
    />

    <!-- List of books -->
    <div class="cards">
      <router-link
        v-for="book in filteredBibliografia"
        :key="book.id"
        :to="{ name: 'DettaglioLibro', params: { id: book._id } }"
        class="card"
      >
        <!-- Card content -->
        <q-item clickable v-ripple>
          <!-- Open modal on click -->
          <q-item-section>
            <!-- Use QImg component -->
            <!-- q-img for lazy loading the image -->
            <q-img
              :src="book.signedUrl ? book.signedUrl : bookImage"
              width="120px"
              fit="scale-down"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label lines="1">{{ book.titolo }}</q-item-label>
            <q-item-label caption>{{ book.editore }}</q-item-label>
            <q-item-label caption>{{ book.collana }}</q-item-label>
            <q-item-label caption>{{ book.uniqueId }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="info" />
          </q-item-section>
        </q-item>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useBibliografiaStore, useEditoriStore } from "src/store/database";
import { useFiltersStore } from "../store/filtersStore";
import { ref, computed, onMounted } from "vue";
import bookImage from "../assets/400x600.png"; // Import the book image from assets directory

let bibliografia = [];
let editori = [];
const bibliografiaStore = useBibliografiaStore();
const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();

const searchQuery = ref("");
const selectedEditore = ref("");
const showFranceseBooks = ref(false);
const isInitialized = ref(false);
const isOpen = ref(false);

onMounted(() => {
  bibliografia = bibliografiaStore.bibliografia;
  editori = editoriStore.editori;
  searchQuery.value = filtersStore.searchQuery;
  selectedEditore.value = filtersStore.selectedEditore;
  showFranceseBooks.value = filtersStore.showFranceseBooks;
  isOpen.value = filtersStore.isOpen;
  //console.log("bibliografia onMount", bibliografia);
  isInitialized.value = true; // Set initialization status to true after onMounted
});

const handleEditoreChange = (value) => {
  //console.log("Editore selected:", value);
  filtersStore.updateSelectedEditore(value);
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
    //console.log("filter editore", selectedEditoreValue.label);
    return (filtered = filtered.filter(
      (book) => book.editore === selectedEditoreValue.label,
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
  filtersStore.updateShowFranceseBooks(false);

  searchQuery.value = "";
  selectedEditore.value = "";
};

//setup parte lista editori
const editoriOptions = computed(() => {
  const options = [];

  // Run only if initialization is finished
  if (isInitialized.value) {
    Object.values(editori.editore).forEach((item) => {
      options.push({
        label: item.editore,
        value: item.id,
      });
    });
  }

  return options;
});
//console.log("Editori options:", editoriOptions);

//fine editori
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
  max-width: 1200px;
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
