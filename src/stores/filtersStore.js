// src/stores/filtersStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { showNotifyNegative } from "src/utils/notify";
import { i18n } from "boot/i18n";

class FilterError extends Error {
  constructor(message, type) {
    super(message);
    this.name = "FilterError";
    this.type = type;
  }
}

const handleFilterError = (error) => {
  console.error("Filter error:", error);
  showNotifyNegative(i18n.global.t("filters.error", { error: error.message }));
  throw error;
};

export const useFiltersStore = defineStore("filters", () => {
  const filters = ref({
    search: "", // stringa di ricerca
    selectedEditori: [], // array di stringhe
    selectedCollane: [], // array di stringhe
    lingua: [], // array di stringhe
    posseduto: [], // array di stringhe: possibili valori "yes", "no"
    orderBy: [], // array di stringhe
  });

  const validateFilter = (type, value) => {
    switch (type) {
      case "search":
        if (typeof value !== "string") {
          throw new FilterError(
            "Il termine di ricerca deve essere una stringa",
            "INVALID_SEARCH",
          );
        }
        break;
      case "selectedEditori":
      case "selectedCollane":
      case "lingua":
      case "posseduto":
      case "orderBy":
        if (!Array.isArray(value)) {
          throw new FilterError(
            `${type} deve essere un array di stringhe`,
            "INVALID_ARRAY",
          );
        }
        break;
      default:
        throw new FilterError(`Unknown filter type: ${type}`, "UNKNOWN_FILTER");
    }
    return true;
  };

  const updateFilter = (type, value) => {
    try {
      validateFilter(type, value);
      filters.value[type] = value;
    } catch (error) {
      handleFilterError(error);
    }
  };

  const clearFilters = () => {
    filters.value = {
      search: "",
      selectedEditori: [],
      selectedCollane: [],
      lingua: [],
      posseduto: [],
      orderBy: [],
    };
  };

  const hasActiveFilters = computed(() => {
    return (
      filters.value.search !== "" ||
      filters.value.selectedEditori.length > 0 ||
      filters.value.selectedCollane.length > 0 ||
      filters.value.lingua.length > 0 ||
      filters.value.posseduto.length > 0 ||
      filters.value.orderBy.length > 0
    );
  });

  // Wrappers per Filter.vue
  const updateSearchQuery = (val) => updateFilter("search", val);
  const updateSelectedEditore = (val) => {
    if (val) updateFilter("selectedEditori", [val]);
    else updateFilter("selectedEditori", []);
  };
  const updateSelectedCollana = (val) => {
    if (val) updateFilter("selectedCollane", [val]);
    else updateFilter("selectedCollane", []);
  };
  const updateLingua = (valArray) => {
    updateFilter("lingua", Array.isArray(valArray) ? valArray : []);
  };
  const updatePossedutoArray = (valArray) => {
    // valArray dev'essere un array di stringhe scelte tra "yes" e/o "no"
    updateFilter("posseduto", Array.isArray(valArray) ? valArray : []);
  };
  const updateOrderByArray = (valArray) => {
    updateFilter("orderBy", Array.isArray(valArray) ? valArray : []);
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    updateSearchQuery,
    updateSelectedEditore,
    updateSelectedCollana,
    updateLingua,
    updatePossedutoArray,
    updateOrderByArray,
  };
});
