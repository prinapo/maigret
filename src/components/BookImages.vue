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
                @click.stop="replaceImageFromFile(bookId)"
              />
              <q-btn
                round
                size="md"
                icon="photo_camera"
                color="secondary"
                @click.stop="addImageWithSource('camera')"
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
        ref="imageDropdown"
        icon="add"
        color="primary"
        label="Aggiungi immagine"
        :disable="isUploading"
        auto-close
        @click="resetImageUploadState"
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

    <PerspectiveCropper
      v-model="showCropperDialog"
      :image-src="cropperImage"
      @image-processed="onImageProcessed"
      @cancel="onCropperCancel"
    />

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
import {
  convertAndUploadImage,
  addImage,
  deleteImage,
  replaceImageFromFile,
  takePhotoFromCamera,
} from "utils/imageUtils";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { useUndoStore } from "stores/undoStore";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useCoversStore } from "stores/coversStore";
import placeholderImage from "assets/placeholder.jpg";
import { updateDocInCollection } from "utils/firebaseDatabaseUtils";
import { showNotifyPositive, showNotifyNegative } from "src/utils/notify";
import { useI18n } from "vue-i18n";
import PerspectiveCropper from "src/components/PerspectiveCropper.vue";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { ref as vueRef } from "vue";
import { useQuasar, Platform } from "quasar";

const { t, locale } = useI18n();
const $q = useQuasar();

// Enhanced mobile platform detection
const isMobile = computed(() => {
  return $q.platform.is.mobile || $q.screen.lt.md;
});

const isNativeMobile = computed(() => {
  return Capacitor.isNativePlatform();
});

const isIOS = computed(() => {
  return Capacitor.getPlatform() === "ios";
});

const isAndroid = computed(() => {
  return Capacitor.getPlatform() === "android";
});

