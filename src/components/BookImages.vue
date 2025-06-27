<template>
  <div class="bg-dark shadow-2 rounded-borders" style="position: relative">
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
            v-if="isFieldEditable"
            name="delete"
            class="delete-icon"
            color="negative"
            size="md"
            @click="confirmDelete(innerIndex)"
          />
          <!-- Wrapper per uniformare la dimensione delle immagini -->
          <div class="full-width flex flex-center" style="height: 250px">
            <q-img
              :key="image.name"
              :src="getImageSource(image.name)"
              @error="handleImageError"
              fit="contain"
              no-spinner
              class="full-width"
              style="height: 100%; min-height: 250px"
              @click="showImageFullscreen(innerIndex)"
            >
            </q-img>
          </div>

          <q-select
            v-model="image.coverTypeId"
            :options="coverOptions"
            :label="isFieldEditable ? $t('bookImages.coverType') : ''"
            @focus="previousCoverTypeId = image.coverTypeId"
            @update:model-value="
              handleCoverChange($event, innerIndex, previousCoverTypeId)
            "
            :disable="!isFieldEditable"
            dense
            emit-value
            map-options
            fill-input
            class="full-width"
            :borderless="!isFieldEditable"
            :hide-dropdown-icon="!isFieldEditable"
            :readonly="!isFieldEditable"
            :style="
              !isFieldEditable
                ? 'pointer-events: none; background: transparent;'
                : ''
            "
          >
          </q-select>

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

          <!-- Only show the uploader for superadmin users -->
          <q-uploader
            v-if="isFieldEditable"
            class="full-width q-mt-sm"
            :url="''"
            :hide-upload-btn="true"
            :multiple="false"
            @added="(event) => onFileAdded(event, image.id, innerIndex)"
          />
        </div>
      </template>
    </q-virtual-scroll>
    <q-icon
      v-if="isFieldEditable"
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
          <q-icon name="warning" color="negative" size="2em" />
          <span class="q-ml-sm">{{ $t('bookImages.confirmDeleteImage') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="$t('common.delete')"
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
import { ref, unref, computed } from "vue";
import { fireStoreUrl, fireStoreTmblUrl } from "src/boot/firebase";
import { convertAndUploadImage } from "utils/imageUtils";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { useUndoStore } from "stores/undoStore";
import { storeToRefs } from "pinia";
import { Notify } from "quasar";
import { addImage, deleteImage } from "utils/imageUtils";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useCoversStore } from "stores/coversStore";
import placeholderImage from "assets/placeholder.jpg";
import { syncBook } from "utils/firebaseDatabaseUtils";
const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
});
//console.log("bookId:", props.bookId);
const undoStore = useUndoStore();
const dialogs = ref([]);
const confirmDialogVisible = ref(false);
const tempImageIndex = ref(null);
// const uploadInProgress = ref(false);  // Unused variable, commented out
const defaultBookCoverTypeId = "qNvdwFMLNt2Uz7JjqTjacu";
const emit = defineEmits(["showUndo"]);

// Auth and settings
const userStore = useUserStore();
const { settings } = storeToRefs(userStore);

const isFieldEditable = computed(() => {
  return userStore.hasPermission("manage_books");
});
//console.log("iseditable reactive:", isFieldEditable.value);
// Covers store
const coversStore = useCoversStore();
const coverOptions = coversStore.covers;
const previousCoverTypeId = "";

// Bibliografia store
const bibliografiaStore = useBibliografiaStore();
const biblio = computed(() => unref(bibliografiaStore.bibliografia));
const book = computed(() => biblio.value.find((b) => b.id === props.bookId));
const images = computed(() => book.value?.images || []);
//console.log("images:", images.value);
function restoreDeletedImage() {
  if (!undoStore.undoData || undoStore.undoData.type !== "delete-image") return;

  const { image, index } = undoStore.undoData;

  // Aggiorniamo lo store invece di images.value
  const bibliografia = unref(bibliografiaStore.bibliografia);
  const updatedImages = [...images.value];
  updatedImages.splice(index, 0, image);

  bibliografiaStore.$patch({
    bibliografia: bibliografia.map((b) =>
      b.id === props.bookId ? { ...b, images: updatedImages } : b,
    ),
  });

  undoStore.clearUndo();
}

defineExpose({ restoreDeletedImage });

const auth = useAuthStore();

// State

