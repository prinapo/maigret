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
              <q-carousel-slide :name="1">
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
              <q-carousel-slide :name="2">
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
              <q-carousel-slide :name="3">
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
            <q-expansion-item>
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
        <q-card-section id="text" class="overflow: auto">
          <!-- book detail list -->
          <q-list>
            <q-item v-for="(detail, index) in bookDetails" :key="index">
              <q-item-section top v-if="detail.id !== 'editore'">
                <q-input
                  outlined
                  v-model="detail.value"
                  :label="detail.label"
                  :readonly="detail.editable"
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
                />
              </q-item-section>
              <q-item-section top side v-if="!detail.editable">
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn
                    class="gt-xs"
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
    </div>
  </div>
</template>

<script setup>
onMounted(() => {
  fetchBookDetails();
  editori = editoriStore.editori;
  console.log("editori in dettaaglio", editori);
});

let editori = [];

import { ref, onMounted } from "vue";
import { db } from "../firebase/firebaseInit";
import { doc, getDoc, setDoc, updateDoc, FieldValue } from "firebase/firestore";
import { useRoute } from "vue-router";
import { fireStoreUrl } from "../firebase/firebaseInit"; // Import fireStoreUrl from firebaseInit
import { useEditoriStore, useBibliografiaStore } from "src/store/database";
import { useQuasar } from "quasar";

const selectedEditore = ref("");
const editoriStore = useEditoriStore();
const quasar = useQuasar();

import { useAuth } from "../composable/auth";

const { isLoggedIn, checkAuthState } = useAuth();
// Call checkAuthState to ensure isLoggedIn is up-to-date
checkAuthState();
// Define book and placeholder URL
const book = ref({});
import bookImage from "../assets/400x600.png"; // Import the book image from assets directory

const slide = ref(1); // Initialize slide reference
const fileInputRef = ref(null);
const imageVersion = ref(0);
// Access route parameters
const route = useRoute();
const updatesBibliografiaTimesRef = doc(db, "Updates", "bibliografiaTimes");

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
      bookDetails.value = [
        { id: "titolo", label: "Titolo", value: book.value.titolo },
        { id: "editore", label: "Editore", value: book.value.editore },
        //        { id: "signedUrl", label: "Front", value: book.value.signedUrl },
        //        { id: "signedUrlBck", label: "Back", value: book.value.signedUrlBck },

        //{ id: "raccolta", label: "Raccolta", value: book.value.raccolta },
        //{ id: "confermato", label: "Confermato", value: book.value.confermato },
        //       {       id: "ed_2Anno",   label: "Second Edition Year",       value: book.value.ed_2Anno, },
        // {
        //   id: "ed_1Posseduta",
        //   label: "First Edition Possessed",
        //   value: book.value.ed_1Posseduta,
        // },
        { id: "lingua", label: "Lingua", value: book.value.lingua },
        { id: "posseduto", label: "Posseduto", value: book.value.posseduto },
        // {
        //   id: "ed_1Anno",
        //   label: "First Edition Year",
        //   value: book.value.ed_1Anno,
        // },
        {
          id: "numeroCollana",
          label: "Numeor Collana",
          value: book.value.numeroCollana,
        },
        {
          id: "annoPubblicazione",
          label: "Publication Year",
          value: book.value.annoPubblicazione,
        },
        //{ id: "edizione", label: "Edizione", value: book.value.edizione },
        { id: "collana", label: "Collana", value: book.value.collana },
        {
          id: "numeroCollana",
          label: "Numeor Collana",
          value: book.value.numeroCollana,
        },
        {
          id: "titoloOriginale",
          label: "Titolo Orginale",
          value: book.value.titoloOriginale,
        },
        // { id: "timestamp", label: "Timestamp", value: book.value.timestamp },
      ];
      console.log("Book details:", book.value); // Log book details
      console.log("Book details:", bookDetails.value); // Log bookDetails
    } else {
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
      console.log(
        "Book details updated:",
        detailId,
        " ",
        bookDetails.value[updatedDetailIndex].value,
        "",
        book.value.signedUrl,
      );
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
const bookDetails = ref([]);

// Define method to handle edit action for a detail
const editDetail = (detail) => {
  // Handle edit action for the specific detail
  console.log("Edit detail:", detail);
};

const saveDetail = async (detail) => {
  console.log("detail", detail);
  const timestamp = new Date().valueOf();

  try {
    const docRef = doc(db, "Bibliografia", route.params.id);

    // Use "set with merge" operation to update the document
    await setDoc(
      docRef,
      {
        [detail.id]: detail.value,
      },
      { merge: true },
    );
    console.log("saved data ", detail.id, detail.value);
    await setDoc(
      docRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );

    detail.editable = false; // Set editable to false after saving
    console.log("Detail saved successfully!");

    // Add timestamp to the updates array in the bibliographyTimes document
    const docSnap = await getDoc(updatesBibliografiaTimesRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updates = data.updates || []; // Get the current array or initialize an empty array if it doesn't exist

      // Check if the new timestamp already exists in the array
      if (!updates.includes(timestamp)) {
        // If the timestamp doesn't exist, update the document with the new array
        updates.push(timestamp);
        await updateDoc(updatesBibliografiaTimesRef, { updates });
        console.log("Timestamp added to updates array:", timestamp);

        // Update the lastUpdate value in localStorage
        localStorage.setItem("lastUpdate", timestamp.toString());
        quasar.notify({
          message: `"${detail.id}" "${detail.value}" saved successfully!`,
          color: "positive",
        });
      } else {
        console.log("Timestamp already exists in updates array:", timestamp);
      }
    } else {
      console.log("Document does not exist.");
    }
  } catch (error) {
    console.error("Error saving detail:", error);
    quasar.notify({
      message: `Error saving detail "${detail.id}": ${error.message}`,
      color: "negative",
    });
  }
};
// Fetch book details on component mount
</script>

<style scoped></style>
