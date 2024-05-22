<template>
  <div class="bg-primary">
    <div class="row items-start q-mt-md q-px-md q-col-gutter-md bg-primary">
      <div class="row q-gutter-md" id="card container">
        <q-card
          v-for="(image, outerIndex) in images"
          :key="outerIndex"
          flat
          bordered
          class="column q-mr-xl q-ml-xl"
          style="width: 250px; height: 400px"
          id="card"
        >
          <q-card-section id="Select and upload image">
            <q-item class="row items-center q-gutter-sm no-wrap q-pa-none">
              <q-item-section class="col">
                <q-select
                  color="main"
                  v-model="selectedImageOptions[outerIndex]"
                  :options="coversOptions"
                  :label="image.label"
                  :readonly="!isAdmin"
                  :hide-dropdown-icon="!isAdmin"
                  :borderless="!isAdmin"
                  dense
                  class="full-width"
                />
              </q-item-section>
              <q-item-section id="save  button" class="col-auto" v-if="isAdmin">
                <q-btn
                  size="12px"
                  flat
                  dense
                  round
                  icon="save"
                  @click="
                    saveImageDetail(
                      'imageName',
                      bookId,
                      selectedImageOptions[outerIndex].value,
                      outerIndex,
                    )
                  "
                  color="secondary"
                  class="q-pa-none"
                />
              </q-item-section>
              <q-item-section id="save  button" class="col-auto" v-if="isAdmin">
                <q-btn
                  side
                  size="12px"
                  flat
                  dense
                  round
                  icon="upload"
                  @click="openUploadImage(outerIndex)"
                  color="secondary"
                  class="q-pa-none"
                />
              </q-item-section>
            </q-item>
          </q-card-section>

          <q-card-section id="image section">
            <div class="flex justify-center">
              <q-img
                class="col"
                :src="
                  image.name
                    ? fireStoreUrl + image.name + '?alt=media'
                    : bookImage
                "
                style="max-width: 250px; max-height: 300px"
                fit="contain"
              >
                <template v-slot:error>
                  <q-img :src="bookImage" fit="contain" />
                </template>
              </q-img>
            </div>
          </q-card-section>

          <q-card-section
            id="Aggiunta rimozione Copertina"
            class="row items-center q-gutter-md justify-end q-mt-auto"
          >
            <div v-if="isAdmin">
              <q-btn
                fab
                icon="add"
                color="purple-4"
                @click="confirmAddCover = true"
              />
              <q-dialog v-model="confirmAddCover" persistent>
                <q-card>
                  <q-card-section class="q-pa-md">
                    <p>Sei sicuro di voler aggiungere una immagine?</p>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn
                      flat
                      label="Annulla"
                      color="primary"
                      @click="confirmAddCover = false"
                    />
                    <q-btn
                      flat
                      label="Conferma"
                      color="negative"
                      @click="addImage('')"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
            <div v-if="isAdmin">
              <q-btn
                fab
                icon="delete"
                color="purple-4"
                @click="
                  imageToRemoveIndex = outerIndex;
                  confirmRemoveImage = true;
                "
              />
              <q-dialog v-model="confirmRemoveImage" persistent>
                <q-card>
                  <q-card-section class="q-pa-md">
                    <p>Sei sicuro di voler rimuovere questa immagine?</p>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn
                      flat
                      label="Annulla"
                      color="primary"
                      @click="confirmRemoveImage = false"
                    />
                    <q-btn
                      flat
                      label="Conferma"
                      color="negative"
                      @click="
                        removeImage(imageToRemoveIndex);
                        imageToRemoveIndex = null;
                        confirmRemoveImage = false;
                      "
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <q-dialog v-model="showUploaderPopup">
        <div class="q-pa-md">
          <FirebaseUploader
            v-if="uploadImageIndex !== null"
            :blocking="true"
            extention=""
            directory="images"
            :bookId="route.params.id"
            :imageUuid="images[uploadImageIndex].name"
            :imageIndex="uploadImageIndex"
            @uploaded="
              handleFileUploadedLocal(
                bookId,
                $event.originalFile.name,
                images[uploadImageIndex].name,
                uploadImageIndex,
              )
            "
            :fileInputRef="fileInputRef"
            label="Cambia immagine"
            color="blue"
            flat
            bordered
            style="max-width: 300px"
          />
        </div>
      </q-dialog>
    </div>
    <div>
      <div class="col-md-8 col-lg-8 col-xs-12 col-sm-12 q-px-md q-pt-sm">
        <div>
          <q-card-section id="text" class="overflow: auto">
            <!-- book detail list -->
            <q-list>
              <q-item v-for="(detail, index) in bookDetails" :key="index">
                <q-item-section top v-if="detail.id === 'editore'">
                  <q-select
                    color="accent"
                    :outlined="isAdmin"
                    v-model="detail.value"
                    :options="editoriOptions"
                    :label="detail.label"
                    @change="detail.value = currentEditore"
                    dark=""
                    :readonly="!isAdmin"
                    :hide-dropdown-icon="!isAdmin"
                    :borderless="!isAdmin"
                  />
                  <q-item-section top side v-if="isAdmin">
                    <div>
                      <q-btn
                        size="12px"
                        flat
                        dense
                        round
                        icon="save"
                        @click="
                          saveDetail(bookId, detail.id, detail.value.value)
                        "
                        color="secondary"
                      />
                    </div>
                  </q-item-section>
                </q-item-section>

                <q-item-section top v-else-if="detail.id === 'collana'">
                  <q-select
                    color="accent"
                    fill-input
                    :outlined="isAdmin"
                    label="Tipo di collana"
                    v-model="detail.value"
                    :options="collaneOptions"
                    @change="detail.value = currentCollana"
                    dark=""
                    :readonly="!isAdmin"
                    :hide-dropdown-icon="!isAdmin"
                    :borderless="!isAdmin"
                  >
                  </q-select>
                  <q-item-section top side v-if="isAdmin">
                    <div>
                      <q-btn
                        size="12px"
                        flat
                        dense
                        round
                        icon="save"
                        @click="
                          saveDetail(bookId, detail.id, detail.value.value)
                        "
                        color="secondary"
                      />
                    </div>
                  </q-item-section>
                </q-item-section>

                <q-item-section top v-else>
                  <q-input
                    :outlined="isAdmin"
                    v-model="detail.value"
                    :label="detail.label"
                    :readonly="!isAdmin"
                    :borderless="!isAdmin"
                    class="text-h6 text-grey-11"
                    dark
                    color="accent"
                  />
                  <q-item-section top side v-if="isAdmin">
                    <div>
                      <q-btn
                        size="12px"
                        flat
                        dense
                        round
                        icon="save"
                        @click="saveDetail(bookId, detail.id, detail.value)"
                        color="secondary"
                      />
                    </div>
                  </q-item-section>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </div>
        <div>
          <div>Edizioni</div>

          <div class="q-gutter-md row items-start justify-start">
            <q-card
              v-for="(edizione, edizioneIndex) in edizioni"
              :key="edizioneIndex"
              class="q-mb-md"
              :class="edizione.posseduto ? 'bg-green-3' : 'bg-grey-2'"
              style="max-width: 200px"
            >
              <q-card-section class="overflow-auto">
                <div class="row q-gutter-md items-center">
                  <div class="col">
                    <q-input
                      v-model="edizione.numero"
                      label="Edizione"
                      color="accent"
                      style="max-width: 100px"
                      :readonly="!isAdmin"
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
                          edizioneIndex,
                          edizione.numero,
                          bookId,
                        )
                      "
                      v-if="isAdmin"
                    />
                  </div>
                </div>

                <div class="row q-gutter-md items-center">
                  <div class="col">
                    <q-input
                      v-model.number="edizione.anno"
                      label="Anno"
                      color="accent"
                      class="col"
                      type="number"
                      style="max-width: 100px"
                      :readonly="!isAdmin"
                    />
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      icon="save"
                      color="blue-4"
                      @click="
                        saveEdizioneDetail(
                          'anno',
                          edizioneIndex,
                          edizione.anno,
                          bookId,
                        )
                      "
                      v-if="isAdmin"
                    />
                  </div>
                </div>
                <div>
                  <!-- Your content here -->
                </div>
                <div
                  class="row q-gutter-md items-center"
                  v-if="isCollector || isAdmin"
                >
                  <div class="col">
                    <q-toggle
                      v-model="edizione.posseduto"
                      label="Posseduto"
                      color="green"
                      @update:model-value="
                        savePossessoEdizione(
                          edizione.uuid,
                          edizione.posseduto,
                          userId,
                          bookId,
                        )
                      "
                    />
                  </div>
                </div>
              </q-card-section>
              <q-card-section
                id="Aggiunta rimozione Edizione"
                class="row items-center q-gutter-md justify-end"
              >
                <div v-if="isAdmin">
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
                          @click="addEdizione()"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                </div>
                <div v-if="isAdmin">
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
                          @click="removeEdizione(edizioneIndex)"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="isAdmin">
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
                  @click="deleteBook(bookId)"
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
import { storage, fireStoreUrl } from "../firebase/firebaseInit"; // Assuming you have Firebase storage initialized
import { onMounted, ref, computed } from "vue";
import { useAuth } from "../composable/auth";
import { fetchBookDetails } from "../utils/FetchDetails";
import {
  saveDetail,
  saveEdizioneDetail,
  savePossessoEdizione,
  deleteBook,
  handleFileUploaded,
  saveImageDetail,
} from "../utils/saveDetails";
import { useRouter, useRoute } from "vue-router";
import { db } from "../firebase/firebaseInit";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { updateTimestamp } from "../utils/global";
import short from "short-uuid";
import {
  useCollaneStore,
  useCoversStore,
  useEditoriStore,
  useBibliografiaStore,
} from "src/store/database";
const currenIndex = ref(null);
const shortUuidGenerator = short();
import bookImage from "../assets/400x600.png";
const { isLoggedIn, userId, checkAuthState } = useAuth();
const router = useRouter();
const route = useRoute();
const bookDetails = ref([]);
const edizioni = ref([]);
const bookId = router.currentRoute.value.params.id;
let editori = ref([]);
let collane = ref([]);
const covers = ref([]);
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
const coverStrore = useCoversStore();
const bibliografiaStore = useBibliografiaStore();
const selectedImageOptions = ref([]);
const selectedEditoreOptions = ref([]);
const selectedCollanaOptions = ref([]);
const coversOptions = ref([]);
const imageToRemoveIndex = ref(null);

