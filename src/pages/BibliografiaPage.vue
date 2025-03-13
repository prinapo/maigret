<template>
  <div class="q-pa-md" v-if="isInitialized">
    <q-page>
      <div class="card-container">
        <q-card
          v-for="book in sortedBibliografia"
          :key="book.id"
          flat
          class="card"
          clickable
          @click="openBookDetails(book.id)"
          v-show="shouldShowBook(book)"
        >
          <div class="card-placeholder">
            <q-img
              :src="getImageSource(book.defaultImageName)"
              class="full-width"
              fit="contain"
              :placeholder-src="placeholderImage"
              :error-src="placeholderImage"
              lazy
            >
              <template v-slot:loading>
                <q-skeleton type="rect" class="full-width full-height" />
              </template>
              <q-badge
                v-if="book.numeroCollana"
                color="green"
                class="numero-collana-badge"
                >{{ book.numeroCollana }}</q-badge
              >
            </q-img>
          </div>
        </q-card>
      </div>
    </q-page>
  </div>
  <div class="q-pa-md">
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useAuth } from "../composable/auth";
import { useFiltersStore } from "../store/filtersStore";
import BookDetailContent from "../components/BookDetailContent.vue";
import placeholderImage from "../assets/placeholder.jpg";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";

import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
} from "src/store/database";
const $q = useQuasar();

const batchSize = 60; // Numero di libri da caricare inizialmente
const visibleBooks = ref([]);
const isLoadingMore = ref(true);

const isDialogOpen = ref(false);
const selectedBookId = ref(null);

const openBookDetails = (book) => {
  selectedBookId.value = book;
  isDialogOpen.value = true;
};

const bibliografiaStore = useBibliografiaStore();
const { bibliografia } = storeToRefs(bibliografiaStore);

const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();

const { checkAuthState } = useAuth();
//const editori = computed(() => editoriStore.editori);
//const collane = computed(() => collaneStore.collane);
const {
  searchQuery,
  selectedEditore,
  selectedCollana,
  orderBy,
  italiano,
  francese,
  posseduto,
  nonPosseduto,
} = storeToRefs(filtersStore);

const isInitialized = ref(false);
const observer = ref(null);

const openDettaglioLibro = (bookId) => {
  openBookDetails(bookId);
};

const getImageSource = computed(() => (imageName) => {
  if (!imageName || imageName === "placeholder.jpg") {
    return placeholderImage;
  } else {
    return `${fireStoreTmblUrl}${encodeURIComponent(imageName)}?alt=media`;
  }
});
const shouldShowBook = (book) => {
  // Search query check
  if (
    searchQuery.value &&
    !book.titolo?.toLowerCase().includes(searchQuery.value.toLowerCase())
  ) {
    return false;
  }

  // Publisher check
  if (selectedEditore.value && book.editore !== selectedEditore.value.id) {
    return false;
  }

  // Series check
  if (selectedCollana.value && book.collana !== selectedCollana.value.id) {
    return false;
  }

  // Language checks
  const isItaliano = ["Italiano", "italiano"].includes(book.lingua);
  const isFrancese = ["Francese", "francese"].includes(book.lingua);

  if (italiano.value && !francese.value && !isItaliano) {
    return false;
  }
  if (francese.value && !italiano.value && !isFrancese) {
    return false;
  }
  if (!italiano.value && !francese.value) {
    return false; // Hide all if no language selected
  }

  // Possession checks
  if (posseduto.value && !nonPosseduto.value) {
    return book.posseduto === true;
  }
  if (!posseduto.value && nonPosseduto.value) {
    return book.posseduto === false;
  }
  if (!posseduto.value && !nonPosseduto.value) {
    return false; // Hide all if neither possession status selected
  }

  return true;
};

