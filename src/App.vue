<template>
  <router-view />
</template>

<script>
import { defineComponent, onBeforeUnmount, onMounted, watch } from "vue";
import { cleanupAllListeners } from "listeners/realtimeListeners";
import { Loading } from "quasar";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "App",

  setup() {
    console.log("App setup started");

    const bibliografiaStore = useBibliografiaStore();
    const { isLoaded } = storeToRefs(bibliografiaStore);

    watch(isLoaded, (val) => {
      console.log("Bibliografia loaded:", val);
    });

    let loaderStart = null;

    onMounted(() => {
      loaderStart = Date.now();
      console.log("[Loader] show", new Date().toISOString());
      Loading.show();
      setTimeout(() => {
        Loading.hide();
        const duration = ((Date.now() - loaderStart) / 1000).toFixed(2);
        console.log(
          `[Loader] hide after ${duration}s`,
          new Date().toISOString(),
        );
      }, 5000);
      console.log("App mounted");
    });

    // Cleanup quando il componente App viene distrutto
    onBeforeUnmount(() => {
      console.log("App cleanup started");
      cleanupAllListeners();
    });

    return {};
  },
});
</script>