/**
 * Fetches the details of a book and its editions when the component is mounted.
 * It first checks the authentication state, then retrieves the book ID from the current route.
 * It then calls the `fetchBookDetails` function to fetch the book details and editions, and updates the corresponding data properties.
 */
onMounted(async () => {
  // Ensure authentication state is checked
  //console.log("check auth state");
  await checkAuthState();
  // Get the current values of isLoggedIn and userId
  if (isLoggedIn.value) {
    const userDocRef = doc(db, "Users", userId.value);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data();
    isAdmin = isLoggedIn && userData.role === "admin";
    isCollector = isLoggedIn && userData.role === "collector";
  } else {
    isAdmin = false;
    isCollector = false;
    userId.value = null;
  }

  const {
    bookDetails: fetchedBookDetails,
    edizioni: fetchedEdizioni,
    images: fetchedImages,
  } = await fetchBookDetails(userId.value, isLoggedIn, bookId);
  // Check if the images array is empty
  bookDetails.value = fetchedBookDetails;
  edizioni.value = fetchedEdizioni;
  images.value = fetchedImages;
  coversOptions.value = coverStrore.covers.cover;
  //gestisco il fatto che non tutti i libri hanno una copertina
  //prima controllo che esista nel libro il campo immagine e se non essite lo creo
  //con un immagie con "id prima di copertina"
  //e con name che viene generato con shortuiid dento addImage
  if (!images.value || images.value.length === 0) {
    const idValue = "qNvdwFMLNt2Uz7JjqTjacu";
    await addImage(idValue); // Call the addImage function to add a default image
  }
  // a questo punto images o ha un solo elemento appena creato o larray originale
  // controllo che il campo "name" di "images" non sia vuoto, se lo è lo sostituisco
  //con un valore generato
  await checkAndUpdateImages(images.value, bookId);
  //
  console.log("images", images.value);
  console.log("COVEROPTIONS", coversOptions.value);
  await createSelectedImagesOptions(images.value, coversOptions);
  console.log("SELECTEDImagesoPTIONS", selectedImageOptions.value);

  editori.value = editoriStore.editori.editore;
  collane.value = collaneStore.collane.collana;
  console.log("covers", covers.value);
  //console.log("editori", editori.value);
  //console.log("collane", collane.value);
  console.log(currentCollana.value); // Accessing currentCollana to trigger its computation
});

