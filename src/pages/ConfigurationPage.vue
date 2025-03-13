<template>
  <div class="container q-pa-md">
    <!-- Mostra il toggle Admin Mode solo se l'utente è admin -->
    <div v-if="isAdmin" class="q-mb-md text-center">
      <q-toggle
        v-model="adminMode"
        label="Admin Mode"
        color="primary"
        @update:model-value="toggleAdminMode"
      />
    </div>

    <!-- Toggle per il tema (sempre visibile) -->
    <div class="q-mb-md text-center">
      <q-toggle
        v-model="theme"
        :options="themeOptions"
        label="Select Theme"
        color="primary"
        :true-value="'dark'"
        :false-value="'light'"
        @update:model-value="toggleTheme"
      />
    </div>
  </div>
</template>

<script setup>
import { useUserSettingsStore } from "../store/userSettings";
import { useAuth } from "../composable/auth";
import { storeToRefs } from "pinia";
import { Dark } from "quasar";

const userSettings = useUserSettingsStore();
const { isAdmin, checkAuthState } = useAuth(); // Usa isAdmin direttamente

const { adminMode, theme } = storeToRefs(userSettings);

const themeOptions = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

// Watch per il tema

const toggleAdminMode = (newMode) => {
  userSettings.setAdminMode(newMode);
};

const toggleTheme = (newTheme) => {
  Dark.set(newTheme === "dark");
  userSettings.setTheme(newTheme);
};

// Controlla lo stato di autenticazione all'avvio
checkAuthState();
</script>

<style scoped>
.container {
  max-width: 500px;
  margin: 0 auto;
}
</style>