// Mobile-specific camera options
const mobileCameraOptions = computed(() => ({
  quality: isIOS.value ? 85 : 90,
  allowEditing: false,
  resultType: CameraResultType.DataUrl,
  source: CameraSource.Camera,
  width: 1920,
  height: 1920,
  correctOrientation: true,
  presentationStyle: isIOS.value ? "popover" : "fullscreen",
}));
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

    // Keep watcher simple - the direct approach handles uploads now

    // Only reset to first slide if we're switching to a book with no images
    // For new image additions, move to the last image instead of resetting to 0
    if (!oldImages || newImages.length === 0) {
      carouselSlide.value = 0;
    } else if (newImages.length !== oldImages?.length) {
      // Check if this is a new image being added (length increased by 1)
      const lengthDifference = newImages.length - (oldImages?.length || 0);
      if (lengthDifference === 1) {
        // New image added - move to the last image
        carouselSlide.value = newImages.length - 1;
      } else if (lengthDifference < 0) {
        // Images were removed - stay at current position or move to last available
        carouselSlide.value = Math.min(
          carouselSlide.value,
          newImages.length - 1,
        );
      } else {
        // Unexpected length change - reset to first
        carouselSlide.value = 0;
      }
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
    console.log("🔀 About to check source type:", source);

    if (source === "file") {
      // Hybrid approach: handle both immediate success and post-timeout success
      console.log("📁 Calling replaceImageFromFile with bookId:", props.bookId);

      // Start the file operation
      const filePromise = replaceImageFromFile(props.bookId);

      // Set up a timeout for the UI (but don't break the file operation)
      const uiTimeout = setTimeout(() => {
        console.log("📁 UI timeout reached, but file operation continues...");
      }, 3500); // Slightly longer than file dialog timeout

      const result = await filePromise;
      clearTimeout(uiTimeout);

      if (result && result.success) {
        // DIRECT APPROACH: Use the returned images array for immediate UI updates
        const targetIndex = Math.max(0, (result.imageCount || 0) - 1);

        console.log(
          "📸 DIRECT UPDATE - Current carousel slide:",
          carouselSlide.value,
          "Target index:",
          targetIndex,
          "of",
          result.imageCount || 0,
          "total images",
        );

        // Move carousel to the newly uploaded image immediately
        carouselSlide.value = targetIndex;

        // Update store directly with the returned images array
        const bibliografiaStore = useBibliografiaStore();
        const { bibliografia } = storeToRefs(bibliografiaStore);
        bibliografiaStore.$patch({
          bibliografia: bibliografia.value.map((b) =>
            b.id === props.bookId ? { ...b, images: result.images } : b,
          ),
        });

        console.log(
          "📸 DIRECT SUCCESS - Carousel updated to:",
          carouselSlide.value,
          "Store updated with",
          result.images.length,
          "images",
        );
      } else {
        console.error("File upload failed:", result?.error || "Unknown error");

        // For timeout, keep dropdown open briefly to allow post-timeout uploads
        if (result?.error === "File dialog timeout") {
          console.log(
            "📁 Timeout occurred, starting post-timeout monitoring...",
          );

          // Monitor for successful uploads for a brief period
          const startTime = Date.now();
          const monitorInterval = setInterval(() => {
            const currentBook = book.value;
            const currentImages = currentBook?.images || [];

            if (currentImages.length > currentImageCount) {
              const latestImage = currentImages[currentImages.length - 1];
              if (
                latestImage &&
                latestImage.id &&
                latestImage.id !== "placeholder"
              ) {
                console.log("📁 SUCCESS: Post-timeout upload detected!");
                console.log(
                  "📁 MONITORING - Before carousel update:",
                  "carouselSlide.value =",
                  carouselSlide.value,
                  "targetIndex =",
                  currentImages.length - 1,
                  "newImages.length =",
                  currentImages.length,
                  "latestImage.id =",
                  latestImage.id,
                );

                // Update carousel with detailed logging
                const targetIndex = currentImages.length - 1;
                carouselSlide.value = targetIndex;

                console.log("📁 MONITORING - After carousel update:");
                console.log("  carouselSlide.value =", carouselSlide.value);
                console.log("  targetIndex =", targetIndex);
                console.log("  Match =", carouselSlide.value === targetIndex);

                // Dropdown will close automatically with auto-close prop

                // Show success notification
                showNotifyPositive(t("bookImages.imageUploadedSuccessfully"));

                clearInterval(monitorInterval);
                return;
              }
            }

            // Stop monitoring after 5 seconds
            if (Date.now() - startTime > 5000) {
              console.log("📁 Post-timeout monitoring ended");
              clearInterval(monitorInterval);
              if (imageDropdown.value) {
                imageDropdown.value.hide();
              }
            }
          }, 200); // Check every 200ms
        } else {
          // Dropdown will close automatically with auto-close prop
        }
      }
    } else if (source === "camera") {
      const result = await takePhotoFromCamera(props.bookId);
      if (result.success) {
        // Show cropper dialog
        replaceTargetIndex.value = images.value.length; // Append to end
        cropperImage.value = result.dataUrl;
        showCropperDialog.value = true;

        // Wait for cropper result
        const cropSuccess = await new Promise((resolve) => {
          const unwatch = watch(showCropperDialog, (newValue) => {
            if (!newValue) {
              unwatch();
              // Check if we have a cropped result
              resolve(cropperResult.value !== null);
            }
          });
        });

        if (cropSuccess) {
          console.log("📸 Processing cropped image...");
          // Process cropped image
          await saveCroppedImage();

          // Dropdown will close automatically with auto-close prop
        } else {
          console.log("📸 Crop cancelled or failed");
          // Dropdown will close automatically with auto-close prop
        }
      } else {
        console.error("Camera failed:", result.error);

        // Show appropriate error message for camera issues
        if (typeof result.error === "string") {
          // Handle legacy string errors
          if (
            result.error.includes("Accesso alla webcam negato") ||
            result.error.includes("webcamAccessDenied")
          ) {
            showNotifyNegative(t("bookImages.webcamAccessDenied"));
          } else if (
            result.error.includes("Nessuna webcam trovata") ||
            result.error.includes("noWebcamFound")
          ) {
            showNotifyNegative(t("bookImages.noWebcamFound"));
          } else if (
            result.error.includes("Foto annullata") ||
            result.error.includes("userCancelledWebcam")
          ) {
            // User cancelled - don't show error, just log
            console.log("📷 User cancelled webcam capture");
          } else {
            showNotifyNegative(`Errore webcam: ${result.error}`);
          }
        } else {
          // Handle i18n key errors
          if (result.error === "webcamAccessDenied") {
            showNotifyNegative(t("bookImages.webcamAccessDenied"));
          } else if (result.error === "noWebcamFound") {
            showNotifyNegative(t("bookImages.noWebcamFound"));
          } else if (result.error === "userCancelledWebcam") {
            // User cancelled - don't show error, just log
            console.log("📷 User cancelled webcam capture");
          } else if (result.error === "webcamError" && result.errorParam) {
            showNotifyNegative(
              t("bookImages.webcamError", { error: result.errorParam }),
            );
          } else {
            showNotifyNegative(`Errore fotocamera: ${result.error}`);
          }
        }

        // Dropdown will close automatically with auto-close prop
      }
    }
  } catch (e) {
    // console.error("Errore addImageWithSource:", e);
  } finally {
    isUploading.value = false;
  }
}

