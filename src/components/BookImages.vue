<template>
  <div style="position: relative">
    <div v-if="images.length === 0" class="placeholder">
      Nessuna immagine disponibile
    </div>
    <div v-if="images.length > 0" class="q-mt-md" style="margin-top: 0">
      <q-carousel
        v-model="carouselSlide"
        v-model:fullscreen="fullscreen"
        swipeable
        animated
        :height="carouselHeight"
        arrows
        thumbnails
        transition-prev="slide-right"
        transition-next="slide-left"
        infinite
      >
        <q-carousel-slide
          v-for="(image, index) in images"
          :key="index"
          :name="index"
          :img-src="
            fullscreen ? getFullScreenImageUrl(image) : getImageSource(image)
          "
          :style="{ background: 'none' }"
        >
          <div
            class="column items-center relative-position"
            style="height: 100%"
          >
            <!-- IMAGE -->
            <div
              class="full-width flex flex-center"
              :style="{
                height: slideImageHeight,
                position: 'relative',
                maxWidth: fullscreen ? '60vw' : 'none',
              }"
            >
              <q-img
                :src="
                  fullscreen
                    ? getFullScreenImageUrl(image)
                    : getImageSource(image)
                "
                fit="contain"
                :style="{ maxHeight: fullscreen ? '80vh' : '250px' }"
                @error="(event) => handleImageError(event, index)"
                @click="showImageFullscreen(index)"
              />

              <!-- Image source info -->
              <div
                v-if="!fullscreen"
                class="text-center text-caption q-mt-xs"
                style="font-size: 10px; color: gray"
              >
                {{
                  image.id === "placeholder" || !image.id
                    ? "placeholder"
                    : image.id + ".jpg"
                }}
              </div>

              <!-- ✅ OVERLAY CAPTION -->
              <div
                v-if="!fullscreen"
                class="absolute-bottom q-pa-none"
                :style="{
                  background: overlayBackground,
                  width: 'fit-content',
                  margin: '0 auto',
                  border: $q.dark.isActive
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                }"
              >
                <template v-if="isFieldEditable">
                  <q-select
                    v-model="image.coverTypeId"
                    :options="coverOptionsLocalized"
                    @focus="previousCoverTypeId = image.coverTypeId"
                    @update:model-value="
                      handleCoverChange($event, index, previousCoverTypeId)
                    "
                    size="xs"
                    dense
                    emit-value
                    map-options
                    option-label="label"
                    option-value="value"
                    class="q-pl-sm q-pr-sm q-pt-xs q-pb-xs"
                  />
                </template>
                <template v-else>
                  <div
                    class="text-center text-caption q-pl-sm q-pr-sm q-pt-xs q-pb-xs"
                  >
                    {{ getCoverTypeLabel(image.coverTypeId) }}
                  </div>
                </template>
              </div>
            </div>

            <!-- BUTTONS (remain outside overlay) -->
            <div
              v-if="isFieldEditable && !fullscreen"
              class="full-width row justify-center q-gutter-sm q-mt-xs"
            >
              <q-btn
                round
                size="md"
                icon="delete"
                color="negative"
                @click.stop="confirmDelete(index)"
              />
              <q-btn
                round
                size="md"
                icon="file_upload"
                color="primary"
                @click.stop="onReplaceImageFromFile(index)"
              />
              <q-btn
                round
                size="md"
                icon="photo_camera"
                color="secondary"
                @click.stop="onReplaceImageFromCamera(index)"
              />
            </div>
          </div>
        </q-carousel-slide>
      </q-carousel>
    </div>

    <div v-show="isFieldEditable && !fullscreen" class="q-mt-md q-gutter-sm">
      <q-btn
        v-if="showUndo"
        color="secondary"
        icon="undo"
        label="Annulla ultima cancellazione"
        @click="undoLastDelete"
      />

      <q-btn-dropdown
        icon="add"
        color="primary"
        label="Aggiungi immagine"
        :disable="isUploading"
      >
        <q-list>
          <q-item
            clickable
            v-ripple
            @click="addImageWithSource('file')"
            :disable="isUploading"
          >
            <q-item-section>Da file</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            @click="addImageWithSource('camera')"
            :disable="isUploading"
          >
            <q-item-section>Fotocamera</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>

    <q-dialog v-model="showCropperDialog" persistent maximized>
      <q-card style="height: 90vh; width: 95vw">
        <q-card-section>
          <div class="text-h6">Ritaglia la copertina</div>
        </q-card-section>
        <q-card-section style="height: 70vh">
          <Cropper
            v-if="cropperImage"
            :src="cropperImage"
            :stencil-props="{ aspectRatio: 0, movable: true, resizable: true }"
            :auto-zoom="true"
            :transitions="true"
            class="cropper"
            @change="onCropChange"
            ref="cropperRef"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Annulla"
            @click="cancelCrop"
            :disable="isUploading"
          />
          <q-btn
            flat
            label="Salva"
            color="primary"
            @click="saveCroppedImage"
            :disable="isUploading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="confirmDialogVisible">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="negative" size="2em" />
          <span class="q-ml-sm">{{ $t("bookImages.confirmDeleteImage") }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.cancel')"
            color="primary"
            v-close-popup
          />
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

    <div v-if="showError" class="q-notification">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  unref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import { fireStoreUrl, fireStoreTmblUrl } from "src/boot/firebase";
import { convertAndUploadImage, addImage, deleteImage } from "utils/imageUtils";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { useUndoStore } from "stores/undoStore";
import { storeToRefs } from "pinia";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useCoversStore } from "stores/coversStore";
import placeholderImage from "assets/placeholder.jpg";
import { updateDocInCollection } from "utils/firebaseDatabaseUtils";
import { showNotifyPositive, showNotifyNegative } from "src/utils/notify";
import { useI18n } from "vue-i18n";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { ref as vueRef } from "vue";
import { useQuasar } from "quasar";

