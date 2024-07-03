<template>
  <div class="bg-primary">
    <div id="image carousel" v-if="!isAdmin">
      <q-carousel
        v-model="slide"
        transition-prev="slide-right"
        transition-next="slide-left"
        swipeable
        animated
        control-color="amber"
        navigation
        padding
        arrows
        height="400px"
        class="bg-grey-9 shadow-2 rounded-borders"
      >
        <q-carousel-slide
          v-for="(imageBatch, outerIndex) in imageBatches"
          :key="outerIndex"
          :name="outerIndex"
        >
          <div class="row justify-around" style="height: 100%" id="slide div">
            <div
              v-for="(image, innerIndex) in imageBatch"
              :key="innerIndex"
              id="for"
              style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                width: 250px;
              "
            >
              <q-img
                :src="getImageSource(image.name)"
                @error="handleImageError"
                no-spinner
                style="
                  max-height: 100%;
                  width: 100%;
                  object-fit: contain;
                  display: flex;
                  align-items: flex-end;
                  justify-content: center;
                "
                fit="contain"
                @click="showImageFullscreen(outerIndex, innerIndex)"
              >
                <div
                  class="caption-container"
                  style="
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    width: 100%;
                    text-align: center;
                    padding: 4px 0;
                    position: absolute;
                    bottom: 0;
                  "
                >
                  {{ image.coverType }}
                </div>
              </q-img>
              <q-dialog
                v-model="dialogs[outerIndex][innerIndex]"
                full-screen
                transition-show="fade"
                transition-hide="fade"
              >
                <q-card style="width: 80vw; height: 100%">
                  <!-- Remove the q-bar containing the close button -->
                  <q-img
                    :src="getImageSource(image.name)"
                    style="width: 100%; height: 100%"
                    fit="contain"
                    @click="closeDialog(outerIndex, innerIndex)"
                  ></q-img>
                </q-card>
              </q-dialog>
            </div>
          </div>
        </q-carousel-slide>
      </q-carousel>
    </div>
    <div
      id="images for admin"
      class="row items-start q-mt-md q-px-md q-col-gutter-md bg-primary"
      v-if="isAdmin"
    >
      <div class="row q-gutter-md" id="card container">
        <q-card
          v-for="(image, outerIndex) in images"
          :key="outerIndex"
          flat
          bordered
          class="column q-mr-xl q-ml-xl"
          style="
            width: 250px;
            height: 600px;
            display: flex;
            flex-direction: column;
          "
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
                  class="full-width"
                  @update:model-value="
                    saveImageDetail(
                      'imageName',
                      bookId,
                      selectedImageOptions[outerIndex].value,
                      outerIndex,
                    )
                  "
                />
              </q-item-section>
            </q-item>
          </q-card-section>

          <q-card-section
            id="image-section"
            style="
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
            "
          >
            <q-img
              class="col"
              :src="getImageSource(image.name)"
              style="max-width: 250px; max-height: 300px"
              fit="contain"
              @error="handleImageError"
            />
          </q-card-section>
          <q-card-section>
            <FirebaseUploader
              v-if="outerIndex !== null"
              class="col"
              :blocking="true"
              extention=""
              directory="images"
              :bookId="route.params.id"
              :imageUuid="images[outerIndex].name"
              :imageIndex="outerIndex"
              @uploaded="
                handleFileUploadedLocal(
                  bookId,
                  $event.originalFile.name,
                  images[outerIndex].name,
                  outerIndex,
                )
              "
              :fileInputRef="fileInputRef"
              label="Cambia immagine"
              color="blue"
              flat
              bordered
              style="width: 100%"
            />
          </q-card-section>
          <q-card-section
            id="Aggiunta-rimozione-Copertina"
            class="row items-center q-gutter-md justify-end q-mt-auto"
          >
            <q-btn
              v-if="isAdmin"
              fab
              icon="add"
              color="purple-4"
              @click="confirmAddCover = true"
              style="min-height: 48dp"
            />
            <q-dialog v-model="confirmAddCover" persistent>
              <q-card>
                <q-card-section class="q-pa-md">
                  <p>Sei sicuro di voler aggiungere un'immagine?</p>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn
                    flat
                    label="Annulla"
                    color="primary"
                    @click="confirmAddCover = false"
                    style="min-height: 48dp"
                  />
                  <q-btn
                    flat
                    label="Conferma"
                    color="negative"
                    @click="addImage('')"
                    v-close-popup
                    style="min-height: 48dp"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>

            <q-btn
              v-if="isAdmin"
              fab
              icon="delete"
              color="purple-4"
              @click="
                imageToRemoveIndex = outerIndex;
                confirmRemoveImage = true;
              "
              style="min-height: 48dp"
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
                    style="min-height: 48dp"
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
                    style="min-height: 48dp"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div
      id="details"
      style="max-width: 900px"
      class="items-start q-mt-md q-px-md q-col-gutter-md bg-primary"
    >
      <q-list>
        <q-item
          v-for="(detail, index) in bookDetails"
          :key="index"
          class="q-gutter- full-width"
        >
          <q-item-section top v-if="detail.id === 'editore'" class="full-width">
            <div class="row items-center q-gutter-sm full-width">
              <q-select
                :options="editoriOptionList"
                v-model="selectedEditore"
                :option-value="(option) => option.id"
                :option-label="(option) => option.editore"
                color="accent"
                fill-input
                :outlined="isAdmin"
                label="Editore"
                @update:model-value="
                  saveDetail(bookId, detail.id, selectedEditore.id)
                "
                dark
                :readonly="!isAdmin"
                :hide-dropdown-icon="!isAdmin"
                :borderless="!isAdmin"
                class="col-grow text-h6 text-grey-11"
                style="min-height: 48dp"
              >
              </q-select>
            </div>
          </q-item-section>
          <q-item-section
            top
            v-else-if="detail.id === 'collana'"
            class="full-width"
          >
            <div class="row items-center q-gutter-sm full-width">
              <q-select
                :options="collaneOptionList"
                v-model="selectedCollana"
                :option-value="(option) => option.id"
                :option-label="(option) => option.collana"
                color="accent"
                fill-input
                :outlined="isAdmin"
                label="Collana"
                @update:model-value="
                  saveDetail(bookId, detail.id, selectedCollana.id)
                "
                dark
                :readonly="!isAdmin"
                :hide-dropdown-icon="!isAdmin"
                :borderless="!isAdmin"
                class="col-grow text-h6 text-grey-11"
                style="min-height: 48dp"
              >
              </q-select>
            </div>
          </q-item-section>

          <q-item-section top v-else class="full-width">
            <div class="row items-center q-gutter-sm full-width">
              <q-input
                :outlined="isAdmin"
                v-model="detail.value"
                :label="detail.label"
                :readonly="!isAdmin"
                :borderless="!isAdmin"
                class="text-h6 text-grey-11 col-grow"
                dark
                color="accent"
                @focus="handleInputFocus(detail.value)"
                @blur="handleInputBlur(bookId, detail.id, detail.value)"
                style="min-height: 48dp"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div
      id="edizioni"
      class="row items-start q-mt-md q-px-md q-col-gutter-md bg-primary"
    >
      <div class="row q-gutter-md">
        <q-card
          v-for="(edizione, edizioneIndex) in edizioni"
          :key="edizioneIndex"
          class="column q-mr-xl q-ml-xl"
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
                  @focus="handleInputFocus(edizione.numero)"
                  @blur="
                    handleEdizioneInputBlur(
                      'numero',
                      edizioneIndex,
                      edizione.numero,
                      bookId,
                    )
                  "
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
                  style="max-width: 100px; min-height: 48dp"
                  :readonly="!isAdmin"
                  @focus="handleInputFocus(edizione.anno)"
                  @blur="
                    handleEdizioneInputBlur(
                      'anno',
                      edizioneIndex,
                      edizione.anno,
                      bookId,
                    )
                  "
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
                style="min-height: 48dp"
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
                      style="min-height: 48dp"
                    />
                    <q-btn
                      flat
                      label="Conferma"
                      color="negative"
                      @click="addEdizione()"
                      style="min-height: 48dp"
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
                style="min-height: 48dp"
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
                      style="min-height: 48dp"
                    />
                    <q-btn
                      flat
                      label="Conferma"
                      color="negative"
                      @click="removeEdizione(edizioneIndex)"
                      style="min-height: 48dp"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
          </q-card-section>
        </q-card>

        <div class="q-pa-md q-gutter-sm text-center mt-4" v-if="isAdmin">
          <q-btn
            label="Elimina il libro"
            color="negative"
            @click="confirmDeleteBook = true"
            style="min-height: 48dp"
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
                  style="min-height: 48dp"
                />
                <q-btn
                  flat
                  label="Conferma"
                  color="negative"
                  @click="deleteBook(bookId)"
                  style="min-height: 48dp"
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
import { db, fireStoreUrl } from "../firebase/firebaseInit"; // Assuming you have Firebase storage initialized
import { onMounted, ref, watch, computed } from "vue";
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
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { updateTimestamp } from "../utils/global";
import short from "short-uuid";
import {
  useCollaneStore,
  useCoversStore,
  useEditoriStore,
  useBibliografiaStore,
} from "src/store/database";
const shortUuidGenerator = short();
import bookImage from "../assets/400x600.png";
import { useQuasar } from "quasar";

