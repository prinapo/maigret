<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-sm">
      <div class="col-12">
        <BookImages v-if="bookId" :bookId="bookId" />
      </div>
      <div class="col-12">
        <Suspense>
          <template #default>
            <BookDetails v-if="bookId" :bookId="bookId" />
          </template>
          <template #fallback>
            <div class="text-center q-pa-md">
              <q-spinner color="primary" size="3em" />
              <div class="text-body1 q-mt-md">{{ $t('bookDetailContent.loadingDetails') }}</div>
            </div>
          </template>
        </Suspense>
      </div>
      <div class="col-12">
        <BookEditions v-if="bookId" :bookId="bookId" />
      </div>
    </div>
  </div>
</template>

<script setup>
//components
import BookDetails from "components/BookDetails.vue"; // Import BookDetails component
import BookImages from "components/BookImages.vue"; // Import BookImages component
import BookEditions from "components/BookEditions.vue"; // Import BookEditions component

defineProps({
  bookId: {
    type: String,
    required: true,
  },
});
</script>
