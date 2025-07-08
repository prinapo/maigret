<template>
  <div class="q-pa-md">
    <q-page>
      <div v-if="userStore.hasPermission('manage_books')" class="q-mb-md">
        <q-toggle v-model="showDeleted" label="Mostra libri eliminati" />
      </div>
      <div
        v-if="!isInitialized"
        class="flex flex-center"
        style="height: 100vh"
      ></div>
      <div v-else class="card-container">
        <q-card
          v-for="book in paginatedBooks"
          :key="book.id"
          flat
          class="card relative-position"
          clickable
          @click="openBookDetails(book.id)"
        >
          <div v-if="book.posseduto && canCollectBooks" class="posseduto-badge">
            <q-icon name="check" color="white" size="xs" class="check-icon" />
          </div>
          <div class="card-placeholder">
            <q-img
              :src="getImageSource(book.defaultImageName)"
              :ratio="0.7"
              fit="contain"
              class="full-width"
              no-spinner
              no-transition
              loading="lazy"
            >
              <template v-slot:loading>
                <div
                  class="text-grey-6 text-center full-width full-height flex flex-center"
                >
                  <q-icon name="image" size="2em" />
                </div>
              </template>
              <template v-slot:error>
                <div
                  class="text-grey-6 text-center full-width full-height flex flex-center"
                >
                  <q-icon name="error" size="2em" />
                </div>
              </template>
              <q-badge
                v-if="book.numeroCollana"
                color="positive"
                class="numero-collana-badge"
                >{{ book.numeroCollana }}</q-badge
              >
            </q-img>
          </div>
        </q-card>

        <!-- Infinite scroll trigger -->
        <div
          ref="loadMoreTrigger"
          class="load-more-trigger"
          v-if="hasMoreBooks"
        >
          <q-spinner v-if="isLoadingMore" color="primary" size="2em" />
        </div>
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
          class="absolute-top-left q-ma-md bg-dark"
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
//assets
import placeholderImage from "assets/placeholder.jpg";
import { fireStoreTmblUrl } from "boot/firebase";
//native
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
//stores
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import { useUserStore } from "stores/userStore";
import { useFiltersStore } from "stores/filtersStore";
//components
import BookDetailContent from "components/BookDetailContent.vue";
//utils
import { updateThemeFromSettings } from "utils/theme";

// Rimuovere tutto il blocco performanceLogger:
// const performanceLogger = { ... };

updateThemeFromSettings();

const $q = useQuasar();

// Pagination constants
const ITEMS_PER_PAGE = 50;
const LOAD_MORE_THRESHOLD = 10;

// Reactive state
const isDialogOpen = ref(false);
const selectedBookId = ref(null);
const isInitialized = ref(false);
const loadingStep = ref("Initializing...");
const loadingProgress = ref(0);
const currentPage = ref(1);
const isLoadingMore = ref(false);
const loadMoreTrigger = ref(null);
const observer = ref(null);
const showDeleted = ref(false);

// Stores
const bibliografiaStore = useBibliografiaStore();
const { bibliografia } = storeToRefs(bibliografiaStore);
const filtersStore = useFiltersStore();
const { filters } = storeToRefs(filtersStore);
const editoriStore = useEditoriStore();
const { editori } = storeToRefs(editoriStore);
const collaneStore = useCollaneStore();
const { collane } = storeToRefs(collaneStore);
const lingueStore = useLingueStore();
const { lingue } = storeToRefs(lingueStore);
const userStore = useUserStore();
const { settings } = storeToRefs(userStore);

const { canCollectBooks } = storeToRefs(userStore);

const filteredBooks = computed(() => {
  if (!bibliografia.value?.length) {
    return [];
  }
  let filtered = bibliografia.value.filter(shouldShowBook);
  if (!showDeleted.value) {
    filtered = filtered.filter((b) => !b.deleted);
  } else {
    filtered = filtered.filter((b) => b.deleted);
  }
  return filtered;
});

