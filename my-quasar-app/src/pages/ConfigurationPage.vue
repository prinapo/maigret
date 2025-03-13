<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <h2>Configuration Page</h2>
        <admin-settings />
      </q-card-section>
      <q-card-section>
        <q-select
          v-model="theme"
          :options="themeOptions"
          label="Select Theme"
          @change="changeTheme"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useTheme } from '../composables/useTheme';
import AdminSettings from '../components/AdminSettings.vue';

const { theme, changeTheme } = useTheme();
const themeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Dark', value: 'dark' },
];
</script>

<style scoped>
.q-card {
  max-width: 400px;
  margin: auto;
}
</style>