<template>
  <div style="position: relative">
    <div v-if="images.length === 0" class="placeholder">
      Nessuna immagine disponibile
    </div>
    <!-- <q-virtual-scroll
      v-else
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
          class="column items-center q-mx-sm relative-position book-image"
          style="width: 250px; height: 100%"
        >
          <div v-if="isFieldEditable" class="trash-overlay">
            <q-icon
              name="delete"
              color="negative"
              size="md"
              @click="confirmDelete(innerIndex)"
            />
          </div>

          <div
            class="full-width flex flex-center"
            style="height: 250px; position: relative"
          >
            <q-img
              :key="image.id"
              :src="getImageSource(image)"
              @error="(event) => handleImageError(event, innerIndex)"
              @load="onImageLoad(innerIndex)"
              fit="contain"
              no-spinner
              class="full-width"
              style="height: 100%; min-height: 250px"
              @click="showImageFullscreen(innerIndex)"
            >
            </q-img>
          </div>

          <div
            v-if="isFieldEditable"
            class="full-width row justify-end q-gutter-xs q-mt-xs"
          >
            <q-btn
              round
              dense
              size="sm"
              icon="file_upload"
              color="primary"
              @click.stop="onReplaceImageFromFile(innerIndex)"
            />
            <q-btn
              round
              dense
              size="sm"
              icon="photo_camera"
              color="secondary"
              @click.stop="onReplaceImageFromCamera(innerIndex)"
            />
          </div>

          <q-select
            v-model="image.coverTypeId"
            :options="coverOptionsLocalized"
            :label="isFieldEditable ? $t('bookImages.coverType') : ''"
            @focus="previousCoverTypeId = image.coverTypeId"
            @update:model-value="
              handleCoverChange($event, innerIndex, previousCoverTypeId)
            "
            dense
            emit-value
            map-options
            fill-input
            :disable="false"
            :readonly="!isFieldEditable"
            :borderless="!isFieldEditable"
            :hide-dropdown-icon="!isFieldEditable"
            option-label="label"
            option-value="value"
            style="padding: 1px 2px;"
          />
        </div>
      </template>
    </q-virtual-scroll> -->
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
          :img-src="getImageSource(image)"
          :style="{ background: 'none' }"
        >
          <div
            class="column items-center relative-position"
            style="height: 100%"
          >
            <!-- IMAGE -->
            <div
              class="full-width flex flex-center"
              :style="{ height: slideImageHeight, position: 'relative' }"
            >
              <q-img
                :src="getImageSource(image)"
                fit="contain"
                class="full-height"
                @error="(event) => handleImageError(event, index)"
                @click="showImageFullscreen(index)"
              />

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

      <q-btn-dropdown icon="add" color="primary" label="Aggiungi immagine">
        <q-list>
          <q-item clickable v-ripple @click="addImageWithSource('file')">
            <q-item-section>Da file</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="addImageWithSource('camera')">
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
          <q-btn flat label="Annulla" @click="cancelCrop" />
          <q-btn flat label="Salva" color="primary" @click="saveCroppedImage" />
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
const itemSize = 250; // o la larghezza dei tuoi elementi
const sliceSize = 5; // numero di elementi renderizzati per volta
const fullscreen = ref(false);
const confirmDialogVisible = ref(false);
const tempImageIndex = ref(null);
const carouselSlide = ref(0);
let previousCoverTypeId = "";

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
const imageHeight = computed(() => "250px");
const slideImageHeight = computed(() =>
  fullscreen.value ? "95vh" : imageHeight.value,
);

const loadedImages = ref(new Set());
const allImagesLoaded = computed(() => {
  return images.value && loadedImages.value.size >= images.value.length;
});

const onImageLoad = async (index) => {
  loadedImages.value.add(index);
};

watch(
  () => images.value,
  () => {
    loadedImages.value.clear();
    carouselSlide.value = 0;
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
  try {
    await addImage(props.bookId);
    const newIndex = images.value.length - 1;
    if (source === "file") onReplaceImageFromFile(newIndex);
    else if (source === "camera") onReplaceImageFromCamera(newIndex);
  } catch (e) {
    // console.error("Errore addImageWithSource:", e);
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

async function onReplaceImageFromCamera(index) {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    replaceTargetIndex.value = index;
    cropperImage.value = image.dataUrl;
    showCropperDialog.value = true;
  } catch (e) {
    if (e.message && e.message.includes("permission")) {
      showNotifyNegative(t("bookImages.cameraPermissionDenied"));
    }
  }
}

function onReplaceImageFromFile(index) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
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
    } catch (error) {
      // console.error("Error replacing image from file:", error);
      showNotifyNegative(t("bookImages.uploadFailed") + ": " + error.message);
    } finally {
      input.value = "";
    }
  };
  input.click();
}

function cancelCrop() {
  showCropperDialog.value = false;
  cropperImage.value = null;
  cropperResult.value = null;
}
function onCropChange({ canvas }) {
  cropperResult.value = canvas ? canvas.toDataURL("image/jpeg", 0.9) : null;
}

async function saveCroppedImage() {
  if (!cropperResult.value || replaceTargetIndex.value === null) return;

  try {
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
    showCropperDialog.value = false;
    replaceTargetIndex.value = null;
    cropperImage.value = null;
    cropperResult.value = null;
  }
}
</script>
