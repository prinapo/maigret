<template>
  <div>
    <q-checkbox
      v-model="isAdmin"
      label="Enable Admin Functions"
      @change="toggleAdminFunctions"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isAdmin = ref(false);

const toggleAdminFunctions = () => {
  // Logic to handle enabling/disabling admin functions
  console.log('Admin functions toggled:', isAdmin.value);
};
</script>

<style scoped>
/* Add any specific styles for the AdminSettings component here */
</style>