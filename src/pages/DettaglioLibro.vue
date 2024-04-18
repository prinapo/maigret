<template>
  <div class="bg-primary" id="book details">
    <div class="row">
      <div class="col-md-4 col-lg-4 col-xs-12 col-sm-12">
        <div class="q-pa-md text-center text-white text-weight-bolder text-h4">
          copertine
        </div>
        <div class="bg-primary">
          <div class="bg-primaryy">
            <q-carousel
              animated
              v-model="slide"
              arrows
              navigation
              height="100%"
              class="bg-dark"
            >
              <!-- Front -->
              <q-carousel-slide :name="1" style="max-width: 600px">
                <div>
                  <div class="text-h4 text-grey-11">Copertina</div>
                </div>
                <q-img
                  v-if="book.signedUrl"
                  :src="`${fireStoreUrl}${book.signedUrl}`"
                  style="cursor: pointer"
                />
                <!-- Use placeholder URL if signedUrl is empty -->
                <q-img v-else :src="bookImage" style="cursor: pointer" />
              </q-carousel-slide>

              <!-- Back -->
              <q-carousel-slide :name="2" style="max-width: 600px">
                <div>
                  <div class="text-h4 text-grey-11">Retro di copertina</div>
                </div>
                <q-img
                  v-if="book.signedUrlBck"
                  :src="`${fireStoreUrl}${book.signedUrlBck}`"
                  style="cursor: pointer"
                />
                <!-- Use placeholder URL if signedUrlBck is empty -->
                <q-img v-else :src="bookImage" style="cursor: pointer" />
              </q-carousel-slide>
              <q-carousel-slide :name="3" style="max-width: 600px">
                <div>
                  <div class="text-h4 text-grey-11">Costa</div>
                </div>
                <q-img
                  v-if="book.signedUrlBrd"
                  :src="`${book.signedUrlBrd}`"
                  style="cursor: pointer"
                />
                <!-- Use placeholder URL if signedUrlBck is empty -->
                <q-img v-else :src="bookImage" style="cursor: pointer" />
              </q-carousel-slide>
            </q-carousel>
            <q-expansion-item v-if="isLoggedIn">
              <FirebaseUploader
                :blocking="true"
                extention=""
                directory="images"
                :bookId="route.params.id"
                @uploaded="handleFileUploaded('', $event)"
                :fileInputRef="fileInputRef"
                label="Front Cover upload"
                color="purple"
                square
                flat
                bordered
                style="max-width: 300px"
              />
              <FirebaseUploader
                :blocking="true"
                directory="images"
                extention="Bck"
                :bookId="route.params.id"
                @uploaded="handleFileUploaded('Bck', $event)"
                :fileInputRef="fileInputRef"
                label="Back Cover upload"
                color="red"
                square
                flat
                bordered
                style="max-width: 300px"
              />
              <FirebaseUploader
                :blocking="true"
                directory="images"
                extention="Brd"
                :bookId="route.params.id"
                @uploaded="handleFileUploaded('Brd', $event)"
                :fileInputRef="fileInputRef"
                label="Border Upload"
                color="bkue"
                square
                flat
                bordered
                style="max-width: 300px"
              />
            </q-expansion-item>
          </div>
        </div>
      </div>
      <div class="col-md-8 col-lg-8 col-xs-12 col-sm-12 q-px-md q-pt-sm">
        <div class="text-h4 text-center text-white q-py-xs q-my-xs">
          dettagli
        </div>
        <div>
          <q-card-section id="text" class="overflow: auto">
            <!-- book detail list -->
            <q-list>
              <q-item v-for="(detail, index) in bookDetails" :key="index">
                <q-item-section top v-if="detail.id !== 'editore'">
                  <q-input
                    outlined
                    v-model="detail.value"
                    :label="detail.label"
                    :readonly="!isLoggedIn"
                    class="text-h6 text-grey-11"
                    dark
                    color="accent"
                  />
                </q-item-section>

                <q-item-section top v-else>
                  <q-select
                    color="accent"
                    outlined
                    v-model="detail.value"
                    :options="editori"
                    :label="detail.label"
                    @change="detail.value = selectedEditore"
                    dark=""
                    :readonly="!isLoggedIn"
                  />
                </q-item-section>
                <q-item-section top side v-if="isLoggedIn">
                  <div>
                    <q-btn
                      size="12px"
                      flat
                      dense
                      round
                      icon="save"
                      @click="saveDetail(detail)"
                      color="secondary"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </div>
        <div>
          <div>Edizioni</div>

          <div class="q-gutter-md row items-start justify-start">
            <q-card
              v-for="(edizione, index) in edizioni"
              :key="index"
              class="q-mb-md"
              style="max-width: 200px"
            >
              <q-card-section class="overflow-auto">
                <div class="row q-gutter-md items-center">
                  <div class="col">
                    <q-input
                      outlined
                      v-model="edizione.numero"
                      label="Edizione"
                      color="accent"
                      style="max-width: 100px"
                    />
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      icon="save"
                      color="blue-4"
                      @click="
                        saveEdizioneDetail(
                          'numero',
                          index,
                          edizione.numero,
                          index,
                        )
                      "
                    />
                  </div>
                </div>

                <div class="row q-gutter-md items-center">
                  <div class="col">
                    <q-input
                      outlined
                      v-model.number="edizione.anno"
                      label="Anno"
                      color="accent"
                      class="col"
                      type="number"
                      style="max-width: 100px"
                    />
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      icon="save"
                      color="blue-4"
                      @click="saveEdizioneDetail('anno', index, edizione.anno)"
                    />
                  </div>
                </div>

                <div class="row q-gutter-md items-center">
                  <div class="col">
                    <q-toggle
                      v-model="edizione.posseduto"
                      label="Posseduto"
                      color="green"
                      @update:model-value="
                        savePossessoEdizione(edizione.uuid, edizione.posseduto)
                      "
                    />
                  </div>
                </div>
              </q-card-section>
              <q-card-section class="row items-center q-gutter-md justify-end">
                <div>
                  <q-btn
                    fab
                    icon="add"
                    color="purple-4"
                    @click="confirmAddEdizione = true"
                  />
                  <q-dialog v-model="confirmAddEdizione" persistent>
                    <q-card>
                      <q-card-section class="q-pa-md">
                        <p>Sei sicuro di voler aggiungere una edizione?</p>
                      </q-card-section>

                      <q-card-actions align="right">
                        <q-btn
                          flat
                          label="Annulla"
                          color="primary"
                          @click="confirmAddEdizione = false"
                        />
                        <q-btn
                          flat
                          label="Conferma"
                          color="negative"
                          @click="addEdizione"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                </div>
                <div>
                  <q-btn
                    fab
                    icon="delete"
                    color="purple-4"
                    @click="confirmRemoveEdizione = true"
                  />
                  <q-dialog v-model="confirmRemoveEdizione" persistent>
                    <q-card>
                      <q-card-section class="q-pa-md">
                        <p>Sei sicuro di voler rimuovere questa edizione?</p>
                      </q-card-section>

                      <q-card-actions align="right">
                        <q-btn
                          flat
                          label="Annulla"
                          color="primary"
                          @click="confirmRemoveEdizione = false"
                        />
                        <q-btn
                          flat
                          label="Conferma"
                          color="negative"
                          @click="removeEdizione(index)"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="isLoggedIn">
          <q-btn
            label="Elimina il libro"
            color="negative"
            @click="confirmDeleteBook = true"
          />

          <q-dialog v-model="confirmDeleteBook" persistent>
            <q-card>
              <q-card-section class="q-pa-md">
                <p>Sei sicuro di voler eliminare questo libro?</p>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  flat
                  label="Annulla"
                  color="primary"
                  @click="confirmDeleteBook = false"
                />
                <q-btn
                  flat
                  label="Conferma"
                  color="negative"
                  @click="deleteBook"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
