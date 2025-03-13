<template>
  <q-page class="flex flex-center">
    <q-spinner-dots color="primary" size="4em" />
  </q-page>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  // Redirect back to home after a short delay if stuck on loading
  setTimeout(() => {
    router.push("/");
  }, 3000);
});
</script>
