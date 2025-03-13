<template>
  <q-layout :class="themeClass">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          My Quasar App
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';

const { themeClass } = useTheme();
</script>

<style scoped>
</style>