const { t, locale } = useI18n();
const $q = useQuasar();
const props = defineProps({
  bookId: { type: String, required: true },
});
const undoStore = useUndoStore();
const fullscreen = ref(false);
const confirmDialogVisible = ref(false);
const tempImageIndex = ref(null);
const carouselSlide = ref(0);
let previousCoverTypeId = "";
let preservedSlideIndex = -1;

const userStore = useUserStore();
const isFieldEditable = computed(() => userStore.hasPermission("manage_books"));

const coversStore = useCoversStore();
const coverOptions = coversStore.covers;
const coverOptionsLocalized = computed(() => {
  const lang = locale.value;
  return coverOptions.map((opt) => ({
    ...opt,
    label: lang === "it-IT" ? opt.label_it : opt.label_en,
  }));
});

const bibliografiaStore = useBibliografiaStore();
const biblio = computed(() => unref(bibliografiaStore.bibliografia));
const book = computed(() => biblio.value.find((b) => b.id === props.bookId));
const images = computed(() => book.value?.images || []);

const overlayBackground = computed(() => {
  return $q.dark.isActive ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)";
});

const getCoverTypeLabel = (id) => {
  const option = coverOptionsLocalized.value.find((opt) => opt.value === id);
  return option ? option.label : "";
};

const carouselHeight = computed(() =>
  fullscreen.value ? "100vh" : isFieldEditable.value ? "400px" : "350px",
);
const slideImageHeight = computed(() => (fullscreen.value ? "80vh" : "250px"));

const loadedImages = ref(new Set());
const allImagesLoaded = computed(() => {
  return images.value && loadedImages.value.size >= images.value.length;
});

const onImageLoad = async (index) => {
  loadedImages.value.add(index);
};

watch(
  () => images.value,
  (newImages, oldImages) => {
    loadedImages.value.clear();

    // If we have a preserved slide index, restore it
    if (preservedSlideIndex >= 0 && preservedSlideIndex < newImages.length) {
      carouselSlide.value = preservedSlideIndex;
      preservedSlideIndex = -1;
      return;
    }

    // Only reset to first slide if we're switching to a book with no images or different number of images
    // Don't reset if just updating existing images (upload, cover type change, etc.)
    if (
      !oldImages ||
      newImages.length === 0 ||
      newImages.length !== oldImages?.length
    ) {
      carouselSlide.value = 0;
    }
  },
  { deep: true },
);

const getImageSource = (image) => {
  const imageName =
    !image?.id || image.id === "placeholder"
      ? "placeholder.jpg"
      : image.id + ".jpg";
  try {
    if (imageName === "placeholder.jpg") return placeholderImage;
    return `${fireStoreTmblUrl}${encodeURIComponent(imageName)}?alt=media`;
  } catch {
    return placeholderImage;
  }
};