const { isLoggedIn, userId, isAdmin, isCollector, checkAuthState } = useAuth();
const router = useRouter();
const route = useRoute();
const bookDetails = ref([]);
const edizioni = ref([]);
const bookId = router.currentRoute.value.params.id;
let editori = ref([]);
let collane = ref([]);
const editoriStore = useEditoriStore();
const editoriOptionList = ref([]);
const selectedEditore = ref(null);

const coverStrore = useCoversStore();
const selectedImageOptions = ref([]);
const coversOptions = ref([]);
const editoreValue = ref();
const imageToRemoveIndex = ref(null);

const collaneStore = useCollaneStore();
const collaneOptionList = ref([]);
const collanaValue = ref();
const selectedCollana = ref(null);
const $q = useQuasar();

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

  const {
    bookDetails: fetchedBookDetails,
    edizioni: fetchedEdizioni,
    images: fetchedImages,
  } = await fetchBookDetails(userId.value, isLoggedIn, bookId);

  bookDetails.value = fetchedBookDetails;
  edizioni.value = fetchedEdizioni;
  images.value = fetchedImages;
  //console.log("images.value", images.value);
  coversOptions.value = coverStrore.covers.cover;
  //console.log("covers", coversOptions.value);

  //gestisco il fatto che non tutti i libri hanno una copertina
  //prima controllo che esista nel libro il campo immagine e se non essite lo creo
  //con un immagie con "id prima di copertina"
  //e con name che viene generato con shortuiid dento addImage
  if (isAdmin.value) {
    if (!images.value || images.value.length === 0) {
      const idValue = "qNvdwFMLNt2Uz7JjqTjacu";
      await addImage(idValue); // Call the addImage function to add a default image
    }
  }
  // a questo punto images o ha  solo elemento appena creato o larray originale
  // controllo che il campo "nameun" di "images" non sia vuoto, se lo è lo sostituisco
  //con un valore generato
  if (isAdmin.value) {
    //console.log("chiamo chak and update ia damin è ", isAdmin.value);
    await checkAndUpdateImages(images.value, bookId);
  }
  await createSelectedImagesOptions(images.value, coversOptions);

  editori.value = editoriStore.editori.editore;
  collane.value = collaneStore.collane.collana;
  //inizializzo la collana selezionata
  collaneOptionList.value = collaneStore.collane.collana;
  const collanaBookDetail = bookDetails.value.find(
    (item) => item.id === "collana",
  );
  if (collanaBookDetail) {
    collanaValue.value = collanaBookDetail.uuid;
  }
  selectedCollana.value = collaneOptionList.value.find(
    (option) => option.id === collanaValue.value,
  );
  //inizializzo l'editore selezionato
  editoriOptionList.value = editoriStore.editori.editore;
  const editoriBookDetail = bookDetails.value.find(
    (item) => item.id === "editore",
  );
  if (editoriBookDetail) {
    editoreValue.value = editoriBookDetail.uuid;
  }

  selectedEditore.value = editoriOptionList.value.find(
    (option) => option.id === editoreValue.value,
  );
});

