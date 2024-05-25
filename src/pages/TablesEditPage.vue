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
              dense
              unelevated
            />
            <q-space />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="uuid" :props="props">{{ props.row.uuid }}</q-td>
              <q-td key="tipo" :props="props">
                {{ props.row.tipo }}
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
          dense
          unelevated
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
              dense
              unelevated
            />
            <q-space />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="id" :props="props">{{ props.row.id }}</q-td>
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
          dense
          unelevated
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
              dense
              unelevated
            />
            <q-space />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="id" :props="props">{{ props.row.id }}</q-td>
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
          dense
          unelevated
        />
        <q-space />
      </div>
    </q-expansion-item>
  </q-list>
</template>
<script>
import { ref } from "vue";
import {
  useCoversStore,
  useEditoriStore,
  useCollaneStore,
} from "../store/database";
import short from "short-uuid";
const translator = short();
import { db } from "../firebase/firebaseInit";
import { doc, setDoc } from "firebase/firestore";
import {
  updateEditoriTimestamp,
  updateCoversTimestamp,
  updateCollaneTimestamp,
} from "../utils/global";
export default {
  setup() {
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
      },
    ];
    const rows = ref([]);
    const editoriRows = ref([]);
    const collaneRows = ref([]);
    const loading = ref(false);
    const selected = ref([]);
    const showDialog = ref(false); // Define showDialog variable

    const coversStore = useCoversStore(); // Get the covers store instance
    const editoriStore = useEditoriStore(); // Get the Editori store instance
    const collaneStore = useCollaneStore(); // Get the Editori store instance
    const covers = coversStore.covers; // Get the covers data from the store
    const editori = editoriStore.editori; // Get the covers data from the store
    const collane = collaneStore.collane; // Get the covers data from the store

    const editoriData = editori.editore;
    const coversData = covers.cover;
    const collaneData = collane.collana;

    rows.value = coversData;
    editoriRows.value = editoriData;
    collaneRows.value = collaneData;

    console.log("Covers Rows:", rows.value);
    console.log("Editori Rows:", editoriRows.value); // Check if cover data is available
    console.log("Collane Rows:", collaneRows.value);

    const addRow = () => {
      loading.value = true;

      // Generate a short UUID for the new row
      const shortUUID = translator.new();

      // Add a new row with tipo "insert tipo" and a short UUID as uuid
      rows.value.push({
        tipo: "insert tipo",
        uuid: shortUUID,
      });

      loading.value = false;
    };
    const addEditoriRow = () => {
      loading.value = true;

      // Generate a short UUID for the new row
      const shortUUID = translator.new();

      // Add a new row with tipo "insert tipo" and a short UUID as uuid
      editoriRows.value.push({
        editore: "insert editore",
        id: shortUUID,
      });
    };
    const addCollaneRow = () => {
      loading.value = true;

      // Generate a short UUID for the new row
      const shortUUID = translator.new();

      // Add a new row with tipo "insert tipo" and a short UUID as uuid
      collaneRows.value.push({
        collana: "insert collana",
        id: shortUUID,
      });

      loading.value = false;
    };
    const removeRow = (uuidToRemove) => {
      console.log("rows", rows);
      console.log("uuid", uuidToRemove);

      // Find the index of the row with the given UUID
      const indexToRemove = rows.value.findIndex(
        (row) => row.uuid === uuidToRemove,
      );
      console.log("indexToRemove", indexToRemove);
      // If the row with the given UUID is found, remove it from the rows array
      if (indexToRemove !== -1) {
        rows.value.splice(indexToRemove, 1);
      }
      console.log("before the show dialog set to false");
      showDialog.value = false;
      console.log("after the show dialog set to false", showDialog.value);
    };
    const showRemoveDialog = () => {
      showDialog.value = true;
    };
    const cancelRemove = () => {
      showDialog.value = false;
    };
    const removeRowConfirm = () => {
      showDialog.value = false;
    };
    const saveData = async () => {
      // Update data in Pinia store
      coversStore.updateCovers(rows.value);
      try {
        const coversRef = doc(db, "Covers", "default");
        await setDoc(coversRef, { cover: rows.value });
        const timestamp = new Date().valueOf();
        await updateCoversTimestamp(timestamp);
        localStorage.setItem("covers", JSON.stringify(covers));
        console.log("Array saved to Firestore under Covers/default document.");
      } catch (error) {
        console.error("Error saving array to Firestore:", error);
      }
    };
    const saveEditoriData = async () => {
      // Update data in Pinia store
      editoriStore.updateEditori(editoriRows.value);
      try {
        const coversRef = doc(db, "Editori", "default");
        await setDoc(coversRef, { editore: editoriRows.value });
        const timestamp = new Date().valueOf();
        await updateEditoriTimestamp(timestamp);
        localStorage.setItem("editori", JSON.stringify(editori));
        console.log(
          "Array saved to Firestore under Editori /default document.",
        );
      } catch (error) {
        console.error("Error saving array to Firestore:", error);
      }
    };
    const saveCollaneData = async () => {
      // Update data in Pinia store
      collaneStore.updateCollane(collaneRows.value);
      try {
        const coversRef = doc(db, "Collane", "default");
        await setDoc(coversRef, { collana: collaneRows.value });
        const timestamp = new Date().valueOf();
        await updateCollaneTimestamp(timestamp);
        localStorage.setItem("collane", JSON.stringify(collane));
        console.log(
          "Array saved to Firestore under Editori /default document.",
        );
      } catch (error) {
        console.error("Error saving array to Firestore:", error);
      }
    };

    return {
      rows,
      columns,
      editoriRows,
      editoriColumns,
      collaneRows,
      collaneColumns,
      addRow,
      addEditoriRow,
      addCollaneRow,
      loading,
      selected,
      removeRow,
      showRemoveDialog,
      cancelRemove,
      removeRowConfirm,
      showDialog,
      saveData,
      saveEditoriData,
      saveCollaneData,
      confirm: ref(false),
      expandedAll: ref(false),
      expandedCovers: ref(false),
      expandedEditori: ref(false),
      expandedCollane: ref(false),
    };
  },
  methods: {
    toggleGlobalExpansion() {
      this.expandedCovers = this.expandedAll;
      this.expandedEditori = this.expandedAll;
      this.expandedCollane = this.expandedAll;
    },
  },
};
</script>