const sortedBibliografia = computed(() => {
  const orderByKey = orderBy.value?.value;
  console.log("orderByKey", orderByKey);

  if (!orderByKey || !bibliografia.value) {
    // Log first 5 books before sorting
    console.log(
      "Before sorting (no order):",
      bibliografia.value?.slice(0, 5).map((b) => ({
        titolo: b.titolo,
        numeroCollana: b.numeroCollana,
      })),
    );
    return bibliografia.value;
  }

  const sorted = [...bibliografia.value].sort((a, b) => {
    if (orderByKey === "numeroCollana") {
      // Convert both values to numbers, removing non-digits
      const numA =
        parseInt(String(a.numeroCollana).replace(/\D/g, "")) || Infinity;
      const numB =
        parseInt(String(b.numeroCollana).replace(/\D/g, "")) || Infinity;

      // Simple numeric comparison
      return numA - numB;
    }

    // For other fields, use string comparison
    const valueA = a[orderByKey] ?? "";
    const valueB = b[orderByKey] ?? "";
    return String(valueA).localeCompare(String(valueB), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  // Log first 5 books after sorting
  console.log(
    "After sorting:",
    sorted.slice(0, 5).map((b) => ({
      titolo: b.titolo,
      numeroCollana: b.numeroCollana,
    })),
  );

  return sorted;
});
const processBooks = async (books, start, end) => {
  try {
    const newLength = Math.min(end, books.length);
    visibleBooks.value = Array(newLength).fill(null);
    return true;
  } catch (error) {
    console.error("Error processing books:", error);
    $q.notify({
      type: "negative",
      message: "Error loading books",
      position: "top",
      timeout: 2000,
    });
    return false;
  }
};
const loadBooks = async () => {
  if (!sortedBibliografia.value) return;

  visibleBooks.value = [];
  isLoadingMore.value = true;

  // Load first batch from sorted books
  await processBooks(sortedBibliografia.value, 0, batchSize);

  // Load rest in background if needed
  if (sortedBibliografia.value.length > batchSize) {
    setTimeout(() => {
      processBatchesInBackground(sortedBibliografia.value);
    }, 200);
  }
};
const processBatchesInBackground = async (books) => {
  let processed = batchSize;
  while (processed < books.length && isLoadingMore.value) {
    const success = await processBooks(books, processed, processed + batchSize);
    if (!success) break;
    processed += batchSize;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};
watch(
  () => filtersStore.orderBy,
  async () => {
    await loadBooks();
  },
);
watch(
  () => visibleBooks.value.length,
  () => {
    const lastCard = document.querySelector(".card:last-child");
    if (lastCard && observer.value) {
      observer.value.disconnect();
      observer.value.observe(lastCard);
    }
  },
);

let resizeTimeout;
window.addEventListener("resize", () => {
  document.body.classList.add("disable-transitions");

  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    document.body.classList.remove("disable-transitions");
  }, 100);
});

onMounted(async () => {
  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        isLoadingMore.value = true;
      }
    },
    {
      rootMargin: "100px",
    },
  );

  // Update observer when visible books change

  const lastCard = document.querySelector(".card:last-child");
  if (lastCard && observer.value) {
    observer.value.observe(lastCard);
  }
  await loadBooks();

  checkAuthState();
  isInitialized.value = true;
});

onUnmounted(() => {
  // Cleanup observer
  if (observer.value) {
    observer.value.disconnect();
  }
});
</script>
<style scoped>
.card-container {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(clamp(80px, calc((100% - 32px) / 3), 150px), 1fr)
  );
  gap: clamp(4px, 1vw, 16px);
  padding: clamp(4px, 1vw, 16px);
  justify-content: start;
  transition: grid-template-columns 0.3s ease-in-out;
  will-change: grid-template-columns;
}

.card {
  width: 100%;
  max-width: 150px;
  margin: 0 auto;
  padding: clamp(2px, 0.8vw, 8px);
  backface-visibility: hidden;
}

.card:hover {
  transform: scale(1.05);
  z-index: 1;
  transition: transform 0.2s ease-in-out;
}

.card-placeholder {
  aspect-ratio: 0.7;
  width: 100%;
  position: relative;
  min-height: auto;
}

.q-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.numero-collana-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: clamp(0.7em, 0.6em + 0.2vw, 0.8em);
  padding: clamp(1px, 0.2vw, 4px) clamp(2px, 0.4vw, 4px);
  min-width: clamp(16px, 2vw, 18px);
  min-height: clamp(16px, 2vw, 18px);
}
.disable-transitions * {
  transition: none !important;
}
</style>