const fileInputRef = ref(null);
const confirmAddEdizione = ref(false);
const confirmRemoveEdizione = ref(false);
const confirmDeleteBook = ref(false);
const confirmAddCover = ref(false);
const confirmRemoveImage = ref(false);
const detailOriginalValue = ref();
const slide = ref(0);
const images = ref([]);

const handleInputBlur = (bookId, detailId, detailValue) => {
  if (detailOriginalValue.value !== detailValue) {
    saveDetail(bookId, detailId, detailValue);
  }
};
const handleEdizioneInputBlur = (field, index, value, bookId) => {
  if (detailOriginalValue.value !== value) {
    saveEdizioneDetail(field, index, value, bookId);
  }
};
const handleInputFocus = (detailValue) => {
  setTimeout(() => {
    detailOriginalValue.value = detailValue;
  }, 100);
};

const getImageSource = (imageName) => {
  return imageName ? `${fireStoreUrl}${imageName}?alt=media` : bookImage;
};

const handleImageError = (event) => {
  event.target.src = bookImage; // Fallback to the default image when the image fails to load
};

const handleFileUploadedLocal = async (
  bookId,
  originalFileName,
  targetName,
  index,
) => {
  //console.log("called handlefileupload");
  images.value = await handleFileUploaded(
    bookId,
    originalFileName,
    targetName,
    index,
  );
};

