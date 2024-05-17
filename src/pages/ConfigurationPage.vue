<template>
  <div class="container">
    <!-- Button to trigger resync -->
    <div class="text-center mt-6">
      <q-btn label="Confirm" color="primary" @click="confirm = true" />
    </div>

    <!-- Popup dialog -->
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="alert" color="primary" text-color="white" />
          <span class="q-ml-sm">Stai per risoncronizzare tutti i dati.</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Risincronizza tutti i dati"
            color="negative"
            @click="resyncData"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Button to trigger upgrade Collane -->
    <div class="text-center mt-6">
      <q-btn
        label="UpgradeCollane"
        color="primary"
        @click="confirmUpgradeCollane = true"
      />
    </div>

    <!-- Popup dialog -->
    <q-dialog v-model="confirmUpgradeCollane" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="alert" color="primary" text-color="white" />
          <span class="q-ml-sm">Stai per aggiornare tutte le collane</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Aggiorna le collane"
            color="negative"
            @click="upgradeCollaneData"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Button to trigger upgrade Editori -->
    <div class="text-center mt-6">
      <q-btn
        label="UpgradeEditori"
        color="primary"
        @click="confirmUpgradeEditori = true"
      />
    </div>
    <!-- Button to trigger upgrade Images -->
    <div class="text-center mt-6">
      <q-btn
        label="UpgradeImages"
        color="primary"
        @click="confirmUpgradeImage = true"
      />
    </div>
    <!-- Button to trigger upgrade covers databse-->
    <div class="text-center mt-6">
      <q-btn
        label="UpgradeCovers"
        color="primary"
        @click="confirmUpgradeCovers = true"
      />
    </div>
    <!-- Popup dialog -->
    <q-dialog v-model="confirmUpgradeCovers" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="alert" color="primary" text-color="white" />
          <span class="q-ml-sm">Stai per aggiornare tutti le covers</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Aggiorna le covers"
            color="negative"
            @click="upgradeCoversData"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirmUpgradeEditori" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="alert" color="primary" text-color="white" />
          <span class="q-ml-sm">Stai per aggiornare tutti gli editori</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Aggiorna gli editori"
            color="negative"
            @click="upgradeEditoriData"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirmUpgradeImage" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="alert" color="primary" text-color="white" />
          <span class="q-ml-sm">Stai per aggiornare tutte le immagini</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Aggiorna le immagini"
            color="negative"
            @click="upgradeImage"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router"; // Import useRouter from vue-router
import { fetchAndUpdateBibliografia } from "../utils/fetchBibliografia";
import { fetchAndUpdateEditori } from "../utils/fetchEditori"; // Import the fetchDataAndUpdateLocalStorage function
import { fetchAndUpdateCollane } from "../utils/fetchCollane";
import { fetchAndUpdateCovers } from "../utils/fetchCovers";
import { storage, fireStoreUrl } from "../firebase/firebaseInit"; // Assuming you have Firebase storage initialized

import { db } from "../firebase/firebaseInit";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import {
  useBibliografiaStore,
  useEditoriStore,
  useCollaneStore,
  useCoversStore,
} from "../store/database";

