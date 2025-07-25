<template>
  <div style="position: relative">
    <div v-if="images.length === 0" class="placeholder">
      Nessuna immagine disponibile
    </div>
    <q-virtual-scroll
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
          <!-- Trash icon overlay for admin users -->
          <div v-if="isFieldEditable" class="trash-overlay">
            <q-icon
              name="delete"
              color="negative"
              size="md"
              @click="confirmDelete(innerIndex)"
            />
          </div>
          <!-- Wrapper per uniformare la dimensione delle immagini -->
          <div class="full-width flex flex-center" style="height: 250px">
            <q-img
              :key="image.id"
              :src="getImageSource(image)"
              @error="handleImageError(innerIndex)"
              @load="onImageLoad(innerIndex)"
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
            :options="coverOptionsLocalized"
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
            class="full-width select-contrast-text"
            :borderless="!isFieldEditable"
            :hide-dropdown-icon="!isFieldEditable"
            :readonly="!isFieldEditable"
            :style="
              !isFieldEditable
                ? 'pointer-events: none; background: transparent;'
                : ''
            "
            option-label="label"
            option-value="value"
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
                :src="getFullScreenImageUrl(image)"
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
    <q-fab
      v-if="isFieldEditable"
      icon="add"
      color="primary"
      class="q-fab-bottom-right fab-small"
      @click="openAddImageDialog"
    />

    <!-- Dialog scelta sorgente immagine -->
    <q-dialog v-model="addImageDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Aggiungi immagine</div>
        </q-card-section>
        <q-card-actions align="around">
          <q-btn flat label="Scatta foto" @click="takePhoto" />
          <q-btn flat label="Scegli da file" @click="pickFile" />
          <q-btn flat label="Annulla" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog cropper -->
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

    <!-- Confirmation dialog -->
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

    <!-- Undo action marker -->
    <div v-if="showUndo" class="undo-action">
      <button @click="undoDelete">Annulla</button>
    </div>

    <!-- Notifica errore marker -->
    <div v-if="showError" class="q-notification">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, unref, computed, onMounted, watch, nextTick } from "vue";
import { fireStoreUrl, fireStoreTmblUrl } from "src/boot/firebase";
import { convertAndUploadImage } from "utils/imageUtils";
import { useAuthStore } from "stores/authStore";
import { useUserStore } from "stores/userStore";
import { useUndoStore } from "stores/undoStore";
import { storeToRefs } from "pinia";
import { addImage, deleteImage } from "utils/imageUtils";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useCoversStore } from "stores/coversStore";
import placeholderImage from "assets/placeholder.jpg";
import { updateDocInCollection } from "utils/firebaseDatabaseUtils";
import { showNotifyPositive, showNotifyNegative } from "src/utils/notify";
import { useI18n } from "vue-i18n";
import { Loading } from "quasar";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { ref as vueRef } from "vue";

const { t, locale } = useI18n();
const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
});
const undoStore = useUndoStore();
const dialogs = ref([]);
const confirmDialogVisible = ref(false);
const tempImageIndex = ref(null);
const defaultBookCoverTypeId = "qNvdwFMLNt2Uz7JjqTjacu";
const emit = defineEmits(["showUndo"]);

// Auth and settings
const userStore = useUserStore();
const { settings } = storeToRefs(userStore);

const isFieldEditable = computed(() => {
  return userStore.hasPermission("manage_books");
});
// Covers store
const coversStore = useCoversStore();
const coverOptions = coversStore.covers;

const coverOptionsLocalized = computed(() => {
  const lang = locale.value;
  return coverOptions.map((opt) => ({
    ...opt,
    label: lang === "it-IT" ? opt.label_it : opt.label_en,
  }));
});
const previousCoverTypeId = "";

// Bibliografia store
const bibliografiaStore = useBibliografiaStore();
const biblio = computed(() => unref(bibliografiaStore.bibliografia));
const book = computed(() => biblio.value.find((b) => b.id === props.bookId));
const images = computed(() => book.value?.images || []);
const edizioni = computed(() => book.value?.edizioni || []);
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