const getFullScreenImageUrl = (image) => {
  const imageName =
    !image?.id || image.id === "placeholder"
      ? "placeholder.jpg"
      : image.id + ".jpg";
  try {
    if (imageName === "placeholder.jpg") return placeholderImage;
    return `${fireStoreUrl}${encodeURIComponent(imageName)}?alt=media`;
  } catch {
    return placeholderImage;
  }
};

const handleImageError = (event, index) => {
  event.target.src = placeholderImage;
  onImageLoad(index);
};

const showImageFullscreen = (imageIndex) => {
  if (fullscreen.value) {
    fullscreen.value = false;
  } else {
    if (imageIndex >= 0 && imageIndex < images.value.length) {
      carouselSlide.value = imageIndex;
      fullscreen.value = true;
    }
  }
};

const handleCoverChange = async (coverTypeId, imageIndex, lastCoverType) => {
  if (!coverTypeId || imageIndex === undefined) return;

  // Preserve current slide position during cover type change
  preservedSlideIndex = carouselSlide.value;

  const isCoverTypeUsed = images.value.some(
    (img, i) => img.coverTypeId === coverTypeId && i !== imageIndex,
  );
  if (isCoverTypeUsed) {
    showNotifyNegative(
      t("bookImages.thisCoverTypeIsAlreadyUsedByAnotherImage"),
    );
    const updatedImages = [...images.value];
    updatedImages[imageIndex].coverTypeId = lastCoverType;
    const bibliografia = unref(bibliografiaStore.bibliografia);
    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });
    return;
  }

  try {
    const updatedImages = images.value.map((img, idx) =>
      idx === imageIndex ? { ...img, coverTypeId } : img,
    );
    const updatedBook = { ...book.value, images: updatedImages };
    await updateDocInCollection("Bibliografia", props.bookId, updatedBook, {
      includeTimestamp: true,
    });
    const bibliografia = unref(bibliografiaStore.bibliografia);
    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });
  } catch (error) {
    // console.error("Error updating cover type:", error);
  }
};

const confirmDelete = (index) => {
  tempImageIndex.value = index;
  confirmDialogVisible.value = true;
};

const deleteImageConfirmed = async () => {
  const imageIndex = tempImageIndex.value;
  if (imageIndex === null || imageIndex === undefined) return;

  try {
    if (images.value.length <= 1)
      throw new Error("Cannot delete the last image");
    await deleteImage(props.bookId, imageIndex, t);

    const bibliografia = unref(bibliografiaStore.bibliografia);
    const updatedImages = images.value.filter((_, idx) => idx !== imageIndex);
    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });

    carouselSlide.value = Math.max(0, updatedImages.length - 1);

    confirmDialogVisible.value = false;
  } catch (error) {
    // console.error("Error deleting image:", error);
    showNotifyNegative(
      t("bookImages.failedToDeleteImage") + ": " + error.message,
    );
  }
};

async function addImageWithSource(source) {
  if (isUploading.value) return;

  const currentImageCount = images.value.length;

  try {
    isUploading.value = true;
    // Create empty image first
    const updatedImages = await addImage(props.bookId);
    // Wait for the store to update with the new image
    await nextTick();
    const newIndex = images.value.length - 1;
    // Scroll to the newly added image
    carouselSlide.value = newIndex;

    if (source === "file") {
      const success = await onReplaceImageFromFile(newIndex);
      if (!success) {
        // If file upload was cancelled or failed, remove the empty image
        await removeEmptyImage(newIndex);
      }
    } else if (source === "camera") {
      const success = await onReplaceImageFromCamera(newIndex);
      if (!success) {
        // If camera upload was cancelled or failed, remove the empty image
        await removeEmptyImage(newIndex);
      }
    }
  } catch (e) {
    // console.error("Errore addImageWithSource:", e);
    // If there was an error creating the image, try to clean up
    if (images.value.length > currentImageCount) {
      await removeEmptyImage(images.value.length - 1);
    }
  } finally {
    isUploading.value = false;
  }
}

onMounted(async () => {
  if (
    isFieldEditable.value &&
    book.value &&
    !book.value.deleted &&
    images.value.length === 0
  ) {
    try {
      await addImage(props.bookId);
    } catch (error) {
      // console.error(error);
    }
  }
});