const createSelectedImagesOptions = async (images, coversOptions) => {
  for (const image of images) {
    const matchingOption = coversOptions.value.find(
      (option) => option.value === image.id,
    );
    selectedImageOptions.value.push(matchingOption || null);
  }

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
        bibliografiaStore.bibliografia[bookIndexInBibliografia].images = images;
        // now I update the whole local storage to avoid error
        localStorage.setItem(
          "bibliografia",
          JSON.stringify(bibliografiaStore.bibliografia),
        );
      }

      // Call the function to update the timestamp locally
      // to communicate teh last change on firebase
      await updateTimestamp(timestamp);
    } catch (error) {
      console.error("Error saving detail:", error);
    }
  }
};
const removeEdizione = async (index) => {
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
      bibliografiaStore.bibliografia[bookIndexInBibliografia].edizioni =
        edizioni.value;
      // now I update the whole local storage to avoid error
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(bibliografiaStore.bibliografia),
      );
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
    confirmRemoveEdizione.value = false;
  } catch (error) {
    console.error("Error removing edizione ", error);
    confirmRemoveEdizione.value = false;
  }
};

const removeImage = async (index) => {
  try {
    if (index < 0 || index >= images.value.length) {
      return;
    }
    images.value.splice(index, 1);
    const bookRef = doc(db, "Bibliografia", bookId);
    await updateDoc(bookRef, {
      images: images.value, // Replace the edizioni field with the new value
    });
    confirmRemoveImage.value = false;
  } catch (error) {
    confirmRemoveImage.value = false;
    console.error("Error removing edizione ", error);
  }
};
const addImage = async (idValue) => {
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

      bibliografiaStore.bibliografia[bookIndexInBibliografia].images =
        images.value;
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(bibliografiaStore.bibliografia),
      );
    }
  } catch (error) {
    console.error("Error adding new image:", error);
  } finally {
    confirmAddCover.value = false;
  }
};
const addEdizione = async () => {
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
        bibliografiaStore.bibliografia[bookIndexInBibliografia].edizioni =
          edizioni;
        // now I update the whole local storage to avoid error
        localStorage.setItem(
          "bibliografia",
          JSON.stringify(bibliografiaStore.bibliografia),
        );
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
    confirmAddEdizione.value = false;
  } catch (error) {
    confirmAddEdizione.value = false;
    console.error("Error adding new edizione:", error);
  }
};
const calculateImagesPerSlide = () => {
  const screenWidth = $q.screen.width;
  if (screenWidth >= 1200) {
    return 4;
  } else if (screenWidth >= 992) {
    return 3;
  } else if (screenWidth >= 768) {
    return 2;
  } else {
    return 1;
  }
};
const imagesPerSlide = ref(calculateImagesPerSlide());
const numberOfCarouselSlide = ref(
  Math.ceil(images.value.length / imagesPerSlide.value),
);

const chunkArray = (array, size) => {
  const result = [];
  //console.log("enteryng chunk", array);
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  //console.log("result", result);
  return result;
};
// Function to initialize dialog array
const initializeDialogs = (passedBatches) => {
  dialogs.value = passedBatches.map((batch) => batch.map(() => false));
};

const dialogs = ref([]);
const findCoverType = (id, coverOptions) => {
  const cover = coverOptions.find((option) => option.value === id);
  return cover ? cover.label : null;
};
const imageBatches = computed(() => {
  const coverOptions = coversOptions.value; // Assuming CoversOptions is reactive
  const imagesWithCoverType = images.value.map((image) => ({
    ...image,
    coverType: findCoverType(image.id, coverOptions),
  }));

  const batches = chunkArray(imagesWithCoverType, imagesPerSlide.value);
  // Initialize the dialog array based on the new batches
  initializeDialogs(batches);
  return batches;
});
// Function to initialize dialog array

// Function to initialize dialog array

const showImageFullscreen = (outerIndex, innerIndex) => {
  dialogs.value[outerIndex][innerIndex] = true;
};
const closeDialog = (outerIndex, innerIndex) => {
  dialogs.value[outerIndex][innerIndex] = false;
};
watch(
  () => $q.screen.width,
  (newWidth) => {
    imagesPerSlide.value = calculateImagesPerSlide();
    numberOfCarouselSlide.value = Math.ceil(
      images.value.lenght / imagesPerSlide.value,
    );
  },
);
</script>

<style lang="sass" scoped></style>