function onCropperCancel() {
  console.log("📸 Cropper cancelled by user");
  console.log("📸 Current showCropperDialog value:", showCropperDialog.value);

  // Set result to indicate cancellation
  cropperResult.value = null;

  // Reset cropper state - only reset what belongs to this component
  showCropperDialog.value = false;
  replaceTargetIndex.value = null;

  console.log("✅ Cropper state reset after cancel");
  console.log("📸 New showCropperDialog value:", showCropperDialog.value);

  // Force update after a small delay
  setTimeout(() => {
    console.log(
      "📸 Checking dialog state after delay:",
      showCropperDialog.value,
    );
  }, 100);
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

// Variables must be declared before using them in watchers
const showCropperDialog = vueRef(false);
const cropperImage = vueRef(null);
const replaceTargetIndex = vueRef(null);
const cropperResult = vueRef(null); // Track cropper operation result
const isUploading = ref(false);
const imageDropdown = ref(null);

// Debug watcher for cropper dialog state (must be after variable declaration)
watch(
  () => showCropperDialog.value,
  (newValue, oldValue) => {
    console.log("📸 showCropperDialog changed:", {
      from: oldValue,
      to: newValue,
      timestamp: new Date().toISOString(),
    });
  },
);

const resetImageUploadState = () => {
  isUploading.value = false;
};

async function cancelCrop() {
  if (isUploading.value) return;

  console.log("📸 Cancelling crop");

  // If cancelling cropper, remove the empty image that was created
  if (replaceTargetIndex.value !== null) {
    console.log("📸 Removing empty image at index:", replaceTargetIndex.value);
    await removeEmptyImage(replaceTargetIndex.value);
    replaceTargetIndex.value = null;
  }

  showCropperDialog.value = false;
  cropperImage.value = null;

  // Close dropdown when cancelling cropper
  await nextTick();
  if (imageDropdown.value) {
    console.log("📸 Hiding dropdown after crop cancel");
    imageDropdown.value.hide();
  }
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
    // Error removing empty image handled silently
  }
}