const sortedBooks = computed(() => {
  if (!filteredBooks.value?.length) {
    return [];
  }

  const orderByArr = filters.value.orderBy;
  const orderByKey = orderByArr.length > 0 ? orderByArr[0] : null;

  if (!orderByKey) {
    return [...filteredBooks.value];
  }

  return [...filteredBooks.value].sort((a, b) => {
    if (orderByKey === "numeroCollana") {
      const numA =
        parseInt(String(a.numeroCollana).replace(/\D/g, ""), 10) || Infinity;
      const numB =
        parseInt(String(b.numeroCollana).replace(/\D/g, ""), 10) || Infinity;
      return numA - numB;
    }

    if (orderByKey === "editore") {
      const editoreA =
        editori.value.find((e) => e.value === a.editore)?.label ?? "";
      const editoreB =
        editori.value.find((e) => e.value === b.editore)?.label ?? "";
      return editoreA.localeCompare(editoreB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    if (orderByKey === "collana") {
      const collanaA =
        collane.value.find((c) => c.value === a.collana)?.label ?? "";
      const collanaB =
        collane.value.find((c) => c.value === b.collana)?.label ?? "";
      return collanaA.localeCompare(collanaB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    if (orderByKey === "lingua") {
      const linguaA =
        lingue.value.find((l) => l.value === a.lingua)?.label ?? "";
      const linguaB =
        lingue.value.find((l) => l.value === b.lingua)?.label ?? "";
      return linguaA.localeCompare(linguaB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    const valueA = (a[orderByKey] ?? "").toString().toLowerCase();
    const valueB = (b[orderByKey] ?? "").toString().toLowerCase();
    return valueA.localeCompare(valueB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
});

// Utility functions
const openBookDetails = (bookId) => {
  selectedBookId.value = String(bookId);
  isDialogOpen.value = true;
};

const getImageSource = (imageName) => {
  if (!imageName || imageName === "placeholder.jpg") {
    return placeholderImage;
  }
  return `${fireStoreTmblUrl}${encodeURIComponent(imageName)}?alt=media`;
};

// Optimized filter function with memoization
const shouldShowBook = (book) => {
  // Search query check
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    if (!book.titolo?.toLowerCase().includes(searchLower)) {
      return false;
    }
  }

  // Publisher check
  if (
    Array.isArray(filters.value.selectedEditori) &&
    filters.value.selectedEditori.length > 0 &&
    !filters.value.selectedEditori.includes(book.editore)
  ) {
    return false;
  }

  // Series check
  if (
    Array.isArray(filters.value.selectedCollane) &&
    filters.value.selectedCollane.length > 0 &&
    !filters.value.selectedCollane.includes(book.collana)
  ) {
    return false;
  }

  // Language check
  if (
    Array.isArray(filters.value.lingua) &&
    filters.value.lingua.length > 0 &&
    book.lingua
  ) {
    const bookLingua = String(book.lingua).toLowerCase();
    const selectedLower = filters.value.lingua.map((l) =>
      String(l).toLowerCase(),
    );
    if (!selectedLower.includes(bookLingua)) {
      return false;
    }
  }

  // Possession check
  if (
    Array.isArray(filters.value.posseduto) &&
    filters.value.posseduto.length > 0
  ) {
    const wantYes = filters.value.posseduto.includes("yes");
    const wantNo = filters.value.posseduto.includes("no");

    if (wantYes && !wantNo) {
      if (!book.posseduto) {
        return false;
      }
    } else if (!wantYes && wantNo) {
      if (book.posseduto) {
        return false;
      }
    }
    // se array contiene sia "yes" che "no", o se è vuoto, non si esclude nulla
  }

  return true;
};

// Computed property for paginated books
const paginatedBooks = computed(() => {
  const endIndex = currentPage.value * ITEMS_PER_PAGE;
  return sortedBooks.value.slice(0, endIndex);
});

// Check if there are more books to load
const hasMoreBooks = computed(() => {
  return paginatedBooks.value.length < sortedBooks.value.length;
});

// Load more books function
const loadMoreBooks = () => {
  if (isLoadingMore.value || !hasMoreBooks.value) return;

  isLoadingMore.value = true;

  // Simulate async loading for smooth UX
  setTimeout(() => {
    currentPage.value++;
    isLoadingMore.value = false;
  }, 100);
};

// Reset pagination when filters/sort change
const resetPagination = () => {
  currentPage.value = 1;
};

// Main update function
const updateBooksList = () => {
  resetPagination();
};

// Setup intersection observer for infinite scroll
const setupIntersectionObserver = () => {
  if (observer.value) {
    observer.value.disconnect();
  }

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMoreBooks.value) {
          loadMoreBooks();
        }
      });
    },
    {
      rootMargin: "100px",
      threshold: 0.1,
    },
  );

  nextTick(() => {
    if (loadMoreTrigger.value) {
      observer.value.observe(loadMoreTrigger.value);
    }
  });
};

// Watchers
watch(
  () => bibliografia.value,
  async (newValue) => {
    // [BibliografiaPage] bibliografia watcher triggered
    // newValue, "isInitialized:", isInitialized.value
    if (Array.isArray(newValue) && !isInitialized.value) {
      isInitialized.value = true;
      // [BibliografiaPage] isInitialized set to true
      resetPagination();
      await nextTick();
      requestAnimationFrame(() => {
        // [BibliografiaPage] $q.loading.hide called
        $q.loading.hide();
      });
    }
  },
  { immediate: true },
);

// Unico watcher per tutti i filtri e orderBy
watch(
  () => [
    filters.value.search,
    filters.value.selectedEditori,
    filters.value.selectedCollane,
    filters.value.lingua,
    filters.value.posseduto,
    filters.value.orderBy,
  ],
  () => {
    resetPagination();
  },
  { deep: true },
);

watch(
  () => hasMoreBooks.value,
  (newVal) => {
    if (newVal) {
      setupIntersectionObserver();
    }
  },
);

// Lifecycle
onMounted(() => {
  // [BibliografiaPage] onMounted called
  setupIntersectionObserver();
  $q.loading.show({
    message: "Loading...",
    spinnerColor: "primary",
    messageColor: "dark",
  });
  // [BibliografiaPage] $q.loading.show called
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});
</script>

<style scoped lang="scss">
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
  contain: layout style paint;
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

.posseduto-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 2;
  background-color: $success-badge;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  margin-top: 1px;
}

.load-more-trigger {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  margin-top: 20px;
}

.flex {
  display: flex;
}

.flex-center {
  justify-content: center;
  align-items: center;
}
</style>
