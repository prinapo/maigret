<template>
  <q-dialog
    v-model="showDialog"
    :maximized="isMobile"
    :full-width="isMobile"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Ritaglia copertina</div>
        <q-space />
        <q-btn
          :flat="!isMobile"
          :dense="!isMobile"
          :size="isMobile ? 'lg' : 'sm'"
          round
          color="negative"
          icon="close"
          @click="cancel"
          :disable="isProcessing"
        >
          <q-tooltip v-if="!isMobile">Annulla</q-tooltip>
        </q-btn>
        <q-btn
          :flat="!isMobile"
          :dense="!isMobile"
          :size="isMobile ? 'lg' : 'sm'"
          round
          color="primary"
          icon="crop"
          @click="applyCrop"
          :disable="!imageLoaded || isProcessing"
        >
          <q-tooltip v-if="!isMobile">Ritaglia</q-tooltip>
        </q-btn>
        <q-btn
          :flat="!isMobile"
          :dense="!isMobile"
          :size="isMobile ? 'lg' : 'md'"
          round
          color="positive"
          icon="check"
          @click="saveImage"
          :disable="!imageLoaded || isProcessing"
        >
          <q-tooltip v-if="!isMobile">Salva</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-card-section class="q-pa-md">
        <div ref="imageContainer" class="image-container">
          <img
            ref="mainImage"
            :src="imageSrc"
            class="main-image"
            @load="onImageLoad"
            draggable="false"
          />

          <!-- Overlay di ritaglio -->
          <div class="overlay">
            <svg class="overlay-svg">
              <defs>
                <mask id="cutout">
                  <rect width="100%" height="100%" fill="white" />
                  <polygon :points="cornerPoints" fill="black" />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.5)"
                mask="url(#cutout)"
              />
            </svg>
          </div>

          <!-- Marker angoli -->
          <div
            v-for="(corner, i) in cornerMarkers"
            :key="i"
            class="corner-marker"
            :style="{
              left: `${corner.x}px`,
              top: `${corner.y}px`,
              transform: 'translate(-50%,-50%)',
            }"
            @mousedown.stop="startDrag($event, i)"
            @touchstart.stop="startDrag($event, i)"
          >
            <div class="corner-dot"></div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, nextTick, watch } from "vue";
import { useQuasar, Platform } from "quasar";

const $q = useQuasar();

const props = defineProps({
  modelValue: Boolean,
  imageSrc: String,
});
const emit = defineEmits(["update:modelValue", "image-processed"]);

const isMobile = computed(() => $q.platform.is.mobile || $q.screen.lt.md);

const showDialog = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const imageLoaded = ref(false);
const isProcessing = ref(false);

const mainImage = ref(null);
const imageContainer = ref(null);

// angoli iniziali
const cornerMarkers = ref([
  { x: 50, y: 50 }, // top-left
  { x: 300, y: 50 }, // top-right
  { x: 300, y: 400 }, // bottom-right
  { x: 50, y: 400 }, // bottom-left
]);

let dragIndex = null;

const cornerPoints = computed(() =>
  cornerMarkers.value.map((c) => `${c.x},${c.y}`).join(" "),
);

const initializeCorners = () => {
  if (!mainImage.value || !imageContainer.value) return;

  const img = mainImage.value;
  const container = imageContainer.value;

  const imageWidth = img.offsetWidth;
  const imageHeight = img.offsetHeight;
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  const imageLeft = (containerWidth - imageWidth) / 2;
  const imageTop = (containerHeight - imageHeight) / 2;

  cornerMarkers.value = [
    { x: imageLeft, y: imageTop },
    { x: imageLeft + imageWidth, y: imageTop },
    { x: imageLeft + imageWidth, y: imageTop + imageHeight },
    { x: imageLeft, y: imageTop + imageHeight },
  ];
};

const onImageLoad = () => {
  imageLoaded.value = true;
  initializeCorners();
};

// Gestione cambio orientamento schermo
watch(
  () => $q.screen,
  () => {
    if (imageLoaded.value) {
      nextTick(() => {
        initializeCorners();
      });
    }
  },
  { deep: true },
);

const startDrag = (e, index) => {
  e.preventDefault(); // Prevent default touch behavior
  dragIndex = index;

  const move = (evt) => {
    evt.preventDefault(); // Prevent scrolling while dragging
    const rect = imageContainer.value.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX =
      evt.clientX ||
      (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
    const clientY =
      evt.clientY ||
      (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);

    if (clientX && clientY) {
      cornerMarkers.value[index].x = clientX - rect.left;
      cornerMarkers.value[index].y = clientY - rect.top;
    }
  };

  const up = (evt) => {
    evt.preventDefault();
    dragIndex = null;
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
    window.removeEventListener("touchmove", move, { passive: false });
    window.removeEventListener("touchend", up, { passive: false });
  };

  // Add mouse events for desktop
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);

  // Add touch events for mobile with passive: false to allow preventDefault
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", up, { passive: false });
};