// Quando un file è stato aggiunto, caricalo su Firebase Storage
const onFileAdded = async (event, imageUuid, innerIndex) => {
  const file = event[0];
  if (file) {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (validTypes.includes(file.type)) {
      try {
        const newImageArray = await convertAndUploadImage(
          file,
          props.bookId,
          innerIndex,
        );

        // Aggiorniamo lo store invece di images.value
        const bibliografia = unref(bibliografiaStore.bibliografia);
        bibliografiaStore.$patch({
          bibliografia: bibliografia.map((b) =>
            b.id === props.bookId ? { ...b, images: newImageArray } : b,
          ),
        });

        Notify.create({
          message: "Image uploaded and database updated successfully",
          type: "positive",
        });
      } catch (error) {
        console.error("Error in image upload and processing:", error);
        Notify.create({
          message: `Upload failed: ${error.message}`,
          type: "negative",
        });
      }
    } else {
      Notify.create({
        message: "Only JPG, JPEG, and PNG files are allowed.",
        type: "negative",
      });
    }
  }
};

// Fixed values for virtual scroll
const itemSize = 250; // Width of each item in pixels
const sliceSize = 4; // Number of items to render at once

// Add fileInputRef
// const fileInputRef = ref(null);  // Unused variable, commented out

// Image handling functions
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
    console.error("Full screen image URL error:", error);
    return placeholderImage;
  }
};

const handleImageError = (event) => {
  event.target.src = placeholderImage;
};

const showImageFullscreen = (imageIndex) => {
  if (imageIndex >= 0 && imageIndex < images.value.length) {
    dialogs.value[imageIndex] = true;
  }
};

const closeDialog = (imageIndex) => {
  if (imageIndex >= 0 && imageIndex < dialogs.value.length) {
    dialogs.value[imageIndex] = false;
  }
};

const handleCoverChange = async (coverTypeId, imageIndex, lastCoverType) => {
  if (!coverTypeId || imageIndex === undefined) {
    Notify.create({
      message: "Missing required parameters for cover type update",
      type: "negative",
    });
    return;
  }

  const isCoverTypeIdUsed = images.value.some(
    (image, index) => image.coverTypeId === coverTypeId && index !== imageIndex,
  );

  if (isCoverTypeIdUsed) {
    Notify.create({
      message: "This cover type is already used by another image",
      type: "negative",
    });
    const updatedImages = [...images.value];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      coverTypeId: lastCoverType,
    };
    const bibliografia = unref(bibliografiaStore.bibliografia);
    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });
    return;
  }

  try {
    const updatedImages = images.value.map((img, index) => {
      if (index === imageIndex) {
        return {
          ...img,
          coverTypeId,
        };
      }
      return img;
    });

    const updatedBook = {
      ...book.value,
      images: updatedImages,
    };

    if (coverTypeId === defaultBookCoverTypeId) {
      const selectedImage = updatedImages[imageIndex];
      if (selectedImage?.name) {
        updatedBook.defaultImageName = selectedImage.name;
      }
    }

    await syncBook({ bookId: props.bookId, book: updatedBook });
    const bibliografia = unref(bibliografiaStore.bibliografia);
    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });
  } catch (error) {
    console.error("Error updating cover type:", error);
    Notify.create({
      message: `Failed to update cover type: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
    const updatedImages = [...images.value];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      coverTypeId: lastCoverType,
    };
    const bibliografia = unref(bibliografiaStore.bibliografia);

    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });
  }
};

const confirmDelete = (index) => {
  tempImageIndex.value = index;
  confirmDialogVisible.value = true;
};
const deleteImageConfirmed = async () => {
  console.log("deleteImageConfirmed called");

  const imageIndex = tempImageIndex.value;

  if (imageIndex === null || imageIndex === undefined) {
    return;
  }

  try {
    console.log("Deleting image at index:", imageIndex);

    if (images.value.length <= 1) {
      throw new Error("Cannot delete the last image");
    }

    await deleteImage(props.bookId, imageIndex, t);

    // Aggiorniamo lo store invece di images.value
    const bibliografia = unref(bibliografiaStore.bibliografia);
    const updatedImages = images.value.filter(
      (_, index) => index !== imageIndex,
    );

    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });

    confirmDialogVisible.value = false;
  } catch (error) {
    console.error("Error deleting image:", error);
    Notify.create({
      message: `Failed to delete image: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
    console.log("Notify.create invoked successfully");
  }
};

const addNewImage = async () => {
  try {
    const updatedImages = await addImage(props.bookId, t);
    if (updatedImages) {
      // Aggiorniamo lo store invece di images.value
      const bibliografia = unref(bibliografiaStore.bibliografia);
      bibliografiaStore.$patch({
        bibliografia: bibliografia.map((b) =>
          b.id === props.bookId ? { ...b, images: updatedImages } : b,
        ),
      });
    }
  } catch (error) {
    console.error("Error adding image:", error);
    Notify.create({
      message: `Failed to add image: ${error.message}`,
      type: "negative",
      timeout: 3000,
    });
  }
};
</script>

<style scoped>
.img-thumbnail {
  max-width: 100%;
  height: auto;
}
</style>
