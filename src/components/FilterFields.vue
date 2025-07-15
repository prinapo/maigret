<template>
  <div class="q-gutter-md">
    <q-input
      v-model="searchValue"
      :label="$t('filter.title')"
      outlined
      dense
      clearable
      :style="selectStyle"
    />
    <q-select
      ref="editoreSelect"
      v-model="editoreValue"
      :options="editoriOptions"
      :label="$t('filter.publisher')"
      outlined
      dense
      multiple
      use-chips
      behavior="menu"
      :max-values="2"
      :display-value="
        editoreValue.length > 2
          ? `${editoreValue
              .slice(0, 2)
              .map((o) => o.label)
              .join(', ')} +${editoreValue.length - 2}`
          : ''
      "
      :style="selectStyle"
      :popup-content-class="popupClass"
      option-value="value"
      option-label="label"
      hide-dropdown-icon
      @update:model-value="onSelect('editore')"
    />
    <q-select
      ref="collanaSelect"
      v-model="collanaValue"
      :options="collaneOptions"
      :label="$t('filter.series')"
      outlined
      dense
      multiple
      use-chips
      behavior="menu"
      :max-values="2"
      :display-value="
        collanaValue.length > 2
          ? `${collanaValue
              .slice(0, 2)
              .map((o) => o.label)
              .join(', ')} +${collanaValue.length - 2}`
          : ''
      "
      :style="selectStyle"
      :popup-content-class="popupClass"
      option-value="value"
      option-label="label"
      hide-dropdown-icon
      @update:model-value="onSelect('collana')"
    />
    <q-select
      ref="linguaSelect"
      v-model="linguaValue"
      :options="lingueOptions"
      :label="$t('filter.language')"
      outlined
      dense
      multiple
      use-chips
      behavior="menu"
      :style="selectStyle"
      :popup-content-class="popupClass"
      option-value="value"
      option-label="label"
      hide-dropdown-icon
      @update:model-value="onSelect('lingua')"
    />
    <q-select
      ref="possedutoSelect"
      v-model="possedutoValue"
      :options="possedutoOptionsWithLabel"
      :label="$t('filter.owned')"
      outlined
      dense
      multiple
      use-chips
      behavior="menu"
      :style="selectStyle"
      :popup-content-class="popupClass"
      option-value="value"
      option-label="label"
      hide-dropdown-icon
      @update:model-value="onSelect('posseduto')"
    />
    <q-select
      ref="orderBySelect"
      v-model="orderByValue"
      :options="orderByOptions"
      :label="$t('filter.sortBy')"
      outlined
      dense
      behavior="menu"
      :style="selectStyle"
      :popup-content-class="popupClass"
      hide-dropdown-icon
      option-value="value"
      option-label="label"
      @update:model-value="onSelect('orderBy')"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

const $q = useQuasar();

const editoreSelect = ref(null);
const collanaSelect = ref(null);
const linguaSelect = ref(null);
const possedutoSelect = ref(null);
const orderBySelect = ref(null);

const props = defineProps({
  editoriOptions: { type: Array, default: () => [] },
  collaneOptions: { type: Array, default: () => [] },
  lingueOptions: { type: Array, default: () => [] },
  possedutoOptions: {
    type: Array,
    default: () => [{ value: "yes" }, { value: "no" }],
  },
  orderByOptions: { type: Array, default: () => [] },
  modelValueEditore: { type: Array, default: () => [] },
  modelValueCollana: { type: Array, default: () => [] },
  modelValueLingua: { type: Array, default: () => [] },
  modelValuePoss: { type: Array, default: () => [] },
  modelValueSearch: { type: String, default: "" },
  modelValueOrderBy: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:modelValueEditore",
  "update:modelValueCollana",
  "update:modelValueLingua",
  "update:modelValuePoss",
  "update:modelValueSearch",
  "update:modelValueOrderBy",
]);

const editoreValue = ref(
  Array.isArray(props.modelValueEditore) ? props.modelValueEditore : [],
);
const collanaValue = ref(
  Array.isArray(props.modelValueCollana) ? props.modelValueCollana : [],
);
const linguaValue = ref(
  Array.isArray(props.modelValueLingua) ? props.modelValueLingua : [],
);
const possedutoValue = ref(
  Array.isArray(props.modelValuePoss) ? props.modelValuePoss : [],
);
const searchValue = ref(
  typeof props.modelValueSearch === "string" ? props.modelValueSearch : "",
);
const orderByValue = ref(
  Array.isArray(props.modelValueOrderBy) ? props.modelValueOrderBy : [],
);

const { t } = useI18n();

const possedutoOptionsWithLabel = computed(() =>
  props.possedutoOptions.map((opt) => ({
    ...opt,
    label:
      opt.value === "yes"
        ? t("filter.ownedYes") || "Posseduto"
        : t("filter.ownedNo") || "Non Posseduto",
  })),
);

// Computed per larghezza campo solo su desktop
const selectStyle = computed(() => {
  return $q.screen.lt.md ? undefined : "width: 240px";
});

// Classe per il popup del menu su desktop
const popupClass = computed(() =>
  $q.screen.lt.md ? "" : "qselect-popup-fixed",
);

watch(editoreValue, (v) => emit("update:modelValueEditore", v));
watch(collanaValue, (v) => emit("update:modelValueCollana", v));
watch(linguaValue, (v) => emit("update:modelValueLingua", v));
watch(possedutoValue, (v) => emit("update:modelValuePoss", v));
watch(searchValue, (v) => emit("update:modelValueSearch", v));
watch(orderByValue, (v) => emit("update:modelValueOrderBy", v));

function onSelect(type) {
  if ($q.screen.lt.md) {
    setTimeout(() => {
      if (type === "editore" && editoreSelect.value)
        editoreSelect.value.hidePopup();
      if (type === "collana" && collanaSelect.value)
        collanaSelect.value.hidePopup();
      if (type === "lingua" && linguaSelect.value)
        linguaSelect.value.hidePopup();
      if (type === "posseduto" && possedutoSelect.value)
        possedutoSelect.value.hidePopup();
      if (type === "orderBy" && orderBySelect.value)
        orderBySelect.value.hidePopup();
    }, 100);
  }
}
</script>

<style scoped>
/* Rimosse tutte le regole per forzare larghezza e word-break su desktop. */
</style>