const uploadImageIndex = ref(null);
const showUploaderPopup = ref(false);
const fileInputRef = ref(null);
const confirmAddEdizione = ref(false);
const confirmRemoveEdizione = ref(false);
const confirmDeleteBook = ref(false);
const confirmAddCover = ref(false);
const confirmRemoveImage = ref(false);
const newBookImages = ref([]);
const images = ref([]);
let fetchedBook = [];
let isAdmin = false;
let isCollector = false;
// tool for long press detection
const handleFileUploadedLocal = async (
  bookId,
  originalFileName,
  targetName,
  index,
) => {
  console.log("images berfore valling namdle", images.value);

  images.value = await handleFileUploaded(
    bookId,
    originalFileName,
    targetName,
    index,
  );
  showUploaderPopup.value = false;
  console.log("images after valling namdle", images.value);
};

const createSelectedImagesOptions = async (images, coversOptions) => {
  for (const image of images) {
    const matchingOption = coversOptions.value.find(
      (option) => option.value === image.id,
    );
    console.log("matchingOption", matchingOption);
    selectedImageOptions.value.push(matchingOption || null);
  }

  console.log("selectedImageOptions", selectedImageOptions);
  return selectedImageOptions;
};
const checkAndUpdateImages = async (images, bookId) => {
  let changesMade = false;

  for (const [index, image] of images.entries()) {
    // Check if the value of name is empty or null
    if (!image.name) {
      //if the name is not present replace the name with shortuid
      //and say that a change has been made
      const shortUuid = shortUuidGenerator.new();
      image.name = shortUuid;
      changesMade = true;
    }
  }
  // check if a change has been made and update
  // biblografia localStorage and Firebase
  if (changesMade) {
    //
    //
    try {
      const timestamp = new Date().valueOf();
      const bookRef = doc(db, "Bibliografia", bookId);
      const dataSnapshot = await getDoc(bookRef);
      const data = dataSnapshot.data();
      console.log("Update image array n firbebase ", images);

      // Update the specified item in the 'edizioni' array
      // use setDoc since I do not know if images exist or not
      await setDoc(bookRef, { images: images }, { merge: true });

      // Update the timestamp in the parent document
      // use setDoc to be sure that if timestamp does not exist does not
      // send bak an error
      await setDoc(
        bookRef,
        {
          timestamp: timestamp,
        },
        { merge: true },
      );
      // before updating bibliograsfia I need to find hte index of the book in the array
      const bibliografiaStore = useBibliografiaStore();
      const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
        (book) => book.id === bookId,
      );
      // if index is not negative the index exist so I can upgrade
      if (bookIndexInBibliografia !== -1) {
        console.log(
          "Book found in bibliografiaStore:",
          bibliografiaStore.bibliografia[bookIndexInBibliografia],
        );
        bibliografiaStore.bibliografia[bookIndexInBibliografia].images = images;
        // now I update the whole local storage to avoid error
        localStorage.setItem(
          "bibliografia",
          JSON.stringify(bibliografiaStore.bibliografia),
        );
        console.log("bibliografia", bibliografiaStore.bibliografia);
      }

      // Call the function to update the timestamp locally
      // to communicate teh last change on firebase
      await updateTimestamp(timestamp);
    } catch (error) {
      console.error("Error saving detail:", error);
    }
  }
};
const handleCoverModelValueUpdate = (outerIndex, newValue) => {
  console.log("handleModelValueUpdate", outerIndex, newValue);
  selectedImageTypeId.value = newValue.value;
  // You can add additional logic here if needed
};
const removeEdizione = async (index) => {
  console.log("removeEdizione at index", index);
  try {
    if (index < 0 || index >= edizioni.value.length) {
      return;
    }
    edizioni.value.splice(index, 1);
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookSnapshot = await getDoc(bookRef);
    const data = bookSnapshot.data();
    await setDoc(bookRef, { edizioni: edizioni.value }, { merge: true });
    // before updating bibliograsfia I need to find hte index of the book in the array
    const bibliografiaStore = useBibliografiaStore();
    const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
      (book) => book.id === bookId,
    );
    // if index is not negative the index exist so I can upgrade
    if (bookIndexInBibliografia !== -1) {
      console.log(
        "Book found in bibliografiaStore:",
        bibliografiaStore.bibliografia[bookIndexInBibliografia],
      );
      bibliografiaStore.bibliografia[bookIndexInBibliografia].edizioni =
        edizioni.value;
      // now I update the whole local storage to avoid error
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(bibliografiaStore.bibliografia),
      );
      console.log("bibliografia", bibliografiaStore.bibliografia);
    }
    // Update the timestamp in the parent document
    // use setDoc to be sure that if timestamp does not exist does not
    // send bak an error
    const timestamp = new Date().valueOf();

    await setDoc(
      bookRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );
    await updateTimestamp(timestamp);
  } catch (error) {
    console.error("Error removing edizione ", error);
  }
  confirmRemoveEdizione.value = false;
};

