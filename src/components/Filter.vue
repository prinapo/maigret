<template>
  <q-card class="bg-white">
    <q-list padding>
      <!-- First Row: Text Input and Selects -->
      <div class="row">
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-input
                v-model="searchQuery"
                outlined
                label="Titolo"
                dense
                @update:model-value="updateSearchQuery"
                clearable
                prepend-icon="search"
                class="q-mb-md"
              />
            </q-item-section>
          </q-item>
        </div>
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedEditore"
                outlined
                label="Editore"
                dense
                :options="editori"
                @update:model-value="handleEditoreChange"
                clearable
                option-value="id"
                option-label="editore"
                class="q-mb-md"
                prepend-icon="business"
              />
            </q-item-section>
          </q-item>
        </div>
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedCollana"
                outlined
                label="Collana"
                :options="collane"
                @update:model-value="handleCollanaChange"
                clearable
                option-value="id"
                option-label="collana"
                class="q-mb-md"
                dense
              />
            </q-item-section>
          </q-item>
        </div>
        <div class="col-6 col-sm-3">
          <q-item>
            <q-item-section>
              <q-select
                v-model="orderBy"
                outlined
                label="Ordina per"
                dense
                :options="order"
                option-value="value"
                option-label="label"
                @update:model-value="handleOrderByChange"
                clearable
                class="q-mb-md"
                prepend-icon="sort"
              />
            </q-item-section>
          </q-item>
        </div>
      </div>

      <!-- Second Row: Checkboxes -->
      <div class="row">
        <div class="col-6 col-sm-3">
          <q-item clickable @click="handleFranceseChange(!showFranceseBooks)">
            <q-item-section>
              <q-item-label>
                <q-checkbox
                  v-model="showFranceseBooks"
                  label="Francese"
                  class="q-mb-md"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
        <div class="col-6 col-sm-3">
          <q-item clickable @click="handleItalianoChange(!italiano)">
            <q-item-section>
              <q-item-label>
                <q-checkbox
                  v-model="italiano"
                  label="Italiano"
                  class="q-mb-md"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
        <div class="col-6 col-sm-3">
          <q-item clickable @click="handlePossedutoChange(!posseduto)">
            <q-item-section>
              <q-item-label>
                <q-checkbox
                  v-model="posseduto"
                  label="Posseduto"
                  class="q-mb-md"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
        <div class="col-6 col-sm-3">
          <q-item clickable @click="handleNonPossedutoChange(!nonPosseduto)">
            <q-item-section>
              <q-item-label>
                <q-checkbox
                  v-model="nonPosseduto"
                  label="Non Posseduto"
                  class="q-mb-md"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
      </div>
    </q-list>
  </q-card>
</template>
<script setup>
import { useFiltersStore } from "../store/filtersStore";
import { useEditoriStore } from "../store/database";
import { useCollaneStore } from "../store/database";
import { ref, computed } from "vue";

const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const filtersStore = useFiltersStore();

const searchQuery = computed({
  get: () => filtersStore.searchQuery,
  set: (value) => filtersStore.updateSearchQuery(value),
});

const selectedEditore = computed({
  get: () => filtersStore.selectedEditore,
  set: (value) => filtersStore.updateSelectedEditore(value),
});

const selectedCollana = computed({
  get: () => filtersStore.selectedCollana,
  set: (value) => filtersStore.updateSelectedCollana(value),
});

const showFranceseBooks = computed({
  get: () => filtersStore.francese,
  set: (value) => filtersStore.toggleFrancese(value),
});

const orderBy = computed({
  get: () => filtersStore.orderBy,
  set: (value) => filtersStore.updateOrderBy(value),
});

const italiano = computed({
  get: () => filtersStore.italiano,
  set: (value) => filtersStore.toggleItaliano(value),
});

const francese = computed({
  get: () => filtersStore.francese,
  set: (value) => filtersStore.toggleFrancese(value),
});

const posseduto = computed({
  get: () => filtersStore.posseduto,
  set: (value) => filtersStore.togglePosseduto(value),
});

const nonPosseduto = computed({
  get: () => filtersStore.nonPosseduto,
  set: (value) => filtersStore.toggleNonPosseduto(value),
});
const order = [
  { label: "Titolo", value: "titolo" },
  { label: "Collana", value: "collanaName" },
  { label: "Editore", value: "editoreName" },
  { label: "Number", value: "numeroCollana" },
];

const editoriList = computed(() => editoriStore.editori);
const collaneList = computed(() => collaneStore.collane);

const editori = editoriStore.editori;
const collane = collaneStore.collane;

const handleEditoreChange = (value) => {
  filtersStore.updateSelectedEditore(value);
};

const handleCollanaChange = (value) => {
  filtersStore.updateSelectedCollana(value);
};
const handleOrderByChange = (value) => {
  filtersStore.updateOrderBy(value);
};

const handleFranceseChange = (value) => {
  filtersStore.toggleFrancese(value);
};
const handleItalianoChange = (value) => {
  filtersStore.toggleItaliano(value);
};
const handlePossedutoChange = (value) => {
  filtersStore.togglePosseduto(value);
};
const handleNonPossedutoChange = (value) => {
  filtersStore.toggleNonPosseduto(value);
};

const updateSearchQuery = (value) => {
  filtersStore.updateSearchQuery(value);
};
</script>
<style scoped></style>