const applyCrop = async () => {
  if (!imageLoaded.value) return;
  isProcessing.value = true;
  await nextTick();

  const img = mainImage.value;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;
  const containerRect = imageContainer.value.getBoundingClientRect();

  const scaleX = imgWidth / img.offsetWidth;
  const scaleY = imgHeight / img.offsetHeight;

  // Corner normalizzati all'immagine originale
  const normalizedCorners = cornerMarkers.value.map((corner) => ({
    x: (corner.x - (containerRect.width - img.offsetWidth) / 2) * scaleX,
    y: (corner.y - (containerRect.height - img.offsetHeight) / 2) * scaleY,
  }));

  // Bounding box dell'area selezionata
  const xs = normalizedCorners.map((c) => c.x);
  const ys = normalizedCorners.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;

  // --- PRIMO PASSO: crop rettangolare ---
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(
    img,
    minX,
    minY,
    cropWidth,
    cropHeight, // sorgente
    0,
    0,
    cropWidth,
    cropHeight, // destinazione
  );

  // --- SECONDO PASSO: prospettiva ---
  // Trasliamo i corner rispetto al crop
  const srcPoints = normalizedCorners.flatMap((c) => [c.x - minX, c.y - minY]);
  const dstPoints = [0, 0, cropWidth, 0, cropWidth, cropHeight, 0, cropHeight];

  const fxCanvas = window.fx.canvas(cropWidth, cropHeight);
  const texture = fxCanvas.texture(cropCanvas);

  fxCanvas.draw(texture).perspective(srcPoints, dstPoints).update();

  // Aggiorniamo l'immagine finale
  mainImage.value.src = fxCanvas.toDataURL("image/png");

  // Aggiorniamo cornerMarkers
  cornerMarkers.value = [
    { x: 0, y: 0 },
    { x: cropWidth, y: 0 },
    { x: cropWidth, y: cropHeight },
    { x: 0, y: cropHeight },
  ];

  isProcessing.value = false;
};

const saveImage = () => {
  console.log("💾 === STARTING SAVE PROCESS ===");
  console.log("💾 mainImage value:", mainImage.value);
  console.log("💾 Image src available:", !!mainImage.value?.src);
  console.log("💾 Image src length:", mainImage.value?.src?.length || 0);

  if (mainImage.value?.src) {
    console.log("💾 STEP 1: Emitting image-processed event with data URL");
    emit("image-processed", mainImage.value.src);
    console.log("💾 STEP 1: Image processed event emitted successfully");
  } else {
    console.warn("⚠️ No image src available to emit!");
  }

  console.log("💾 STEP 2: Emitting dialog close event");
  emit("update:modelValue", false);
  console.log("💾 STEP 2: Dialog close event emitted");
  console.log("💾 === SAVE PROCESS COMPLETE ===");
};

const cancel = () => {
  console.log("❌ Cancel clicked - closing dialog");
  isProcessing.value = false;
  emit("update:modelValue", false);
  console.log("✅ Cancel completed");
};
</script>

<style scoped>
.image-container {
  position: relative;
  width: 100%;
  height: min(500px, 70vh); /* Responsive height - max 500px or 70% viewport */
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 70vh; /* Responsive height for mobile */
  touch-action: none; /* Prevent default touch behaviors */
}
.main-image {
  max-width: 100%;
  max-height: 100%;
  user-select: none;
}
.corner-marker {
  position: absolute;
  width: 20px;
  height: 20px;
  cursor: move;
  /* Better mobile touch targets */
  min-width: 44px;
  min-height: 44px;
  margin: -12px; /* Compensate for increased size */
}
.corner-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #1976d2;
  background: rgba(25, 118, 210, 0.3);
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .image-container {
    height: 60vh; /* Better mobile height */
    min-height: 300px;
    margin: 8px;
  }

  .corner-marker {
    width: 32px; /* Larger touch targets for mobile */
    height: 32px;
    min-width: 48px;
    min-height: 48px;
    margin: -8px;
  }

  .main-image {
    max-height: 55vh; /* Adjust for mobile viewport */
  }
}

/* Overlay trasparente */
.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.overlay-svg {
  width: 100%;
  height: 100%;
}
</style>