onMounted(() => {
  fetchBookDetails();
  checkAuthState();

  editori = editoriStore.editori;
  console.log("user id", userID);
  console.log("is logged in", isLoggedIn);
});

let editori = [];

import { ref, onMounted } from "vue";
import { db } from "../firebase/firebaseInit";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRoute, useRouter } from "vue-router";
import { fireStoreUrl } from "../firebase/firebaseInit"; // Import fireStoreUrl from firebaseInit
import { useEditoriStore, useBibliografiaStore } from "src/store/database";
import { useQuasar } from "quasar";
import { updateTimestamp } from "../utils/global";
import { useAuth } from "../composable/auth";
import bookImage from "../assets/400x600.png"; // Import the book image from assets directory
const selectedEditore = ref("");
const editoriStore = useEditoriStore();
const quasar = useQuasar();
const router = useRouter();
const { userID, isLoggedIn, checkAuthState } = useAuth();
// Call checkAuthState to ensure isLoggedIn is up-to-date
checkAuthState();
// Define book and placeholder URL
const book = ref({});

const slide = ref(1); // Initialize slide reference
const fileInputRef = ref(null);
const imageVersion = ref(0);
// Access route parameters
const route = useRoute();
const updatesBibliografiaTimesRef = doc(db, "Updates", "bibliografiaTimes");
const confirmAddEdizione = ref(false);
const confirmRemoveEdizione = ref(false);
const confirmDeleteBook = ref(false);

