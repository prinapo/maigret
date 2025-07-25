<!-- src/pages/Filter.vue -->
<template>
  <div>
    <!-- Drawer/Modal per i filtri su mobile e desktop -->
    <q-drawer
      v-model="showFilterDrawer"
      side="right"
      overlay
      :width="drawerWidth"
      behavior="mobile"
    >
      <q-card flat>
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">
            {{ $t("filter.title") || "Filtra risultati" }}
          </div>
          <q-btn
            icon="arrow_back"
            flat
            round
            dense
            @click="showFilterDrawer = false"
            aria-label="Chiudi filtri"
            :title="$t('filter.close') || 'Chiudi filtri'"
          />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <FilterFields
            :key="filterFieldsKey"
            :editori-options="editoriOptions"
            :collane-options="filteredCollaneOptions"
            :lingue-options="lingueOptions"
            :posseduto-options="possedutoOptions"
            :order-by-options="orderByOptions"
            v-model:modelValueEditore="selectedEditoriObjects"
            v-model:modelValueCollana="selectedCollaneObjects"
            v-model:modelValueLingua="selectedLinguaObjects"
            v-model:modelValuePoss="selectedPossedutoObjects"
            v-model:modelValueSearch="searchQuery"
            v-model:modelValueOrderBy="selectedOrderByObjects"
          />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('filter.reset') || 'Reset'"
            color="negative"
            @click="resetFilters"
          />
          <q-btn
            flat
            :label="$t('filter.apply') || 'Applica'"
            color="primary"
            @click="onApply"
          />
        </q-card-actions>
      </q-card>
    </q-drawer>

    <!-- Nessun filtro fisso su desktop: tutto gestito dal drawer/modal -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar, Platform } from "quasar";
import { storeToRefs } from "pinia";
import { useBackButton } from "src/composables/useBackButton";
import { useFiltersStore } from "stores/filtersStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import FilterFields from "./FilterFields.vue";
import { nanoid } from "nanoid";

const props = defineProps({
  showDrawer: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["update:showDrawer"]);

// Gestione del pulsante "back" per chiudere il drawer
if (Platform.is.capacitor) {
  useBackButton(
    () => {
      if (showFilterDrawer.value) {
        showFilterDrawer.value = false;
      }
    },
    () => showFilterDrawer.value,
  );
}

const $q = useQuasar();
const isMobile = computed(() => $q.screen.lt.md);
const showFilterDrawer = computed({
  get: () => props.showDrawer,
  set: (val) => emit("update:showDrawer", val),
});

// Larghezza dinamica del drawer: 400px desktop, larghezza schermo mobile
const drawerWidth = computed(() => ($q.screen.lt.md ? $q.screen.width : 400));

// Riferimenti ai pinia-store
const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const lingueStore = useLingueStore();

const { editori } = storeToRefs(editoriStore);
const { lingue } = storeToRefs(lingueStore);

const editoriOptions = computed(() => editori.value || []);
const lingueOptions = computed(() => lingue.value || []);

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
watch(searchQuery, (val) => {
  onSearchInput(val);
});

// 2) Editori come select multi: array di oggetti ↔→ array di stringhe
const selectedEditoriObjects = computed({
  get: () => {
    return editoriOptions.value.filter((opt) =>
      filters.value.selectedEditori.includes(opt.value),
    );
  },
  set: (arr) => {
    const valori = arr ? arr.map((o) => o.value) : [];
    filtersStore.updateFilter("selectedEditori", valori);
  },
});

// Collane filtrate dinamicamente in base all'editore selezionato
const filteredCollaneOptions = computed(() => {
  if (!filters.value.selectedEditori.length) {
    return collaneStore.collane || [];
  }
  return (collaneStore.collane || []).filter((c) =>
    filters.value.selectedEditori.includes(c.editore),
  );
});

const selectedCollaneObjects = computed({
  get: () => {
    return filteredCollaneOptions.value.filter((opt) =>
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
    let valori = [];
    if (Array.isArray(arr)) {
      valori = arr.map((o) => o.value);
    } else if (arr && typeof arr === "object" && arr.value) {
      valori = [arr.value];
    }
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

// Pulsanti Applica/Reset (puoi personalizzare la logica)
const filterFieldsKey = ref(nanoid());
const resetFilters = () => {
  filtersStore.clearFilters && filtersStore.clearFilters();
  // Forza il reset dei v-model locali per aggiornare i campi
  selectedEditoriObjects.value = [];
  selectedCollaneObjects.value = [];
  selectedLinguaObjects.value = [];
  selectedPossedutoObjects.value = [];
  searchQuery.value = "";
  selectedOrderByObjects.value = [];
  filterFieldsKey.value = nanoid();
};
const applyFilters = () => {
  // Qui puoi aggiungere logica custom se serve
  showFilterDrawer.value = false;
};

function onApply() {
  applyFilters();
  showFilterDrawer.value = false;
}
</script>

<style scoped>
/* Nessuno stile custom: Quasar gestisce già tutto */
</style>