const removeImage = async (index) => {
  try {
    if (index < 0 || index >= images.value.length) {
      return;
    }
    console.log("removing index", index);
    images.value.splice(index, 1);
    const bookRef = doc(db, "Bibliografia", bookId);
    await updateDoc(bookRef, {
      images: images.value, // Replace the edizioni field with the new value
    });
  } catch (error) {
    console.error("Error removing edizione ", error);
  }
  confirmRemoveImage.value = false;
};
const addImage = async (idValue) => {
  console.log("add edizione called");
  try {
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDocSnap = await getDoc(bookRef);
    const shortUuid = shortUuidGenerator.new();

    if (bookDocSnap.exists()) {
      let existingImages = bookDocSnap.data().images || [];
      const defaultImage = {
        id: idValue, //riferimento al tipo di immagine
        name: shortUuid, //nome del file che per adesso è fake
      };

      await updateDoc(bookRef, {
        images: [...existingImages, defaultImage],
      });
      images.value = [...existingImages, defaultImage];
      console.log("image after adding", images.value);
      const timestamp = new Date().valueOf();
      await updateTimestamp(timestamp);
    } else {
      console.log("No such document!");
    }
    //update bibliografia in PINIA and local storage
    const bibliografiaStore = useBibliografiaStore();
    const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
      (book) => book.id === bookId,
    );
    if (bookIndexInBibliografia !== -1) {
      // Book found in bibliografiaStore, you can access it using bibliografiaStore.bibliografia[bookIndexInBibliografia]
      console.log(
        "Book found in bibliografiaStore:",
        bibliografiaStore.bibliografia[bookIndexInBibliografia],
      );
      bibliografiaStore.bibliografia[bookIndexInBibliografia].images =
        images.value;
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(bibliografiaStore.bibliografia),
      );
      console.log("bibliografia", bibliografiaStore.bibliografia);
    }
  } catch (error) {
    console.error("Error adding new image:", error);
  }
  confirmAddCover.value = false;
};
const addEdizione = async () => {
  //console.log("add edizione called");
  try {
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDocSnap = await getDoc(bookRef);
    const shortUuid = shortUuidGenerator.new();

    if (bookDocSnap.exists()) {
      let existingEdizioni = bookDocSnap.data().edizioni || [];
      const defaultEdizione = {
        anno: 1900,
        backCoverUrl: "dummy",
        borderCoverUrl: "dummy",
        frontCoverUrl: "dummy",
        numero: 1,
        posseduto: false,
        uuid: shortUuid,
      };

      await updateDoc(bookRef, {
        edizioni: [...existingEdizioni, defaultEdizione],
      });
      edizioni.value = [...existingEdizioni, defaultEdizione];

      //devo aggiornare pinia e local storage
      // before updating bibliograsfia I need to find hte index of the book in the array
      const bibliografiaStore = useBibliografiaStore();
      const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
        (book) => book.id === bookId,
      );
      // if index is not negative the index exist so I can upgrade
      if (bookIndexInBibliografia !== -1) {
        console.log(
          "Book found in bibliografiaStore:",
          bibliografiaStore.bibliografia[bookIndexInBibliografia],
        );
        bibliografiaStore.bibliografia[bookIndexInBibliografia].edizioni =
          edizioni;
        // now I update the whole local storage to avoid error
        localStorage.setItem(
          "bibliografia",
          JSON.stringify(bibliografiaStore.bibliografia),
        );
        console.log("bibliografia", bibliografiaStore.bibliografia);
      }

      //
      const timestamp = new Date().valueOf();

      await setDoc(
        bookRef,
        {
          timestamp: timestamp,
        },
        { merge: true },
      );
      await updateTimestamp(timestamp);
      //
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error adding new edizione:", error);
  }
  confirmAddEdizione.value = false;
};
const openUploadImage = (index) => {
  uploadImageIndex.value = index;
  console.log(
    "images[uploadImageIndex].id",
    images.value[uploadImageIndex.value],
  );

  showUploaderPopup.value = true; // Show the uploader popup when an image is clicked
};
const collaneOptions = computed(() => {
  return collane.value.map((item) => ({
    value: item.id,
    label: item.collana, // Replace 'collana' with the actual property name in your collane object
  }));
});
const editoriOptions = computed(() => {
  return editori.value.map((item) => ({
    value: item.id,
    label: item.editore, // Replace 'collana' with the actual property name in your collane object
  }));
});
const currentCollana = computed(() => {
  //console.log("bookDetails ", bookDetails.value);
  //console.log("fetched collana", bookDetails.value.collana);
  const selectedCollanaOptions = collaneOptions.value.find(
    (option) => option.value === fetchedBook.collana,
  );
  const result = selectedCollanaOptions ? selectedCollanaOptions.label : null;

  console.log("current collana:", result);
  return result;
});
const currentEditore = computed(() => {
  //console.log("fetched editore", fetchedBook.editore);
  const selectedEditoreOption = editoriOptions.value.find(
    (option) => option.value === fetchedBook.editore,
  );
  const result = selectedEditoreOption ? selectedEditoreOption.label : null;

  console.log("current editore:", result);
  return result;
});
</script>

<style lang="sass" scoped></style>
