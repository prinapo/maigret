<template>
  <div class="bg-primary">
    <div
      id="images"
      class="row items-start q-mt-md q-px-md q-col-gutter-md bg-primary"
    >
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

          <q-card-section id="image-section">
            <q-img
              class="col"
              :src="getImageSource(image.name)"
              style="max-width: 250px; max-height: 300px"
              fit="contain"
              @error="handleImageError"
              @dblclick="isAdmin ? () => openUploadImage(outerIndex) : null"
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
                  />
                  <q-btn
                    flat
                    label="Conferma"
                    color="negative"
                    @click="addImage('')"
                    v-close-popup
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
                  style="max-width: 100px"
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
import { db, fireStoreUrl } from "../firebase/firebaseInit"; // Assuming you have Firebase storage initialized
import { onMounted, ref } from "vue";
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
const { isLoggedIn, userId, checkAuthState } = useAuth();
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
const slide = ref(1);
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

const uploadImageIndex = ref(null);
const showUploaderPopup = ref(false);
const fileInputRef = ref(null);
const confirmAddEdizione = ref(false);
const confirmRemoveEdizione = ref(false);
const confirmDeleteBook = ref(false);
const confirmAddCover = ref(false);
const confirmRemoveImage = ref(false);
const detailOriginalValue = ref();

const images = ref([]);
let isAdmin = false;
let isCollector = false;
// tool for long press detection

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
  images.value = await handleFileUploaded(
    bookId,
    originalFileName,
    targetName,
    index,
  );
  showUploaderPopup.value = false;
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
const openUploadImage = (index) => {
  uploadImageIndex.value = index;

  showUploaderPopup.value = true; // Show the uploader popup when an image is clicked
};
</script>

<style lang="sass" scoped></style>
