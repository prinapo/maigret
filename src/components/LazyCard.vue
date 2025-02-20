<template>
  <div ref="cardRef">
    <slot v-if="isVisible"></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const cardRef = ref(null);
const isVisible = ref(false);
let observer;

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      isVisible.value = entry.isIntersecting;
    },
    { threshold: 0.1 },
  );

  observer.observe(cardRef.value);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>
