<template>
  <div class="q-pa-md bg-primary">
    <div class="row q-col-gutter-sm">
      <div class="col-12">
        <BookImages v-if="bookId" :bookId="bookId" />
      </div>
      <div class="col-12">
        <BookDetails v-if="bookId" :bookId="bookId" />
      </div>
      <div class="col-12">
        <BookEditions v-if="bookId" :bookId="bookId" />
      </div>
    </div>
  </div>
</template>

<script setup>
import BookDetails from "./BookDetails.vue"; // Import BookDetails component
import BookImages from "./BookImages.vue"; // Import BookImages component
import BookEditions from "./BookEditions.vue"; // Import BookEditions component

defineProps({
  bookId: {
    type: String,
    required: true,
  },
});
</script>
