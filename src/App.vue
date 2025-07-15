<template>
  <router-view />
</template>

<script>
import { defineComponent, onBeforeUnmount } from "vue";
import { cleanupAllListeners } from "listeners/realtimeListeners";

export default defineComponent({
  name: "App",

  setup() {
    // Cleanup quando il componente App viene distrutto
    onBeforeUnmount(() => {
      cleanupAllListeners();
    });

    return {};
  },
});
</script>
