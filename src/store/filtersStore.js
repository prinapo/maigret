//filterStore.js
import { defineStore } from "pinia";

export const useFiltersStore = defineStore({
  id: "filters",
  state: () => ({
    searchQuery: "",
    selectedEditore: "",
    selectedCollana: "",
    isListView: false,
    showFranceseBooks: false,
    editoriOptions: [],
    isOpen: false,
    orderBy: "",
    italiano: true,
    francese: true,
    posseduto: true,
    nonPosseduto: true,
  }),
  actions: {
    updateSearchQuery(newSearchQuery) {
      this.searchQuery = newSearchQuery;
    },
    updateSelectedEditore(newSelectedEditore) {
      this.selectedEditore = newSelectedEditore;
    },
    updateSelectedCollana(newSelectedCollana) {
      this.selectedCollana = newSelectedCollana;
    },
    updateShowFranceseBooks(newShowFranceseBooks) {
      this.showFranceseBooks = newShowFranceseBooks;
    },
    toggleIsOpen() {
      this.isOpen = !this.isOpen;
      localStorage.setItem("isExpansionOpen", this.isOpen ? "true" : "false");
    },
    updateListView(newIsListView) {
      this.isListView = newIsListView;
      localStorage.setItem("isListView", this.isListView ? "true" : "false");
    },
    updateOrderBy(newOrderBy) {
      this.orderBy = newOrderBy;
    },
    toggleItaliano() {
      this.italiano = !this.italiano;
    },
    toggleFrancese() {
      this.francese = !this.francese;
    },
    togglePosseduto() {
      this.posseduto = !this.posseduto;
    },
    toggleNonPosseduto() {
      this.nonPosseduto = !this.nonPosseduto;
    },
    // Define other actions as needed
  },
  mutations: {
    setSearchQuery(state, value) {
      state.searchQuery = value;
    },
    setSelectedEditore(state, value) {
      state.selectedEditore = value;
    },
    setSelectedCollana(state, value) {
      state.selectedEditore = value;
    },
    setShowFranceseBooks(state, value) {
      state.showFranceseBooks = value;
    },
    setOrderBy(state, value) {
      state.orderBy = value;
    },
    toggleItaliano(state) {
      state.italiano = !state.italiano;
    },
    toggleFrancese(state) {
      state.francese = !state.francese;
    },
    togglePosseduto(state) {
      state.posseduto = !state.posseduto;
    },
    toggleNonPosseduto(state) {
      state.nonPosseduto = !state.nonPosseduto;
    },
    toggleIsOpen(state) {
      state.isOpen = !state.isOpen;
      localStorage.setItem("isExpansionOpen", state.isOpen ? "true" : "false");
    },

    setListView(state, value) {
      state.isListView = value;
      localStorage.setItem("isListView", state.isListView ? "true" : "false");
    },
  },
});
