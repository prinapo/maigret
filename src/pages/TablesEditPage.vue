<template>
  <q-toggle
    v-model="expandedAll"
    label="Expand all"
    class="q-mb-md"
    @click="toggleGlobalExpansion"
  />

  <q-list>
    <q-expansion-item
      v-model="expandedCovers"
      icon="auto_stories"
      label="Tipi di copertina"
      caption="Copertina, quarta di copertina etc.."
    >
      <div class="q-pa-md" id="Covers">
        <q-table
          flat
          bordered
          title="Tipi di imaggine di copertina"
          :rows="rows"
          :columns="columns"
          row-key="uuid"
          binary-state-sort
          :rows-per-page-options="[0]"
        >
          <template v-slot:top>
            <q-btn
              color="primary"
              :disable="loading"
              label="Add row"
              @click="addRow"
              unelevated
              v-if="isAdmin"
              style="min-height: 48dp"
            />
            <q-space />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="uuid" :props="props" v-if="isAdmin">{{
                props.row.value
              }}</q-td>
              <q-td key="tipo" :props="props">
                {{ props.row.label }}
                <q-popup-edit
                  v-model="props.row.tipo"
                  title="aggiorna il tipo"
                  buttons
                  v-slot="scope"
                >
                  <q-input
                    v-model="scope.value"
                    dense
                    autofocus
                    counter
                    @keyup.enter="scope.set"
                    style="min-height: 48dp"
                  />
                </q-popup-edit>
              </q-td>
            </q-tr>
          </template>
        </q-table>

        <!-- Confirmation dialog -->
        <q-btn
          color="secondary"
          :disable="loading"
          label="Save Copertine"
          @click="saveData"
          unelevated
          v-if="isAdmin"
          style="min-height: 48dp"
        />
        <q-space />
      </div>
    </q-expansion-item>
    <q-expansion-item
      v-model="expandedEditori"
      icon="business"
      label="Lista Editori"
      caption="Adlephi, Mondadori, etc.."
    >
      <div class="q-pa-md" id="Editori">
        <q-table
          flat
          bordered
          title="Editori"
          :rows="editoriRows"
          :columns="editoriColumns"
          row-key="id"
          binary-state-sort
          :rows-per-page-options="[0]"
        >
          <template v-slot:top>
            <q-btn
              color="primary"
              :disable="loading"
              label="Add row"
              @click="addEditoriRow"
              unelevated
              v-if="isAdmin"
              style="min-height: 48dp"
            />
            <q-space />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="id" :props="props" v-if="isAdmin">{{
                props.row.id
              }}</q-td>
              <q-td key="editore" :props="props">
                {{ props.row.editore }}
                <q-popup-edit
                  v-model="props.row.editore"
                  title="aggiorna l'editore"
                  buttons
                  v-slot="scope"
                  dense
                  unelevated
                >
                  <q-input
                    v-model="scope.value"
                    dense
                    autofocus
                    counter
                    @keyup.enter="scope.set"
                    style="min-height: 48dp"
                  />
                </q-popup-edit>
              </q-td>
            </q-tr>
          </template>
        </q-table>

        <!-- Confirmation dialog -->
        <q-btn
          color="secondary"
          :disable="loading"
          label="Save Editori"
          @click="saveEditoriData"
          unelevated
          style="min-height: 48dp"
          v-if="isAdmin"
        />
        <q-space />
      </div>
    </q-expansion-item>
    <q-expansion-item
      v-model="expandedCollane"
      icon="library_books"
      label="Collane"
      caption="I Maigret, etc.."
    >
      <div class="q-pa-md" id="Collane">
        <q-table
          flat
          bordered
          title="collane"
          :rows="collaneRows"
          :columns="collaneColumns"
          row-key="id"
          binary-state-sort
          :rows-per-page-options="[0]"
        >
          <template v-slot:top>
            <q-btn
              color="primary"
              :disable="loading"
              label="Add row"
              @click="addCollaneRow"
              unelevated
              style="min-height: 48dp"
              v-if="isAdmin"
            />
            <q-space />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="id" :props="props" v-if="isAdmin">{{
                props.row.id
              }}</q-td>
              <q-td key="collana" :props="props">
                {{ props.row.collana }}
                <q-popup-edit
                  v-model="props.row.collana"
                  title="aggiorna la collana"
                  buttons
                  v-slot="scope"
                  dense
                  unelevated
                >
                  <q-input
                    v-model="scope.value"
                    dense
                    autofocus
                    counter
                    @keyup.enter="scope.set"
                    style="min-height: 48dp"
                  />
                </q-popup-edit>
              </q-td>
            </q-tr>
          </template>
        </q-table>
        <!-- Confirmation dialog -->
        <q-btn
          color="secondary"
          :disable="loading"
          label="Save Collane"
          @click="saveCollaneData"
          unelevated
          style="min-height: 48dp"
          v-if="isAdmin"
        />
        <q-space />
      </div>
    </q-expansion-item>
  </q-list>
