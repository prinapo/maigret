<template>
  <div class="flex-container">
    <q-card class="flex-item">
      <q-card-section>
        <!-- Back button -->
        <q-btn
          class="back-button"
          @click="$router.go(-1)"
          label="Back"
          color="primary"
          dense
        />
      </q-card-section>
      <q-card-section>
        <!-- Q-Carousel for displaying images -->
        <q-carousel animated v-model="slide" arrows navigation height="100%">
          <!-- Front -->
          <q-carousel-slide :name="1">
            <div class="custom-caption">
              <div class="text-subtitle1">Front</div>
            </div>
            <q-img
              v-if="book.signedUrl"
              :src="`${book.signedUrl}`"
              style="cursor: pointer"
            />

            <!-- Use placeholder URL if signedUrl is empty -->
            <q-img v-else :src="bookImage" style="cursor: pointer" />
          </q-carousel-slide>
          <!-- Back -->
          <q-carousel-slide :name="2">
            <div class="custom-caption">
              <div class="text-subtitle1">Back</div>
            </div>
            <q-img
              v-if="book.signedUrlBck"
              :src="`${book.signedUrlBck}`"
              style="cursor: pointer"
            />
            <!-- Use placeholder URL if signedUrlBck is empty -->
            <q-img v-else :src="bookImage" style="cursor: pointer" />
          </q-carousel-slide>
          <q-carousel-slide :name="2">
            <div class="custom-caption">
              <div class="text-subtitle1">Back</div>
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
      </q-card-section>
      <q-card-section>
        <q-expansion-item>
          <div class="q-pa-md">
            <div class="q-gutter-sm row items-start">
              <FirebaseUploader
                :blocking="true"
                extention=""
                directory="images"
                :bookId="route.params.id"
                @uploaded="handleFileUploaded('', $event)"
                :fileInputRef="fileInputRef"
                label="Upload files"
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
                label="Upload files"
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
                label="Upload files"
                color="bkue"
                square
                flat
                bordered
                style="max-width: 300px"
              />
            </div>
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>
    <q-card inline class="card-container flex-item">
      <q-card-section vertical>
        <!-- Loop through each detail -->
        <q-list dense bordered padding class="rounded-borders">
          <q-item dense v-for="(detail, index) in bookDetails" :key="index">
            <q-item-section class="rounded-borders">
              <!-- Show input field if editable -->
              <template v-if="detail.editable">
                <p>
                  <span class="label">{{ detail.label }}</span>
                  <q-input v-model="detail.value" class="value" />
                </p>
              </template>
              <!-- Show label and editable field if not editable -->
              <template v-else>
                <div>
                  <p>
                    <span class="label"> {{ detail.label }}</span>

                    <span class="vlaue">
                      {{ detail.value }}
                    </span>
                  </p>
                </div>
              </template>
            </q-item-section>
            <q-item-section side v-if="isLoggedIn">
              <div class="button-container q-gutter-md">
                <q-btn
                  flat
                  round
                  :icon="detail.editable ? 'close' : 'edit'"
                  @click="toggleEdit(detail)"
                />
                <!-- Add close button if editable -->
                <q-btn
                  flat
                  round
                  icon="save"
                  v-if="detail.editable"
                  @click="saveDetail(detail)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db } from "../firebase/firebaseInit";
import { doc, getDoc, setDoc, updateDoc, FieldValue } from "firebase/firestore";
import { useRoute } from "vue-router";

import { useAuth } from "../composable/auth";
const { isLoggedIn, checkAuthState } = useAuth();
// Call checkAuthState to ensure isLoggedIn is up-to-date
checkAuthState();
// Define book and placeholder URL
const book = ref({});
import bookImage from "../assets/400x600.png"; // Import the book image from assets directory

const placeholderUrl =
  "https://firebasestorage.googleapis.com/v0/b/simenon-db758.appspot.com/o/400x600.png?alt=media";
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
        { id: "titolo", label: "Title", value: book.value.titolo },
        { id: "signedUrl", label: "Front", value: book.value.signedUrl },
        { id: "signedUrlBck", label: "Back", value: book.value.signedUrlBck },
        { id: "editore", label: "Editor", value: book.value.editore },
        { id: "raccolta", label: "Raccolta", value: book.value.raccolta },
        { id: "confermato", label: "Confermato", value: book.value.confermato },
        {
          id: "ed_2Anno",
          label: "Second Edition Year",
          value: book.value.ed_2Anno,
        },
        {
          id: "ed_1Posseduta",
          label: "First Edition Possessed",
          value: book.value.ed_1Posseduta,
        },
        { id: "lingua", label: "Language", value: book.value.lingua },
        { id: "posseduto", label: "Possessed", value: book.value.posseduto },
        {
          id: "ed_1Anno",
          label: "First Edition Year",
          value: book.value.ed_1Anno,
        },
        {
          id: "numeroCollana",
          label: "Collection Number",
          value: book.value.numeroCollana,
        },
        {
          id: "annoPubblicazione",
          label: "Publication Year",
          value: book.value.annoPubblicazione,
        },
        { id: "edizione", label: "Edition", value: book.value.edizione },
        { id: "uniqueId", label: "Unique ID", value: book.value.uniqueId },
        { id: "collana", label: "Collection", value: book.value.collana },
        {
          id: "titoloOriginale",
          label: "Original Title",
          value: book.value.titoloOriginale,
        },
        { id: "bookId", label: "Book ID", value: book.value.bookId },
        { id: "timestamp", label: "Timestamp", value: book.value.timestamp },
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
    const fileURL = `https://firebasestorage.googleapis.com/v0/b/simenon-db758.appspot.com/o/images%2F${route.params.id}${extension}.${fileExtension}?alt=media`;

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
      } else {
        console.log("Timestamp already exists in updates array:", timestamp);
      }
    } else {
      console.log("Document does not exist.");
    }
  } catch (error) {
    console.error("Error saving detail:", error);
  }
};
// Fetch book details on component mount
onMounted(fetchBookDetails);
</script>

<style scoped>
@import url("../css/DettaglioLibro.css");
</style>