const bookDetails = ref([]);
const edizioni = ref([]);
// dichiaro la variabile che fa riferimento al libro in modifica globalmente per usarla in piu funzioni
const docRef = doc(db, "Bibliografia", route.params.id);

const deleteBook = async () => {
  try {
    const bookId = router.currentRoute.value.params.id;
    const bibliografiaRef = doc(db, "Bibliografia", bookId);
    const bibliografiaData = (await getDoc(bibliografiaRef)).data();

    // Move the book to BibliografiaTrash
    await setDoc(doc(db, "BibliografiaTrash", bookId), bibliografiaData);

    // Delete the book from Bibliografia collection
    await deleteDoc(bibliografiaRef);

    // Remove the book from local storage if exists
    const localBibliografiaData = localStorage.getItem("bibliografiaData");
    if (localBibliografiaData) {
      const updatedBibliografiaData = JSON.parse(localBibliografiaData).filter(
        (item) => item.id !== bookId,
      );
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(updatedBibliografiaData),
      );
    }

    // Remove the book from Pinia store if exists
    const bibliografiaStore = useBibliografiaStore();
    bibliografiaStore.removeBook(bookId); // Assuming a method like removeBook exists in your Pinia store

    console.log("Book moved to BibliografiaTrash successfully!");

    // Close the confirmation dialog
    confirm.value = false;

    router.push({ path: "/" });
  } catch (error) {
    console.error("Error moving book to BibliografiaTrash:", error);
  }
};

