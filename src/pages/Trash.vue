<template>
  <q-page padding>
    <q-banner class="q-mb-md bg-grey-3">
      <div class="text-h6">{{ $t("trash.title") }}</div>
      <div class="text-subtitle2">
        Qui trovi le immagini eliminate, puoi ripristinarle o eliminarle
        definitivamente.
      </div>
    </q-banner>

    <q-card v-if="trashEntries.length === 0" class="q-pa-md">
      <q-card-section>Nessuna operazione nel cestino.</q-card-section>
    </q-card>

    <q-list v-else bordered separator>
      <q-item v-for="(entry, index) in trashEntries" :key="entry.id">
        <q-item-section avatar>
          <q-img
            :src="getTrashImageUrl(entry.imageData.name)"
            spinner-color="grey-7"
            style="width: 64px; height: 64px; object-fit: contain"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label
            ><strong>{{ entry.imageData.name }}</strong></q-item-label
          >
          <q-item-label caption>
            Tipo: {{ entry.imageData.coverType }} – Data:
            {{ formatTimestamp(entry.timestamp) }}
          </q-item-label>
          <q-item-label caption>
            Operazione: {{ entry.operationType }}
          </q-item-label>
          <q-item-label caption> Libro: {{ entry.bookId }} </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn
            dense
            flat
            icon="restore"
            color="primary"
            @click="restoreEntry(entry)"
          />
          <q-btn
            dense
            flat
            icon="delete_forever"
            color="negative"
            @click="deleteEntry(entry)"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue"; // Sostituire con:
import { fetchTrashData } from "utils/firebaseDatabaseUtils";
import { fireStoreTrashUrl } from "boot/firebase"; // Solo per URL
import { Notify } from "quasar";
import {
  deleteTrashEntry,
  restoreImageToDatabase,
} from "utils/firebaseDatabaseUtils";
import {
  deleteTrashStorageImage,
  restoreTrashStorageImage,
} from "utils/firebaseStorageUtils";
import placeholderImage from "assets/placeholder.jpg";

const trashEntries = ref([]);

const getTrashImageUrl = (imageName) => {
  if (!imageName) return "";

  if (imageName === "placeholder.jpg") {
    // Usa l'immagine statica locale importata
    return placeholderImage;
  }

  // URL per immagini nella cartella trash
  return `${fireStoreTrashUrl}${encodeURIComponent(imageName)}?alt=media`;
};

const formatTimestamp = (ts) => {
  if (!ts) return "";
  if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
  // Se è un numero (millisecondi)
  if (typeof ts === "number") return new Date(ts).toLocaleString();
  return "";
};

const fetchTrashEntries = async () => {
  try {
    trashEntries.value = await fetchTrashData();
  } catch (error) {
    console.error("Errore caricando il cestino:", error);
    Notify.create({
      message: "Errore caricando il cestino.",
      color: "negative",
    });
  }
};

const restoreEntry = async (entry) => {
  const imageData = entry?.imageData;
  const fileName = imageData?.name;
  const bookId = entry?.bookId;
  const trashId = entry?.id;

  if (!entry || !imageData || !fileName || !bookId || !trashId) {
    Notify.create({
      type: "negative",
      message: "Dati di ripristino mancanti o non validi",
    });
    return;
  }

  try {
    await restoreTrashStorageImage(fileName); // Sposta file
    await restoreImageToDatabase(bookId, imageData); // Aggiunge entry in immagini
    await deleteTrashEntry(trashId); // Rimuove l'entry da trash

    // 🔁 Rimuovi manualmente dalla lista visibile
    trashEntries.value = trashEntries.value.filter((e) => e.id !== trashId);
    Notify.create({
      type: "positive",
      message: "Immagine ripristinata con successo",
    });
  } catch (error) {
    console.error("Errore nel ripristinare l'immagine:", error);
    Notify.create({
      type: "negative",
      message: "Errore durante il ripristino dell'immagine",
    });
  }
};

const deleteEntry = async (entry) => {
  try {
    // 1. Elimina immagine e thumbnail da Firebase Storage
    await deleteTrashStorageImage(entry.imageData.name);

    // 2. Elimina il documento dalla collection Firestore
    await deleteTrashEntry(entry.id);

    // 3. Rimuovi dal frontend
    trashEntries.value = trashEntries.value.filter((e) => e.id !== entry.id);

    Notify.create({
      message: "Elemento eliminato definitivamente.",
      color: "positive",
    });
  } catch (error) {
    console.error("Errore durante eliminazione:", error);
    Notify.create({
      message: "Errore durante eliminazione.",
      color: "negative",
    });
  }
};
onMounted(() => {
  fetchTrashEntries();
});
</script>
