<!-- src/pages/Filter.vue -->
<template>
  <q-card>
    <q-list padding>
      <!-- Prima riga: ricerca, editore, collana, ordina-per -->
      <div class="row">
        <!-- 1. Ricerca titolo (rimane input) -->
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-input
                v-model="searchQuery"
                outlined
                :label="$t('filter.title')"
                dense
                clearable
                prepend-icon="search"
                class="q-mb-md"
                :debounce="500"
                @update:model-value="onSearchInput"
              />
            </q-item-section>
          </q-item>
        </div>

        <!-- 2. Select Editore (multiple) -->
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedEditoriObjects"
                outlined
                :label="$t('filter.publisher')"
                dense
                multiple
                :options="editoriOptions"
                option-value="value"
                option-label="label"
                clearable
                class="q-mb-md"
                prepend-icon="business"
              />
            </q-item-section>
          </q-item>
        </div>

        <!-- 3. Select Collana (multiple) -->
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedCollaneObjects"
                outlined
                :label="$t('filter.series')"
                dense
                multiple
                :options="collaneOptions"
                option-value="value"
                option-label="label"
                clearable
                class="q-mb-md"
              />
            </q-item-section>
          </q-item>
        </div>

        <!-- 4. Select Ordina per (multiple) -->
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedOrderByObjects"
                :options="orderByOptions"
                :label="$t('filter.sortBy')"
                dense
                multiple
                outlined
                class="q-mb-sm"
                clearable
                option-value="value"
                option-label="label"
              />
            </q-item-section>
          </q-item>
        </div>
      </div>

      <!-- Seconda riga: lingua + posseduto -->
      <div class="row">
        <!-- 5. Select Lingua (multiple) -->
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedLinguaObjects"
                outlined
                :label="$t('filter.language')"
                dense
                multiple
                :options="lingueOptions"
                option-value="value"
                option-label="label"
                clearable
                class="q-mb-md"
              />
            </q-item-section>
          </q-item>
        </div>

        <!-- 6. Select Posseduto (multiple: yes/no) -->
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedPossedutoObjects"
                outlined
                :label="$t('filter.owned')"
                dense
                multiple
                :options="possedutoOptions"
                option-value="value"
                option-label="label"
                clearable
                class="q-mb-md"
              />
            </q-item-section>
          </q-item>
        </div>
      </div>
    </q-list>
  </q-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useFiltersStore } from "stores/filtersStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";

// Riferimenti ai pinia-store
const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const lingueStore = useLingueStore();

// Opzioni dropdown (array di oggetti {value, label})
const editoriOptions = ref([]);
const collaneOptions = ref([]);
const lingueOptions = ref([]);
const possedutoOptions = ref([
  { label: "Posseduto", value: "yes" },
  { label: "Non Posseduto", value: "no" },
]);
const orderByOptions = [
  { label: "Titolo", value: "titolo" },
  { label: "Collana", value: "collana" },
  { label: "Editore", value: "editore" },
  { label: "Numero Collana", value: "numeroCollana" },
  { label: "Lingua", value: "lingua" },
];

// Estraggo i Ref di filters dal Pinia-store
const { filters } = storeToRefs(filtersStore);

// --- 1) Search query (uguale a prima) ---
const searchQuery = ref("");
const onSearchInput = (val) => {
  if (val && val.length < 3) {
    filtersStore.updateSearchQuery("");
    return;
  }
  filtersStore.updateSearchQuery(val || "");
};
watch(
  () => filters.value.search,
  (newVal) => {
    if (newVal !== searchQuery.value) {
      searchQuery.value = newVal;
    }
  },
  { immediate: true },
);

// ────────────────────────────────────────────────────────────────
// 2) Editori come select multi: array di oggetti ↔→ array di stringhe
// ────────────────────────────────────────────────────────────────
const selectedEditoriObjects = computed({
  get: () => {
    return editoriOptions.value.filter((opt) =>
      filters.value.selectedEditori.includes(opt.value),
    );
  },
  set: (arr) => {
    // Gestire il caso in cui arr è null (quando si cancella)
    const valori = arr ? arr.map((o) => o.value) : [];
    filtersStore.updateFilter("selectedEditori", valori);
  },
});

const selectedCollaneObjects = computed({
  get: () => {
    return collaneOptions.value.filter((opt) =>
      filters.value.selectedCollane.includes(opt.value),
    );
  },
  set: (arr) => {
    const valori = arr ? arr.map((o) => o.value) : [];
    filtersStore.updateFilter("selectedCollane", valori);
  },
});

const selectedOrderByObjects = computed({
  get: () => {
    return orderByOptions.filter((opt) =>
      filters.value.orderBy.includes(opt.value),
    );
  },
  set: (arr) => {
    const valori = arr ? arr.map((o) => o.value) : [];
    filtersStore.updateOrderByArray(valori);
  },
});

const selectedLinguaObjects = computed({
  get: () => {
    return lingueOptions.value.filter((opt) =>
      filters.value.lingua.includes(opt.value),
    );
  },
  set: (arr) => {
    const valori = arr ? arr.map((o) => o.value) : [];
    filtersStore.updateLingua(valori);
  },
});

const selectedPossedutoObjects = computed({
  get: () => {
    return possedutoOptions.value.filter((opt) =>
      filters.value.posseduto.includes(opt.value),
    );
  },
  set: (arr) => {
    const valori = arr ? arr.map((o) => o.value) : [];
    filtersStore.updatePossedutoArray(valori);
  },
});

// Carico le opzioni (modelli) al mount
onMounted(() => {
  editoriOptions.value = editoriStore.editori || [];
  collaneOptions.value = collaneStore.collane || [];
  lingueOptions.value = lingueStore.lingue || [];
});
</script>

<style scoped>
/* Nessuno stile custom: Quasar gestisce già tutto */
</style>