// Fetch book details based on ID
const fetchBookDetails = async () => {
  try {
    const docRef = doc(db, "Bibliografia", route.params.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      book.value = {
        id: docSnap.id,
        ...docSnap.data(),
      };
      // Populate bookDetails
      const edizioniData = docSnap.data().edizioni;
      console.log("edizioniData", edizioniData);
      bookDetails.value = [
        { id: "editore", label: "Editore", value: book.value.editore },
        { id: "titolo", label: "Titolo", value: book.value.titolo },
        { id: "collana", label: "Collana", value: book.value.collana },
        {
          id: "numeroCollana",
          label: "Numeor Collana",
          value: book.value.numeroCollana,
        },
        { id: "lingua", label: "Lingua", value: book.value.lingua },
        { id: "posseduto", label: "Posseduto", value: book.value.posseduto },

        {
          id: "annoPubblicazione",
          label: "Publicato",
          value: book.value.annoPubblicazione,
        },
        {
          id: "titoloOriginale",
          label: "Titolo Orginale",
          value: book.value.titoloOriginale,
        },
        // { id: "timestamp", label: "Timestamp", value: book.value.timestamp },
      ];
      if (!edizioniData || edizioniData.length === 0) {
        await addEdizione();
      } else {
        edizioni.value = edizioniData;
        console.log("edizioni value already exist", edizioni.value);
        // Populate edizioni array
      }
    } else {
      router.push({ name: "ErrorPage" }); // Redirect to the error route if document does not exist

      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error fetching book details:", error);
  }
};

const handleFileUploaded = async (extension, files) => {
  // Process each uploaded file

  for (const file of files) {
    // Access file details and extension
    const fileName = file.originalFile.name;
    const fileExtension = file.fileExtension;

    // Construct the file URL based on the provided parameters
    const detailId = `signedUrl${extension}`; // ID including the extension
    const fileURL = `${route.params.id}${extension}.${fileExtension}?alt=media`;

    // Call saveDetail function to save the file details
    const detail = {
      id: detailId,
      value: fileURL,
    };
    await saveDetail(detail);

    // Update bookDetails with the new URL
    const updatedDetailIndex = bookDetails.value.findIndex(
      (detail) => detail.id === detailId,
    );
    if (updatedDetailIndex !== -1) {
      bookDetails.value[updatedDetailIndex].value = fileURL;

      // Update data in local storage if it exists
      const localBibliografiaData = localStorage.getItem("bibliografiaData");
      if (localBibliografiaData) {
        const bibliografiaData = JSON.parse(localBibliografiaData);
        const index = bibliografiaData.findIndex(
          (item) => item.id === route.params.id,
        );
        if (index !== -1) {
          bibliografiaData[index][detailId] = fileURL;
          localStorage.setItem(
            "bibliografiaData",
            JSON.stringify(bibliografiaData),
          );
        }
      }

      // Update data in Pinia store if it exists
      const bibliografiaStore = useBibliografiaStore(); // Assuming this is how you access Pinia store
      const bibliografia = bibliografiaStore.bibliografia;
      const index = bibliografia.findIndex(
        (item) => item.id === route.params.id,
      );
      if (index !== -1) {
        bibliografia[index][detailId] = fileURL;
        bibliografiaStore.updateBibliografia(bibliografia);
      }
    } else {
      console.error("Detail 'signedUrl' not found in bookDetails.");
    }
  }
};

const toggleEdit = (detail) => {
  // Toggle the editable property of the detail object
  detail.editable = !detail.editable;
};
// Define book details

// Define method to handle edit action for a detail
const editDetail = (detail) => {
  // Handle edit action for the specific detail
  console.log("Edit detail:", detail);
};

const saveDetail = async (detail) => {
  // creo il nuovo timestamp
  const timestamp = new Date().valueOf();
  try {
    //creo il ref al libro corrente le info del signolo libro
    const docRef = doc(db, "Bibliografia", route.params.id);

    // Uso "setDoc per fare un merge tra i dati che carico e i dati presenti nele documento online
    await setDoc(
      docRef,
      {
        [detail.id]: detail.value,
      },
      { merge: true },
    );
    // aggiorno il timestamp nel libro corrente
    await setDoc(
      docRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );

    detail.editable = false; // Set editable to false after saving
    console.log("Detail saved successfully!");

    // chiamo la funxione per aggiornare il timestamp localmente
    // Update timestamp
    await updateTimestamp(timestamp);
  } catch (error) {
    console.error("Error saving detail:", error);
    quasar.notify({
      message: `Error saving detail "${detail.id}": ${error.message}`,
      color: "negative",
    });
  }
};
// Fetch book details on component mount
const saveEdizioneDetail = async (name, index, value) => {
  try {
    const timestamp = new Date().valueOf();
    const docRef = doc(db, "Bibliografia", route.params.id);

    // Check if the index is valid
    const edizioniSnapshot = await getDoc(docRef);
    const edizioniData = edizioniSnapshot.data();
    const existingEdizioni = edizioniData.edizioni || [];

    // Create a new array with the updated value
    const updatedEdizioni = existingEdizioni.map((item, i) => {
      if (i === index) {
        // If it's the target index, update the specified field
        return {
          ...item,
          [name]: value,
        };
      } else {
        // Otherwise, return the item as is
        return item;
      }
    });

    // Update the specified item in the 'edizioni' array
    await updateDoc(docRef, { edizioni: updatedEdizioni });

    // Update the timestamp in the parent document
    await setDoc(
      docRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );

    console.log(`Detail "${name}" at index ${index} saved successfully!`);

    // Call the function to update the timestamp locally
    await updateTimestamp(timestamp);
  } catch (error) {
    console.error("Error saving edizione detail:", error);
    quasar.notify({
      message: `Error saving edizione detail: ${error.message}`,
      color: "negative",
    });
  }
};

const savePossessoEdizione = async (edizione, value) => {
  console.log("userID:", userID);
  console.log("isloggedin", isLoggedIn);
  console.log("edizione:", edizione);
  try {
    // Access the actual value of userID
    const userIdValue = userID.value;

    // Create the Firestore document reference using the user ID
    const docRef = doc(db, "Users", userIdValue);
    const updatedFields = {
      [edizione]: value, // Dynamically set the field name and its value
    };
    await updateDoc(docRef, updatedFields);

    console.log(`Updated Firebase field ${edizione} with value:`, value);
  } catch (error) {
    console.error("Error saving possession edition:", error);
  }
};

// Function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Function to add a new edizione
const addEdizione = async () => {
  try {
    const docRef = doc(db, "Bibliografia", route.params.id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      let existingEdizioni = docSnap.data().edizioni || [];

      console.log("edizioni", edizioni.value);
      const defaultEdizione = {
        anno: 1900,
        backCoverUrl: "dummy",
        borderCoverUrl: "dummy",
        frontCoverUrl: "dummy",
        numero: 1,
        posseduto: false,
        uuid: generateUUID(),
      };
      // Convert existingEdizioni to an array if it's an object
      if (
        typeof existingEdizioni === "object" &&
        !Array.isArray(existingEdizioni)
      ) {
        existingEdizioni = Object.values(existingEdizioni);
      }

      // Ensure existingEdizioni is an array
      if (!Array.isArray(existingEdizioni)) {
        existingEdizioni = [];
      }
      // Update edizioni array
      //existingEdizioni.push(defaultEdizione);

      // Update Firebase document
      await updateDoc(docRef, {
        edizioni: [...existingEdizioni, defaultEdizione],
      });

      // Update the local edizioni value
      edizioni.value = [...existingEdizioni, defaultEdizione];
      //aggiiorno il timestamp locale e su firebase
      const timestamp = new Date().valueOf();
      await updateTimestamp(timestamp);

      console.log("New edizione added successfully:", defaultEdizione);
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error adding new edizione:", error);
  }
  confirmAddEdizione.value = false;
};
const removeEdizione = async (index) => {
  try {
    // Check if the index is valid
    if (index < 0 || index >= edizioni.value.length) {
      console.error("Invalid index:", index);
      return;
    }

    // Remove the edizione at the specified index
    edizioni.value.splice(index, 1)[0];

    // mi carico i dati correnti
    const docSnapshot = await getDoc(docRef);
    const existingData = docSnapshot.data();
    // Update only the edizioni field, leaving other fields unchanged
    await setDoc(docRef, {
      ...existingData, // Spread existing data to keep other fields unchanged
      edizioni: edizioni.value, // Replace the edizioni field with the new value
    });

    // Update the timestamp locally and on Firebase
    const timestamp = new Date().valueOf();
    await updateTimestamp(timestamp);
  } catch (error) {
    console.error("Error removing edizione:", error);
  }
  confirmRemoveEdizione.value = false;
};

// Call the function to check and create Edizioni array
</script>

<style scoped></style>
