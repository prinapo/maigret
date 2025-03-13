<template>
  <div class="shadow-2 rounded-borders" style="position: relative">
    <q-virtual-scroll
      :items="images"
      virtual-scroll-horizontal
      :virtual-scroll-item-size="itemSize"
      :virtual-scroll-slice-size="sliceSize"
      class="q-pa-md"
      style="min-height: 250px"
    >
      <template v-slot="{ item: image, index: innerIndex }">
        <div
          :key="innerIndex"
          class="column items-center q-mx-sm relative-position"
          style="width: 250px; height: 100%"
        >
          <!-- Trash icon for admin users -->
          <q-icon
            v-if="adminMode"
            name="delete"
            class="delete-icon"
            color="red"
            size="md"
            @click="confirmDelete(innerIndex)"
          />
          <!-- Wrapper per uniformare la dimensione delle immagini -->
          <div class="full-width flex flex-center" style="height: 250px">
            <q-img
              :src="getImageSource(image.name)"
              @error="handleImageError"
              fit="contain"
              no-spinner
              class="full-width"
              style="height: 100%; min-height: 250px"
              @click="showImageFullscreen(innerIndex)"
            >
            </q-img>
            <div
              v-if="!adminMode"
              class="absolute-bottom bg-dark text-white text-center q-pa-xs"
              style="
                width: 100%;
                height: auto;
                min-height: 50px;
                opacity: 0.7;
                white-space: normal;
                word-break: break-word;
              "
            >
              {{
                coverOptions.find((c) => c.id === image.coverTypeId)?.label ||
                "Cover Type"
              }}
            </div>
          </div>

          <q-select
            v-if="adminMode"
            v-model="image.coverId"
            :options="coverOptions"
            option-value="id"
            option-label="label"
            :label="
              coverOptions.find((c) => c.id === image.coverTypeId)?.label ||
              'Cover Type'
            "
            @update:model-value="handleCoverChange($event.id, innerIndex)"
            :disable="!adminMode"
            dense
            dark
            class="full-width"
            :borderless="!adminMode"
            :hide-dropdown-icon="!adminMode"
          />

          <q-dialog
            v-model="dialogs[innerIndex]"
            full-screen
            transition-show="fade"
            transition-hide="fade"
          >
            <q-card class="full-width full-height">
              <q-img
                :src="getFullScreenImageUrl(image.name)"
                fit="contain"
                class="full-width full-height"
                @click="closeDialog(innerIndex)"
              />
            </q-card>
          </q-dialog>

          <FirebaseUploader
            v-if="adminMode"
            class="full-width q-mt-sm"
            :blocking="true"
            extention=""
            directory="images"
            :bookId="bookId"
            :imageUuid="image.id"
            :imageIndex="innerIndex"
            @uploaded="
              handleFileUploadedLocal(
                bookId,
                $event.originalFile.name,
                image.id,
                innerIndex,
              )
            "
            :fileInputRef="fileInputRef"
            label="Cambia immagine"
            color="blue"
            flat
            bordered
          />
        </div>
      </template>
    </q-virtual-scroll>
    <q-icon
      v-if="adminMode"
      name="add_circle"
      size="48px"
      color="primary"
      class="cursor-pointer absolute-right"
      style="top: 50%; transform: translateY(100%); right: 30px"
      @click="addNewImage"
    />

    <!-- Confirmation dialog -->
    <q-dialog v-model="confirmDialogVisible">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="red" size="2em" />
          <span class="q-ml-sm">Sei sicuro di eliminare l'immagine?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annulla" color="primary" v-close-popup />
          <q-btn
            flat
            label="Elimina"
            color="negative"
            @click="deleteImageConfirmed"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, toRefs } from "vue";
