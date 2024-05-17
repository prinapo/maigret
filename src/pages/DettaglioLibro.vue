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
          <q-card-section id="card section 1">
            <div class="row q-gutter-sm">
              <q-select
                color="main"
                v-model="selectedOptions[outerIndex]"
                :options="coversOptions"
                :label="image.label"
                :readonly="!isAdmin"
                :hide-dropdown-icon="!isAdmin"
                :borderless="!isAdmin"
                dense
                @update:model-value="
                  handleCoverModelValueUpdate(outerIndex, $event)
                "
              />
              <q-item-section
                id="save and upload button"
                top
                side
                v-if="isAdmin"
              >
                <div class="row q-gutter-xs" v-if="isAdmin">
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
                        image.id,
                        selectedOptions[outerIndex].value,
                        outerIndex,
                      )
                    "
                    color="secondary"
                  />
                  <q-btn
                    size="12px"
                    flat
                    dense
                    round
                    icon="upload"
                    @click="openUploadImage(outerIndex)"
                    color="secondary"
                  />
                </div>
              </q-item-section>
            </div>
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
                      @click="addImage()"
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
                    {{ imageToRemoveIndex }}
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
            :imageUuid="images[uploadImageIndex].id"
            :imageIndex="uploadImageIndex"
            @uploaded="
              handleFileUploaded(
                bookId,
                $event.originalFile.name,
                images[uploadImageIndex].id,
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
              v-for="(edizione, index) in edizioni"
              :key="index"
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
                          index,
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
                        saveEdizioneDetail('anno', index, edizione.anno, bookId)
                      "
                      v-if="isAdmin"
                    />
                  </div>
                </div>
                <div>
                  <!-- Your content here -->
                  admn and colelctor {{ isAdmin }} {{ isCollector }}
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
const selectedOptions = ref([]);
const coversOptions = ref([]);
const imageToRemoveIndex = ref(null);
const selectedImageTypeId = ref(null);

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

  if (!images.value || images.value.length === 0) {
    await addImage(); // Call the addImage function to add a default image
  }
  images.value.forEach((image) => {
    console.log("CoverOptios.value.value", coversOptions.value[0].value);
    console.log("image.id", image.id);
    console.log("image.name", image.name);

    const matchingOption = coversOptions.value.find(
      (option) => option.value === image.id,
    );
    console.log("matchingOption", matchingOption);
    selectedOptions.value.push(matchingOption || null);
    console.log("selectedOptions.value", selectedOptions.value);
  });
  //console.log("image", images.value);

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
const images = ref([]);
let fetchedBook = [];
let isAdmin = false;
let isCollector = false;
// tool for long press detection

const handleCoverModelValueUpdate = (outerIndex, newValue) => {
  console.log("handleModelValueUpdate", outerIndex, newValue);
  selectedImageTypeId.value = newValue;
  // You can add additional logic here if needed
};
const removeEdizione = async (index) => {
  try {
    if (index < 0 || index >= edizioni.value.length) {
      return;
    }
    edizioni.value.splice(index, 1);
    const bookRef = doc(db, "Bibliografia", bookId);
    await updateDoc(bookRef, {
      edizioni: edizioni.value, // Replace the edizioni field with the new value
    });
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
const addImage = async () => {
  console.log("add edizione called");
  try {
    const bookRef = doc(db, "Bibliografia", bookId);
    const bookDocSnap = await getDoc(bookRef);
    const shortUuid = shortUuidGenerator.new();

    if (bookDocSnap.exists()) {
      let existingImages = bookDocSnap.data().images || [];
      const defaultImage = {
        id: shortUuid,
        name: "",
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
      const timestamp = new Date().valueOf();
      await updateTimestamp(timestamp);
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
  const selectedOption = collaneOptions.value.find(
    (option) => option.value === fetchedBook.collana,
  );
  const result = selectedOption ? selectedOption.label : null;

  console.log("current collana:", result);
  return result;
});
const currentEditore = computed(() => {
  //console.log("fetched editore", fetchedBook.editore);
  const selectedOption = editoriOptions.value.find(
    (option) => option.value === fetchedBook.editore,
  );
  const result = selectedOption ? selectedOption.label : null;

  console.log("current editore:", result);
  return result;
});
</script>

<style lang="sass" scoped></style>
