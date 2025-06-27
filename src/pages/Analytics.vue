<template>
  <q-page class="flex flex-center bg-grey-3">
    <div class="text-center q-pa-lg">
      <q-icon name="build" size="100px" color="primary" />
      <div class="text-h4 q-mt-md">{{ $t('analytics.pageUnderConstruction') }}</div>
      <div class="text-subtitle1 q-mt-sm text-grey-6">
        Stiamo lavorando per offrirti una nuova esperienza. Torna presto!
      </div>
      <q-btn class="q-mt-lg" color="primary" :label="$t('analytics.backToHome')" to="/" />
    </div>
  </q-page>
</template>

<script setup>
// Nessuna logica necessaria per ora
</script>

<style scoped>
/* Puoi aggiungere stili personalizzati se vuoi */
</style>