</template>
<script setup>
import { ref, computed } from "vue";
import short from "short-uuid";
import { doc, setDoc } from "firebase/firestore";
import {
  useCoversStore,
  useEditoriStore,
  useCollaneStore,
} from "../store/database";
import { db } from "../firebase/firebaseInit";
import { useAuth } from "../composable/auth";
import {
  updateEditoriTimestamp,
  updateCoversTimestamp,
  updateCollaneTimestamp,
} from "../utils/global";

// UUID generator
const translator = short();

// Auth state
const { isLoggedIn, userId, isAdmin, isCollector, checkAuthState } = useAuth();
checkAuthState();

// Data properties
const titolo = ref("");
const rows = ref([]);
const editoriRows = ref([]);
const collaneRows = ref([]);
const loading = ref(false);
const selected = ref([]);
const showDialog = ref(false);

// Table columns
const columns = [
  {
    name: "uuid",
    required: true,
    label: "Reference ID",
    align: "left",
    field: (row) => row.uuid,
  },
  {
    name: "tipo",
    required: true,
    label: "Tipo di immagine",
    align: "left",
    field: (row) => row.tipo,
    sortable: true,
  },
];

const editoriColumns = [
  {
    name: "id",
    required: true,
    label: "Reference ID",
    align: "left",
    field: (row) => row.id,
  },
  {
    name: "editore",
    required: true,
    label: "Editore",
    align: "left",
    field: (row) => row.editore,
    sortable: true,
  },
];

const collaneColumns = [
  {
    name: "id",
    required: true,
    label: "Reference ID",
    align: "left",
    field: (row) => row.id,
  },
  {
    name: "collana",
    required: true,
    label: "Collane",
    align: "left",
    field: (row) => row.collana,
    sortable: true,
  },
];

// Stores
const coversStore = useCoversStore();
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const covers = computed(() => coversStore.covers);
const editori = computed(() => editoriStore.editori);
const collane = computed(() => collaneStore.collane);

rows.value = covers.value.cover;
editoriRows.value = editori.value.editore;
collaneRows.value = collane.value.collana;

// Functions
const addRow = () => {
  loading.value = true;
  const shortUUID = translator.new();
  rows.value.push({ tipo: "insert tipo", uuid: shortUUID });
  loading.value = false;
};

const addEditoriRow = () => {
  loading.value = true;
  const shortUUID = translator.new();
  editoriRows.value.push({ editore: "insert editore", id: shortUUID });
  loading.value = false;
};

const addCollaneRow = () => {
  loading.value = true;
  const shortUUID = translator.new();
  collaneRows.value.push({ collana: "insert collana", id: shortUUID });
  loading.value = false;
};

const saveData = async () => {
  coversStore.updateCovers(rows.value);
  try {
    const coversRef = doc(db, "Covers", "default");
    await setDoc(coversRef, { cover: rows.value });
    const timestamp = new Date().valueOf();
    await updateCoversTimestamp(timestamp);
    localStorage.setItem("covers", JSON.stringify(covers.value));
  } catch (error) {
    console.error("Error saving array to Firestore:", error);
  }
};

const saveEditoriData = async () => {
  editoriStore.updateEditori(editoriRows.value);
  try {
    const editoriRef = doc(db, "Editori", "default");
    await setDoc(editoriRef, { editore: editoriRows.value });
    const timestamp = new Date().valueOf();
    await updateEditoriTimestamp(timestamp);
    localStorage.setItem("editori", JSON.stringify(editori.value));
  } catch (error) {
    console.error("Error saving array to Firestore:", error);
  }
};

const saveCollaneData = async () => {
  collaneStore.updateCollane(collaneRows.value);
  try {
    const collaneRef = doc(db, "Collane", "default");
    await setDoc(collaneRef, { collana: collaneRows.value });
    const timestamp = new Date().valueOf();
    await updateCollaneTimestamp(timestamp);
    localStorage.setItem("collane", JSON.stringify(collane.value));
  } catch (error) {
    console.error("Error saving array to Firestore:", error);
  }
};

const confirm = ref(false);
const expandedAll = ref(false);
const expandedCovers = ref(false);
const expandedEditori = ref(false);
const expandedCollane = ref(false);

const toggleGlobalExpansion = () => {
  expandedCovers.value = expandedAll.value;
  expandedEditori.value = expandedAll.value;
  expandedCollane.value = expandedAll.value;
};
</script>