const showUndo = ref(false);
const showError = ref(false);
const errorMessage = ref("");

const showCropperDialog = vueRef(false);
const cropperImage = vueRef(null);
const cropperResult = vueRef(null);
const cropperRef = vueRef(null);
const replaceTargetIndex = vueRef(null);
const isUploading = ref(false);

async function onReplaceImageFromCamera(index) {
  if (isUploading.value) return false;

  // Preserve current slide position during camera operation
  preservedSlideIndex = carouselSlide.value;

  try {
    isUploading.value = true;
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    replaceTargetIndex.value = index;
    cropperImage.value = image.dataUrl;
    showCropperDialog.value = true;

    // Wait for the cropper dialog to be resolved
    return new Promise((resolve) => {
      const unwatch = watch(showCropperDialog, (newValue) => {
        if (!newValue) {
          // Dialog closed - check if we have a result (successful crop) or not
          unwatch();
          resolve(cropperResult.value !== null);
        }
      });
    });
  } catch (e) {
    if (e.message && e.message.includes("permission")) {
      showNotifyNegative(t("bookImages.cameraPermissionDenied"));
    }
    return false;
  } finally {
    isUploading.value = false;
  }
}

async function onReplaceImageFromFile(index) {
  if (isUploading.value) return false;

  // Preserve current slide position during upload
  preservedSlideIndex = carouselSlide.value;

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        resolve(false);
        return;
      }

      try {
        isUploading.value = true;
        const newImageArray = await convertAndUploadImage(
          file,
          props.bookId,
          index,
        );
        const bibliografia = unref(bibliografiaStore.bibliografia);
        bibliografiaStore.$patch({
          bibliografia: bibliografia.map((b) =>
            b.id === props.bookId ? { ...b, images: newImageArray } : b,
          ),
        });
        showNotifyPositive(t("bookImages.imageUploadedSuccessfully"));
        resolve(true);
      } catch (error) {
        // console.error("Error replacing image from file:", error);
        showNotifyNegative(t("bookImages.uploadFailed") + ": " + error.message);
        resolve(false);
      } finally {
        input.value = "";
        isUploading.value = false;
      }
    };
    input.click();
  });
}

async function cancelCrop() {
  if (isUploading.value) return;

  // If cancelling cropper, remove the empty image that was created
  if (replaceTargetIndex.value !== null) {
    await removeEmptyImage(replaceTargetIndex.value);
    replaceTargetIndex.value = null;
  }

  showCropperDialog.value = false;
  cropperImage.value = null;
  cropperResult.value = null;
}
function onCropChange({ canvas }) {
  cropperResult.value = canvas ? canvas.toDataURL("image/jpeg", 0.9) : null;
}

async function removeEmptyImage(index) {
  try {
    const updatedImages = images.value.filter((_, idx) => idx !== index);
    const updatedBook = { ...book.value, images: updatedImages };
    await updateDocInCollection("Bibliografia", props.bookId, updatedBook, {
      includeTimestamp: true,
    });
    const bibliografia = unref(bibliografiaStore.bibliografia);
    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: updatedImages } : b,
      ),
    });
  } catch (error) {
    console.error("Error removing empty image:", error);
  }
}

async function saveCroppedImage() {
  if (
    !cropperResult.value ||
    replaceTargetIndex.value === null ||
    isUploading.value
  )
    return;

  // Preserve current slide position during cropped image save
  preservedSlideIndex = carouselSlide.value;

  try {
    isUploading.value = true;
    const res = await fetch(cropperResult.value);
    const blob = await res.blob();
    const newImageArray = await convertAndUploadImage(
      blob,
      props.bookId,
      replaceTargetIndex.value,
    );
    const bibliografia = unref(bibliografiaStore.bibliografia);
    bibliografiaStore.$patch({
      bibliografia: bibliografia.map((b) =>
        b.id === props.bookId ? { ...b, images: newImageArray } : b,
      ),
    });
    showNotifyPositive(t("bookImages.imageUploadedSuccessfully"));
  } catch (e) {
    // console.error("Error saving cropped image:", e);
    showNotifyNegative("Errore salvataggio immagine");
  } finally {
    // Clear cropper state
    cropperResult.value = null;
    showCropperDialog.value = false;
    replaceTargetIndex.value = null;
    cropperImage.value = null;
    isUploading.value = false;
  }
}
</script>