import { fireStoreUrl, fireStoreTmblUrl } from "../firebase/firebaseInit"; // Assuming you have Firebase storage initialized
import FirebaseUploader from "../firebase/FirebaseUploader.js";
import { useAuth } from "../composable/auth"; // Assuming you have an auth composable
import {
  addImage,
  deleteImage,
  saveImageDetail,
  handleFileUploaded,
  fetchImages,
} from "../utils/imageUtils"; // Import addImage function
import { useCoversStore } from "../store/database"; // Import covers store
import placeholderImage from "../assets/placeholder.jpg";
import { useUserSettingsStore } from "src/store/userSettings";
import { storeToRefs } from "pinia";

const userSettings = useUserSettingsStore();
const { adminMode } = storeToRefs(userSettings);

const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
});
const { bookId } = toRefs(props);

const images = ref([]);
const dialogs = ref([]);
const fileInputRef = ref(null); // Define fileInputRef
const confirmDialogVisible = ref(false); // Define the visibility of the confirmation dialog
const tempImageIndex = ref(null); // Temporary variable to store the index of the image to be deleted
const itemSize = 270; // Size of each item in the virtual scroll
const sliceSize = 10; // Number of items to render in each slice
const { checkAuthState } = useAuth();
const coversStore = useCoversStore(); // Use covers store
const coverOptions = computed(() => coversStore.covers); // Get cover options from covers store

const loadImages = async () => {
  images.value = await fetchImages(bookId.value);
};
const getImageSource = (imageName) => {
  try {
    if (!imageName || imageName === "placeholder.jpg") {
      return placeholderImage;
    }
    return `${fireStoreTmblUrl}${encodeURIComponent(imageName)}?alt=media`;
  } catch (error) {
    console.error("Image source error:", error);
    return placeholderImage;
  }
};
const getFullScreenImageUrl = (imageName) => {
  try {
    if (!imageName || imageName === "placeholder.jpg") {
      return placeholderImage;
    }
    return `${fireStoreUrl}${encodeURIComponent(imageName)}?alt=media`;
  } catch (error) {
    console.error("Image source error:", error);
    return placeholderImage;
  }
};

const handleImageError = (event) => {
  event.target.src = placeholderImage; // Fallback to the default image when the image fails to load
};

const showImageFullscreen = (imageIndex) => {
  dialogs.value[imageIndex] = true;
};

const closeDialog = (imageIndex) => {
  dialogs.value[imageIndex] = false;
};

const handleFileUploadedLocal = async (
  bookId,
  originalFileName,
  imageUuid,
  imageIndex,
) => {
  // Call the handleFileUploaded function from handleFileUpload.js
  const updatedImages = await handleFileUploaded(
    bookId,
    originalFileName,
    imageUuid,
    imageIndex,
  );
  images.value = updatedImages; // Update the local images array with the updated images
};

const handleCoverChange = async (coverTypeId, imageIndex) => {
  try {
    await saveImageDetail(bookId.value, coverTypeId, imageIndex);
    images.value[imageIndex].coverTypeId = coverTypeId;
  } catch (error) {
    console.error("Error updating cover:", error);
  }
};

const confirmDelete = (imageIndex) => {
  tempImageIndex.value = imageIndex;
  confirmDialogVisible.value = true;
};

const deleteImageConfirmed = async () => {
  try {
    const imageIndex = tempImageIndex.value;
    await deleteImage(bookId.value, imageIndex); // Use deleteImage function from deleteImageUtils.js
    // Remove the image from the local state
    images.value = images.value.filter((_, index) => index !== imageIndex);
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};

const addNewImage = async () => {
  try {
    const updatedImages = await addImage(bookId.value, "defaultIdValue"); // Call addImage function with bookId and a default id value
    images.value = updatedImages; // Update the local images array with the updated images
  } catch (error) {
    console.error("Error adding image:", error);
  }
};

onMounted(() => {
  checkAuthState();
  loadImages();
});
</script>

<style scoped>
.img-thumbnail {
  max-width: 100%;
  height: auto;
}
.dark-mode {
  background-color: #333;
  color: #fff;
}
</style>