// Aggiungi stato per il tracciamento delle immagini caricate
const loadedImages = ref(new Set());
const allImagesLoaded = computed(() => {
  return images.value && loadedImages.value.size >= images.value.length;
});

// Funzione per gestire il caricamento delle immagini
const onImageLoad = async (index) => {
  loadedImages.value.add(index);
  console.log(
    `[Image ${index}] loaded, total: ${loadedImages.value.size}/${images.value.length}`,
  );

  // Se tutte le immagini sono caricate, nascondi il loader
  if (allImagesLoaded.value) {
    console.log(
      "[Loader] hide after all images loaded",
      new Date().toISOString(),
    );
    await nextTick(); // aspetta che il DOM sia aggiornato
    Loading.hide();
  }
};

// Reset del conteggio quando cambiano le immagini
watch(
  () => images.value,
  () => {
    loadedImages.value.clear();
    if (images.value && images.value.length > 0) {
      Loading.show();
      console.log("[Loader] show for new images", new Date().toISOString());
    }
  },
  { deep: true },
);

// Quando un file è stato aggiunto, caricalo su Firebase Storage
const MAX_FILE_SIZE_MB = 5;
const onFileAdded = async (event, imageUuid, innerIndex) => {
  const file = event[0];
  if (file) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showNotifyNegative(t("bookImages.fileTooLarge"));
      return;
    }
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

        showNotifyPositive(t("bookImages.imageUploadedSuccessfully"));
      } catch (error) {
        console.error("Error in image upload and processing:", error);
        showNotifyNegative(t("bookImages.uploadFailed") + ": " + error.message);
      } finally {
        Loading.hide();
      }
    } else {
      showNotifyNegative(t("bookImages.onlyJPGJPEGAndPNGFilesAllowed"));
    }
  }
};

// Fixed values for virtual scroll
const itemSize = 250; // Width of each item in pixels
const sliceSize = 4; // Number of items to render at once

// Add fileInputRef
// const fileInputRef = ref(null);  // Unused variable, commented out

// Image handling functions
const getImageSource = (image) => {
  const imageName =
    !image?.id || image.id === "placeholder"
      ? "placeholder.jpg"
      : image.id + ".jpg";
  try {
    if (imageName === "placeholder.jpg") {
      return placeholderImage;
    }
    return `${fireStoreTmblUrl}${encodeURIComponent(imageName)}?alt=media`;
  } catch (error) {
    console.error("Image source error:", error);
    return placeholderImage;
  }
};

const getFullScreenImageUrl = (image) => {
  const imageName =
    !image?.id || image.id === "placeholder"
      ? "placeholder.jpg"
      : image.id + ".jpg";
  try {
    if (imageName === "placeholder.jpg") {
      return placeholderImage;
    }
    return `${fireStoreUrl}${encodeURIComponent(imageName)}?alt=media`;
  } catch (error) {
    console.error("Full screen image URL error:", error);
    return placeholderImage;
  }
};

const handleImageError = (event, index) => {
  event.target.src = placeholderImage;
  onImageLoad(index); // Considera l'immagine come "caricata" anche in caso di errore
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
    showNotifyNegative(
      t("bookImages.missingRequiredParametersForCoverTypeUpdate"),
    );
    return;
  }

  const isCoverTypeIdUsed = images.value.some(
    (image, index) => image.coverTypeId === coverTypeId && index !== imageIndex,
  );

  if (isCoverTypeIdUsed) {
    showNotifyNegative(
      t("bookImages.thisCoverTypeIsAlreadyUsedByAnotherImage"),
    );
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
    console.error("Error updating cover type:", error);
    showNotifyNegative(
      t("bookImages.failedToUpdateCoverType") + ": " + error.message,
    );
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
  } finally {
    Loading.hide();
  }
};

