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
      if (val) {
        Loading.hide();
        console.log("[Loader] hide on isLoaded=true", new Date().toISOString());
      }
    });

    let loaderStart = null;

    onMounted(() => {
      loaderStart = Date.now();
      console.log("[Loader] show", new Date().toISOString());
      Loading.show();

      // Fallback per evitare che il loader rimanga appeso all'infinito
      setTimeout(() => {
        if (Loading.isActive) {
          Loading.hide();
          const duration = ((Date.now() - loaderStart) / 1000).toFixed(2);
          console.log(
            `[Loader] hide after fallback timeout ${duration}s`,
            new Date().toISOString(),
          );
        }
      }, 30000); // Timeout di 30 secondi
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
