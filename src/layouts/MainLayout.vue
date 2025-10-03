<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title> Maigret Collectors </q-toolbar-title>
        <slot name="toolbar-right" />
        <q-space />
        <q-btn icon="filter_list" flat round dense @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      :overlay="false"
      bordered
      behavior="desktop"
      elevated
    >
      <q-list>
        <q-item clickable to="/home">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.home") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="home" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/configuration" v-if="authStore.loggedIn">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.configurations") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="settings" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/users" v-if="userStore.canManageUsers">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.userManagement") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="people" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/login">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.login") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="login" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/tables" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.tables") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="table_chart" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/newbook" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.newBook") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="note_add" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/trash" v-if="userStore.canManageBooks">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.trash") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="delete" />
          </q-item-section>
        </q-item>
        <q-item clickable to="/profile" v-if="authStore.loggedIn">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.profile") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="person" />
          </q-item-section>
        </q-item>
        <q-item clickable @click="showAboutDialog = true">
          <q-item-section>
            <q-item-label>{{ $t("mainLayout.about") }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="info" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      :overlay="false"
      bordered
      behavior="desktop"
      :width="350"
      elevated
    >
      <div class="q-pa-md">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">{{ $t("filter.title") || "Filtri" }}</div>
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="rightDrawerOpen = false"
          />
        </div>
        <q-separator class="q-mb-md" />

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
      </div>

      <div class="q-pa-md">
        <q-separator class="q-mb-md" />
        <div class="row justify-end q-gutter-sm">
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
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" v-if="$route.meta?.keepAlive" />
        </keep-alive>
        <component :is="Component" v-if="!$route.meta?.keepAlive" />
      </router-view>
    </q-page-container>

    <q-dialog v-model="showAboutDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">About Maigret Collectors</div>
        </q-card-section>
        <q-card-section>
          <p><strong>Version:</strong> {{ version }}</p>
          <p><strong>Build:</strong> {{ versionCode || "N/A" }}</p>
          <p>Contact: support@maigretcollectors.com</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.close') || 'Close'" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, provide, computed, watch } from "vue";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { useFiltersStore } from "stores/filtersStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";
import FilterFields from "components/FilterFields.vue";
import { storeToRefs } from "pinia";
import { nanoid } from "nanoid";

const authStore = useAuthStore();
const userStore = useUserStore();
const filtersStore = useFiltersStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const lingueStore = useLingueStore();

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const showAboutDialog = ref(false);
const filterFieldsKey = ref(nanoid());

// Reactive properties
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

const version = process.env.APP_VERSION || "4.26.0";
const versionCode = process.env.VERSION_CODE || "N/A";

// Riferimenti ai pinia-store
const { editori } = storeToRefs(editoriStore);
const { lingue } = storeToRefs(lingueStore);
const { filters } = storeToRefs(filtersStore);

const editoriOptions = computed(() => editori.value || []);
const lingueOptions = computed(() => lingue.value || []);

const possedutoOptions = [
  { label: "Posseduto", value: "yes" },
  { label: "Non Posseduto", value: "no" },
];
const orderByOptions = [
  { label: "Titolo", value: "titolo" },
  { label: "Collana", value: "collana" },
  { label: "Editore", value: "editore" },
  { label: "Numero Collana", value: "numeroCollana" },
  { label: "Lingua", value: "lingua" },
];

// Collane filtrate dinamicamente in base all'editore selezionato
const filteredCollaneOptions = computed(() => {
  if (!filters.value.selectedEditori.length) {
    return collaneStore.collane || [];
  }
  return (collaneStore.collane || []).filter((c) =>
    filters.value.selectedEditori.includes(c.editore),
  );
});

// Search query
const searchQuery = ref("");

// Editori come select multi
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

// Collane
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

// Ordinamento
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

// Lingua
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

// Posseduto
const selectedPossedutoObjects = computed({
  get: () => {
    return possedutoOptions.filter((opt) =>
      filters.value.posseduto.includes(opt.value),
    );
  },
  set: (arr) => {
    const valori = arr ? arr.map((o) => o.value) : [];
    filtersStore.updatePossedutoArray(valori);
  },
});

// Funzioni filtro
const onSearchInput = (val) => {
  if (val && val.length < 3) {
    filtersStore.updateSearchQuery("");
    return;
  }
  filtersStore.updateSearchQuery(val || "");
};

const resetFilters = () => {
  filtersStore.clearFilters && filtersStore.clearFilters();
  selectedEditoriObjects.value = [];
  selectedCollaneObjects.value = [];
  selectedLinguaObjects.value = [];
  selectedPossedutoObjects.value = [];
  searchQuery.value = "";
  selectedOrderByObjects.value = [];
  filterFieldsKey.value = nanoid();
};

const applyFilters = () => {
  rightDrawerOpen.value = false;
};

function onApply() {
  applyFilters();
  rightDrawerOpen.value = false;
}

watch(searchQuery, (val) => {
  onSearchInput(val);
});

provide("showFilterDrawer", rightDrawerOpen);
</script>

<style scoped>
/* Layout pulito - lascia che Quasar gestisca tutto nativamente */
.q-header {
  /* Padding di default per sicurezza */
  padding-top: env(safe-area-inset-top, 0px);
}

/* Reset completo - rimuovi tutte le personalizzazioni che interferiscono */
.q-header .q-toolbar {
  padding: 0 !important;
  min-height: 56px !important;
}

/* Il drawer viene gestito completamente da JavaScript senza interferenze CSS */
</style>