const confirmDelete = (index) => {
  tempImageIndex.value = index;
  confirmDialogVisible.value = true;
};
const deleteImageConfirmed = async () => {
  const imageIndex = tempImageIndex.value;

  if (imageIndex === null || imageIndex === undefined) {
    return;
  }

  try {
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
    showNotifyNegative(
      t("bookImages.failedToDeleteImage") + ": " + error.message,
    );
  } finally {
    Loading.hide();
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
    showNotifyNegative(t("bookImages.failedToAddImage") + ": " + error.message);
  } finally {
    Loading.hide();
  }
};

const isMobile = computed(() => window.innerWidth <= 600);

onMounted(async () => {
  // Mostra il loader se ci sono immagini da caricare
  if (images.value && images.value.length > 0) {
    Loading.show();
    console.log("[Loader] show on mount", new Date().toISOString());
  }

  // Solo se l'utente può modificare e il libro non è deleted
  if (
    isFieldEditable.value &&
    book.value &&
    !book.value.deleted &&
    images.value.length === 0
  ) {
    try {
      await addImage(props.bookId, t);
    } catch (error) {
      // Usa showNotifyNegative e messaggio i18n
      const msg = t("bookImages.error_creating_placeholder_image");
      showNotifyNegative(`${msg}: ${error.message}`);
    } finally {
      Loading.hide();
    }
  }
});

const showUndo = ref(false); // Da attivare dopo una delete
const showError = ref(false);
const errorMessage = ref("");
function undoDelete() {
  // Logica undo base (da completare)
  showUndo.value = false;
}

const addImageDialog = vueRef(false);
const showCropperDialog = vueRef(false);
const cropperImage = vueRef(null);
const cropperResult = vueRef(null);
const cropperRef = vueRef(null);

function openAddImageDialog() {
  addImageDialog.value = true;
}

async function takePhoto() {
  addImageDialog.value = false;
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    cropperImage.value = image.dataUrl;
    showCropperDialog.value = true;
  } catch (e) {
    showNotifyNegative("Errore acquisizione foto");
  }
}

function pickFile() {
  addImageDialog.value = false;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        cropperImage.value = ev.target.result;
        showCropperDialog.value = true;
      };
      reader.readAsDataURL(file);
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
  if (!cropperResult.value) return;
  try {
    // Carica l'immagine ritagliata come nuova copertina
    await uploadCroppedImage(cropperResult.value);
    showCropperDialog.value = false;
    cropperImage.value = null;
    cropperResult.value = null;
  } catch (e) {
    showNotifyNegative("Errore salvataggio immagine");
  }
}

async function uploadCroppedImage(dataUrl) {
  // Converti dataUrl in Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  // Usa la funzione già esistente per upload (adatta se serve)
  await convertAndUploadImage(blob, props.bookId, images.value.length);
  // Aggiorna lo store
  const updatedImages = await fetchImages(props.bookId);
  const bibliografia = unref(bibliografiaStore.bibliografia);
  bibliografiaStore.$patch({
    bibliografia: bibliografia.map((b) =>
      b.id === props.bookId ? { ...b, images: updatedImages } : b,
    ),
  });
}
</script>

<style scoped>
.img-thumbnail {
  max-width: 100%;
  height: auto;
}
/* Forza il colore del testo del q-select a bianco in dark mode */
.select-contrast-text .q-field__native,
.select-contrast-text .q-field__input,
.select-contrast-text .q-field__label {
  color: white !important;
}
@media (prefers-color-scheme: light) {
  .select-contrast-text .q-field__native,
  .select-contrast-text .q-field__input,
  .select-contrast-text .q-field__label {
    color: inherit !important;
  }
}
/* FAB bottom right */
.q-fab-bottom-right {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}
/* Trash icon overlay */
.trash-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 6px;
  z-index: 10;
}
/* FAB per aggiunta, più piccolo */
.fab-small {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  font-size: 20px;
}
.cropper {
  width: 100%;
  height: 100%;
  background: #222;
}
</style>