async function onImageProcessed(processedImageDataUrl) {
  console.log("🎯 === STARTING IMAGE PROCESSING ===");
  console.log("🎯 onImageProcessed called with:", {
    hasDataUrl: !!processedImageDataUrl,
    dataUrlLength: processedImageDataUrl?.length || 0,
    replaceTargetIndex: replaceTargetIndex.value,
    isUploading: isUploading.value,
  });

  // Set result to indicate successful processing
  cropperResult.value = true;
  console.log("🎯 cropperResult set to:", cropperResult.value);

  if (!processedImageDataUrl || replaceTargetIndex.value === null) {
    console.warn("⚠️ onImageProcessed: Invalid parameters, returning early");
    console.log("  - processedImageDataUrl:", !!processedImageDataUrl);
    console.log("  - replaceTargetIndex:", replaceTargetIndex.value);
    return;
  }

  // If isUploading is true, reset it since we're starting a new upload
  if (isUploading.value) {
    console.log(
      "🔄 Resetting isUploading flag from",
      isUploading.value,
      "to false",
    );
    isUploading.value = false;
  }

  // Handle test images the same way as real images (replaceTargetIndex >= current images length or special test value)
  const isTestImage =
    replaceTargetIndex.value >= images.value.length ||
    replaceTargetIndex.value === -999;
  console.log("🧪 Processing image type:", isTestImage ? "test" : "real");
  console.log("🧪 Current images length:", images.value.length);
  console.log("🧪 replaceTargetIndex value:", replaceTargetIndex.value);

  // For test images, save them to database just like real images
  if (isTestImage) {
    console.log("🧪 Test image will be saved to database for testing purposes");
  }

  // Preserve current slide position during processed image save
  preservedSlideIndex = carouselSlide.value;
  console.log("🖼️ Preserving slide position:", preservedSlideIndex);

  try {
    isUploading.value = true;
    console.log("📸 STEP 1: Starting image save process...");

    // Convert data URL to blob
    console.log("📸 STEP 2: Converting data URL to blob...");
    const res = await fetch(processedImageDataUrl);
    const blob = await res.blob();
    console.log(
      "📸 STEP 2: Blob created, size:",
      blob.size,
      "type:",
      blob.type,
    );

    // Use existing upload function
    console.log("📸 STEP 3: Calling convertAndUploadImage...");
    const newImageArray = await convertAndUploadImage(
      blob,
      props.bookId,
      replaceTargetIndex.value,
    );
    console.log(
      "📸 STEP 3: Upload complete, new array length:",
      newImageArray.length,
    );
    console.log("📸 STEP 3: New image array:", newImageArray);

    // Update Firestore - watcher will update store automatically
    console.log("📸 STEP 4: Updating Firestore database...");
    await updateDocInCollection(
      "Bibliografia",
      props.bookId,
      { images: newImageArray },
      { includeTimestamp: true },
    );
    console.log("📸 STEP 4: Database updated successfully");

    showNotifyPositive(t("bookImages.imageUploadedSuccessfully"));
    console.log("📸 STEP 5: Success notification shown");

    // Move carousel to show the new image BEFORE resetting state
    console.log("📸 STEP 6: Moving carousel to new image...");
    console.log("📸 Current carousel slide:", carouselSlide.value);
    console.log("📸 Target index was:", replaceTargetIndex.value);
    console.log("📸 New images length:", newImageArray.length);

    // Calculate the correct index for the new image
    const targetImageIndex = newImageArray.length - 1; // Last image in array
    console.log("📸 Calculated target index:", targetImageIndex);

    // Set carousel to the newly saved image
    carouselSlide.value = targetImageIndex;
    console.log("📸 STEP 6: Carousel moved to slide:", carouselSlide.value);

    // Close cropper dialog and reset state
    console.log("📸 STEP 7: Closing cropper dialog...");
    showCropperDialog.value = false;
    cropperImage.value = null;
    replaceTargetIndex.value = null;
    console.log("📸 STEP 7: Dialog closed and state reset");

    console.log("✅ Image processing completed successfully!");
  } catch (e) {
    console.error("❌ Error in image processing:", e);
    console.error("❌ Error stack:", e.stack);
    showNotifyNegative("Errore salvataggio immagine: " + e.message);
  } finally {
    isUploading.value = false;
    console.log("🔄 Upload state reset, isUploading:", isUploading.value);
  }
}
</script>
