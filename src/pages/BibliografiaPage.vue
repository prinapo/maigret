<template>
  <div class="q-pa-md">
    <q-page class="bg-grey-2" v-if="isInitialized">
      <div id="grid view" class="grid-container" v-if="!isListView">
        <q-card
          id="card_level"
          v-for="(book, index) in sortedBibliografia"
          :key="book.id"
          flat
          class="card"
          v-show="shouldShowBook(book)"
        >
          <q-card-section
            id="first_section_image"
            class="q-pa-sm"
            @click="openDettaglioLibro(book.id)"
          >
            <q-badge
              v-if="book.posseduto"
              color="green"
              floating
              style="position: absolute; top: 5px; right: 5px; z-index: 1"
              >posseduto</q-badge
            >
            <q-img
              :src="`${fireStoreTmblUrl}${encodeURIComponent(book.defaultImageName)}?alt=media`"
              class="full-width"
              fit="contain"
              :placeholder-src="placeholderImage"
              :error-src="placeholderImage"
            >
              <q-badge
                v-if="book.numeroCollana"
                color="green"
                style="
                  position: absolute;
                  bottom: 5px;
                  right: 5px;
                  font-size: 0.8em;
                  padding: 2px 4px;
                  min-width: 18px;
                  min-height: 18px;
                "
                >{{ book.numeroCollana }}</q-badge
              >
            </q-img>
          </q-card-section>
          <q-card-section
            id="text_section"
            class="text-caption q-pl-sm q-pr-sm q-pb-sm q-pt-none"
            style="height: 60px; width: 160px; overflow: hidden"
          >
            <div class="text-weight-bold ellipsis text-no-wrap overflow-hidden">
              {{ book.titolo }}
            </div>
            <div
              style="line-height: 1.2"
              class="text-grey-7 ellipsis text-no-wrap overflow-hidden"
              @click="handleEditoreClick(book.editore)"
            >
              {{ editoriList.find((e) => e.id === book.editore)?.editore }}
            </div>
            <div
              style="line-height: 1.2"
              class="text-grey-7 ellipsis text-no-wrap overflow-hidden"
              @click="handleCollanaClick(book.collana)"
            >
              {{ collaneList.find((c) => c.id === book.collana)?.collana }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- List View -->

      <q-virtual-scroll
        v-if="isListView"
        :style="{ 'max-height': '90vh' }"
        class="col-xs-12 col-sm-10 col-md-8 col-lg-6 col-xl-4"
        :items="filteredBibliografia"
        separator
        :virtual-scroll-item-size="20"
        v-slot="{ item }"
      >
        <q-item
          clickable
          @click="openDettaglioLibro(item.id)"
          :class="item.posseduto ? 'bg-green-3' : 'bg-grey-2'"
          style="height: 120px"
          dense
        >
          <q-item-section>
            <q-img
              :src="getImageSource(item.defaultImageName)"
              fit="scale-down"
              no-spinner
              :key="item.defaultImageName"
              class="q-pa-md q-pt-lg"
              lazy
              :placeholder-src="placeholderImage"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label caption>{{ item.titolo }}</q-item-label>
            <q-item-label caption>{{ item.editore }}</q-item-label>
            <q-item-label caption>{{ item.collana }}</q-item-label>
            <q-item-label caption>{{ item.posseduto }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="info" />
          </q-item-section>
        </q-item>
      </q-virtual-scroll>
    </q-page>

    <q-dialog v-model="isDialogOpen" full-width full-height persistent>
      <q-card
        class="full-height hide-scrollbar relative-position"
        style="padding-top: 0"
      >
        <q-btn
          icon="close"
          flat
          round
          dense
          v-close-popup
          class="absolute-top-left q-ma-md bg-grey-8"
          color="white"
          style="z-index: 1000; border-radius: 50%"
        />
        <q-card-section class="q-pa-none full-height">
          <BookDetailContent :bookId="selectedBookId" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { fireStoreTmblUrl } from "../firebase/firebaseInit"; // Assuming you have Firebase storage initialized
import { ref, computed, onMounted } from "vue";
import { useAuth } from "../composable/auth";
import { useFiltersStore } from "../store/filtersStore";
import BookDetailContent from "../components/BookDetailContent.vue";
import placeholderImage from "../assets/placeholder.jpg";

import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "src/store/database";

const isDialogOpen = ref(false);
const selectedBookId = ref(null);

const openBookDetails = (book) => {
  selectedBookId.value = book;
  isDialogOpen.value = true;
};

const editoriList = computed(() => editoriStore.editori);
const collaneList = computed(() => collaneStore.collane);

const bibliografiaStore = useBibliografiaStore();
const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const localBibliografia = ref([]);

const { checkAuthState } = useAuth();

const searchQuery = ref("");
const selectedEditore = ref(null);
const selectedCollana = ref(null);
const showFranceseBooks = ref(false);
const orderBy = ref(null);
const italiano = ref(false);
const francese = ref(false);
const posseduto = ref(false);
const nonPosseduto = ref(false);
const isOpen = ref(false);
const isListView = ref(false);
const isInitialized = ref(false);

let editori = [];
let collane = [];

const openDettaglioLibro = (bookId) => {
  openBookDetails(bookId);
};

const handleEditoreClick = (editoreId) => {
  const selectedEditoreObject = editori.find((e) => e.id === editoreId);
  selectedEditore.value = selectedEditoreObject;
  filtersStore.updateSelectedEditore(selectedEditoreObject);
  isOpen.value = true;
  filtersStore.toggleIsOpen();
};

const handleCollanaClick = (collanaId) => {
  const selectedCollanaObject = collane.find((c) => c.id === collanaId);
  selectedCollana.value = selectedCollanaObject;
  filtersStore.updateSelectedCollana(selectedCollanaObject);
  isOpen.value = true;
  filtersStore.toggleIsOpen();
};
const filteredBibliografia = computed(() => {
  return localBibliografia.value;
});

const shouldShowBook = (book) => {
  // Search query check
  if (
    filtersStore.searchQuery &&
    !book.titolo?.toLowerCase().includes(filtersStore.searchQuery.toLowerCase())
  ) {
    return false;
  }

  // Publisher check
  if (
    filtersStore.selectedEditore &&
    book.editore !== filtersStore.selectedEditore.id
  ) {
    return false;
  }

  // Series check
  if (
    filtersStore.selectedCollana &&
    book.collana !== filtersStore.selectedCollana.id
  ) {
    return false;
  }

  // Language checks
  const isItaliano = ["Italiano", "italiano"].includes(book.lingua);
  const isFrancese = ["Francese", "francese"].includes(book.lingua);

  if (filtersStore.italiano && !filtersStore.francese && !isItaliano) {
    return false;
  }
  if (filtersStore.francese && !filtersStore.italiano && !isFrancese) {
    return false;
  }
  if (!filtersStore.italiano && !filtersStore.francese) {
    return false; // Hide all if no language selected
  }

  // Possession checks
  if (filtersStore.posseduto && !filtersStore.nonPosseduto) {
    return book.posseduto === true;
  }
  if (!filtersStore.posseduto && filtersStore.nonPosseduto) {
    return book.posseduto === false;
  }
  if (!filtersStore.posseduto && !filtersStore.nonPosseduto) {
    return false; // Hide all if neither possession status selected
  }

  return true; // Show if all filters pass or no filters active
};
const sortedBibliografia = computed(() => {
  const orderByKey = filtersStore.orderBy?.value; // Extract the value property
  console.log("Sorting by key:", orderByKey);

  if (!orderByKey) {
    console.log("No sorting applied, returning original array");
    return filteredBibliografia.value;
  }

  const sorted = [...filteredBibliografia.value].sort((a, b) => {
    // Handle undefined or null values
    const valueA = a[orderByKey] ?? "";
    const valueB = b[orderByKey] ?? "";

    // Handle string comparison
    if (typeof valueA === "string" && typeof valueB === "string") {
      return valueA.localeCompare(valueB);
    }

    // Handle number comparison
    return valueA - valueB;
  });

  return sorted;
});
onMounted(async () => {
  await Promise.all([
    checkAuthState(),
    Promise.resolve().then(() => {
      editori = editoriStore.editori;
      collane = collaneStore.collane;
    }),
  ]);

  checkAuthState();

  searchQuery.value = filtersStore.searchQuery;
  selectedEditore.value = filtersStore.selectedEditore;
  selectedCollana.value = filtersStore.selectedCollana;
  showFranceseBooks.value = filtersStore.showFranceseBooks;
  orderBy.value = filtersStore.orderBy;
  italiano.value = filtersStore.italiano;
  francese.value = filtersStore.francese;
  posseduto.value = filtersStore.posseduto;
  nonPosseduto.value = filtersStore.nonPosseduto;
  isOpen.value = filtersStore.isOpen;
  isListView.value = filtersStore.isListView;
  localBibliografia.value = [...bibliografiaStore.bibliografia].sort((a, b) => {
    const orderBy = filtersStore.orderBy;
    if (!orderBy) return 0; // Se non c'è ordinamento, mantieni l'ordine originale

    return a[orderBy] < b[orderBy] ? -1 : a[orderBy] > b[orderBy] ? 1 : 0;
  });

  isInitialized.value = true;

  console.log(
    "onMounted BibliografiaPage - isInitialized",
    localBibliografia.value,
  );
});
</script>
<style scoped>
.book-details {
  overflow: hidden;
}

.card {
  max-width: 140px;
}
.grid-container {
  display: grid;
  gap: 10px;
  width: 100%;
  padding: 10px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: repeat(
      auto-fit,
      minmax(120px, 1fr)
    ); /* Minimo 120px per schermi piccoli */
  }
}
</style>
