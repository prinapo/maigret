<template>
  <div ref="imageContainer">
    <q-img
      v-if="isVisible"
      :src="imageSrc"
      style="align-self: center; background-color: white"
      no-spinner
      fit="contain"
      @load="onImageLoad"
      @error="onImageError"
    >
      <slot name="error" v-if="hasError"></slot>
      <slot></slot>
    </q-img>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  book: Object,
  getImageUrl: Function,
  bookImage: String,
});

const imageContainer = ref(null);
const isVisible = ref(false);
const imageSrc = ref(props.bookImage);
const hasError = ref(false);

let observer;

const loadImage = async () => {
  try {
    imageSrc.value = await props.getImageUrl(props.book);
    hasError.value = false;
  } catch (error) {
    console.error("Error loading image:", error);
    hasError.value = true;
  }
};

const onImageLoad = () => {
  hasError.value = false;
};

const onImageError = () => {
  hasError.value = true;
  imageSrc.value = props.bookImage;
};

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      isVisible.value = true;
      loadImage();
      observer.unobserve(imageContainer.value);
    }
  });

  observer.observe(imageContainer.value);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

watch(() => props.book, loadImage);
</script>