export default {
  setup() {
    const confirm = ref(false); // Define confirm as a reactive variable
    const router = useRouter();
    const confirmUpgradeCollane = ref(false); // Define cas a reactive variable
    const confirmUpgradeEditori = ref(false); // Define e as a reactive variable
    const confirmUpgradeImage = ref(false);
    const confirmUpgradeCovers = ref(false);

    const resyncData = async () => {
      // Clear local storage

      localStorage.removeItem("bilbliografia");
      localStorage.removeItem("collane");
      localStorage.removeItem("covers");
      localStorage.removeItem("editori");
      localStorage.removeItem("bibliografiaLastUpdate");
      localStorage.removeItem("editoriLastUpdate");
      localStorage.removeItem("collaneLastUpdate");
      localStorage.removeItem("coversLastUpdate");
      localStorage.removeItem("bibliografiaLastUpdate");

      // Clear Pinia storage
      const bibliografiaStore = useBibliografiaStore();
      const collaneStore = useCollaneStore();
      const editoriStore = useEditoriStore();
      const coversStore = useCoversStore();
      editoriStore.clearEditori();
      bibliografiaStore.clearBibliografia();
      collaneStore.clearCollane();
      coversStore.clearCovers();

      // Fetch and update Bibliografia data
      try {
        console.log("Fetching Editori and updating local storage...");
        await fetchAndUpdateEditori();

        console.log("Fetching Collane and updating local storage...");
        await fetchAndUpdateCollane();

        console.log("Fetching Covers and updating local storage...");
        await fetchAndUpdateCovers();

        console.log("Fetching Bibliografia and updating local storage...");
        await fetchAndUpdateBibliografia();
      } catch (error) {
        console.error("Error during data fetching and updating:", error);
      }
      // Redirect to home page
      router.push({ path: "/" });
    };

    const upgradeCollaneData = async () => {
      const bibliografiaStore = useBibliografiaStore();
      const collaneStore = useCollaneStore();
      const bibliografia = bibliografiaStore.bibliografia;
      const collane = collaneStore.collane.collana;
      const unmatchedCollane = []; // Array to store unmatched collane

      if (!bibliografia || !collane) {
        console.error("Bibliografia or Collane data is missing.");
        return;
      }

      // Iterate over the first two books in the bibliografia array
      bibliografia.forEach(async (book, index) => {
        console.log("Processing book", index + 1);

        if (!book) {
          return; // Skip iteration if book is not available
        }

        const collanaName = book.collana;
        const matchingCollana = collane.find(
          (collana) => collana.collana === collanaName,
        );
        const collanaId = matchingCollana ? matchingCollana.id : null;
        console.log("collana name", collanaName);
        console.log("matching collana", matchingCollana);
        console.log("matching id", collanaId);
        if (matchingCollana) {
          try {
            const bibliografiaRef = doc(db, "Bibliografia", book.id);
            await setDoc(
              bibliografiaRef,
              { collana: matchingCollana.id },
              { merge: true },
            );
            console.log(`Collana updated for book ${book.id} in Firestore.`);
          } catch (error) {
            console.error(
              `Error updating collana for book ${book.id} in Firestore:`,
              error,
            );
          }
        } else {
          // If collana is not found, add it to unmatchedCollane array
          unmatchedCollane.push(book.collana);
        }
      });

      bibliografiaStore.updateBibliografia(bibliografia);
      localStorage.setItem("bibliografia", JSON.stringify(bibliografia));
      // Save the updated bibliografia to Firebase Firestore
      console.log("Bibliografia upgraded with collane IDs:", bibliografia);
      console.log("Unmatched collane:", unmatchedCollane);

      console.log("Collane updated for the first two books in Firestore.");
    };
    // funzione per allineare il database copiando nel campo editore il valore di uuid
    const upgradeEditoriData = async () => {
      const bibliografiaStore = useBibliografiaStore();
      const editoriStore = useEditoriStore();
      const bibliografia = bibliografiaStore.bibliografia;
      const editori = editoriStore.editori.editore;
      const unmatchedEditori = []; // Array to store unmatched collane

      if (!bibliografia || !editori) {
        console.error("Bibliografia or Editori data is missing.");
        return;
      }

      // Iterate over the first two books in the bibliografia array
      bibliografia.forEach(async (book, index) => {
        console.log("Processing book", index + 1);

        if (!book) {
          return; // Skip iteration if book is not available
        }

        const editoreName = book.editore;
        const matchingEditore = editori.find(
          (editore) => editore.editore === editoreName,
        );
        const editoreId = matchingEditore ? matchingEditore.id : null;
        console.log("editore name", editoreName);
        console.log("matching editoer", matchingEditore);
        console.log("matching id", editoreId);
        if (matchingEditore) {
          try {
            const bibliografiaRef = doc(db, "Bibliografia", book.id);
            await setDoc(
              bibliografiaRef,
              { editore: matchingEditore.id },
              { merge: true },
            );
            console.log(`Collana updated for book ${book.id} in Firestore.`);
          } catch (error) {
            console.error(
              `Error updating collana for book ${book.id} in Firestore:`,
              error,
            );
          }
        }
      });

      // ora devo allineare le librerie lovalo

      bibliografiaStore.updateBibliografia(bibliografia);
      localStorage.setItem("bibliografia", JSON.stringify(bibliografia));
      // Save the updated bibliografia to Firebase Firestore
      console.log("Bibliografia upgraded with collane IDs:", bibliografia);
    };

    const upgradeCoversData = async () => {
      try {
        // Get a reference to the "default" document in the "Covers" collection
        const coversRef = doc(db, "Covers", "default");
        const coversSnapshot = await getDoc(coversRef);

        if (coversSnapshot.exists()) {
          const coversData = coversSnapshot.data();
          const existingCovers = coversData.cover || []; // Get the existing covers array

          // Create a new array to store the updated cover data
          const updatedCovers = existingCovers.map((cover) => {
            const { tipo, uuid } = cover;
            return {
              label: tipo, // Use the "tipo" property as the label
              value: uuid, // Use the "uuid" property as the value
            };
          });

          // Update the "cover" field in the "default" document with the updatedCovers array
          await updateDoc(coversRef, { cover: updatedCovers });

          console.log("Covers updated successfully!", updatedCovers);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error updating covers:", error);
      }
    };

    const upgradeImage = async () => {
      const bibliografiaStore = useBibliografiaStore();
      const coversStore = useCoversStore();
      const bibliografia = bibliografiaStore.bibliografia;
      const covers = coversStore.covers.cover;

      if (!bibliografia || !covers) {
        console.error("Bibliografia or Covers data is missing.");
        return;
      }

      for (let index = 0; index < bibliografia.length; index++) {
        // faccio prove con meno righe
        //for (let index = 0; index < 3; index++) {
        const book = bibliografia[index];
        console.log("Processing book", index + 1);

        if (!book) {
          continue; // Skip iteration if book is not available
        }

        const bookId = book.id;

        const imageExists = await checkFileExists(bookId + ".jpg");
        const backImageExists = await checkFileExists(bookId + "Bck.jpg");
        const boardImageExists = await checkFileExists(bookId + "Brd.jpg");

        // Perform actions based on the existence of the files

        if (backImageExists) {
          console.log("back image exists");
          const filename = bookId + "bck.jpg";
          if (
            book.images &&
            book.images.some((image) => image.name === filename)
          ) {
            console.log(`${filename} already exists in book.images.`);
          } else {
            book.images.push({ name: filename, id: "ppMZiW1Yy3EV5xkw6x1Mti" });
            console.log("update book.images", book.images);
          }
          // Case 2: bookId+bck.jpg exists
          // Perform action 2
        }
        if (boardImageExists) {
          console.log("board image exists");
          const filename = bookId + "brd.jpg";
          if (
            book.images &&
            book.images.some((image) => image.name === filename)
          ) {
            console.log(`${filename} already exists in book.images.`);
          } else {
            book.images.push({ name: filename, id: "hAvDZKHe436U4op9zut45E" });
            console.log("update book.images", book.images);
          }
          // Case 3: bookId+brd.jpg exists
          // Perform action 3
        }
        // ho book.images completo o vuoto

        try {
          const bibliografiaRef = doc(db, "Bibliografia", bookId);
          await setDoc(
            bibliografiaRef,
            { images: book.images },
            { merge: true },
          );
          console.log(`Images updated for book ${bookId} in Firestore.`);
        } catch (error) {
          console.error(
            `Error updating collana for book ${bookId} in Firestore:`,
            error,
          );
        }
      }
    };

    const checkFileExists = async (fileName) => {
      try {
        // Reference to the file
        const response = await fetch(
          fireStoreUrl + encodeURIComponent(fileName),
        );
        return response.ok; // Returns true if the file exists, false otherwise
      } catch (error) {
        console.error("Error checking file existence:", error);
        return false;
      }
    };

    return {
      confirm,
      confirmUpgradeCollane,
      confirmUpgradeEditori,
      confirmUpgradeImage,
      confirmUpgradeCovers,
      resyncData,
      upgradeCollaneData,
      upgradeEditoriData,
      upgradeImage,
      upgradeCoversData,
    };
  },
};
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
