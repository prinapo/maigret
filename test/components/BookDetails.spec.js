import { describe, it, expect, vi, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import BookDetails from "src/components/BookDetails.vue";
import { useBibliografiaStore } from "src/stores/bibliografiaStore";

const bookId = "test-book-id";

let bookDetailsConfig;
beforeAll(async () => {
  // Import dinamico ESM
  const mod = await import("../../src/config/bookDetailsConfig.js");
  bookDetailsConfig = mod.bookDetailsConfig;
});

describe("BookDetails.vue", () => {
  it("non mostra nulla se il libro non esiste", () => {
    const wrapper = mount(BookDetails, {
      props: { bookId },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bibliografiaStore: { bibliografia: [] },
              userStore: { hasPermission: () => true },
              editoriStore: { editori: [] },
              collaneStore: { collane: [] },
              lingueStore: { lingue: [] },
            },
          }),
        ],
        stubs: { QInput: true, QSelect: true },
      },
    });
    expect(wrapper.vm.visibleFields.length).toBe(0);
  });

  it("mostra tutti i campi (anche vuoti) se manager e dati parziali", async () => {
    const bookMock = Object.fromEntries(
      bookDetailsConfig.map((f) => [
        f.id,
        f.id === "titolo"
          ? "Titolo di Test"
          : f.id === "autore"
            ? "Autore di Test"
            : "",
      ]),
    );
    bookMock.id = bookId;
    const wrapper = mount(BookDetails, {
      props: { bookId },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bibliografiaStore: { bibliografia: [] },
              userStore: { hasPermission: () => true },
              editoriStore: { editori: [] },
              collaneStore: { collane: [] },
              lingueStore: { lingue: [] },
            },
          }),
        ],
        stubs: { QInput: true, QSelect: true },
        mocks: { $t: (msg) => msg },
      },
    });
    // Patch lo store Pinia dopo il mount
    const store = useBibliografiaStore();
    store.$patch({ bibliografia: [bookMock] });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.visibleFields.length).toBe(3);
    expect(wrapper.vm.visibleFields.map((f) => f.id).sort()).toEqual(
      ["titolo", "autore", "id"].sort(),
    );
  });

  it("mostra solo i campi valorizzati se non manager", async () => {
    const bookMock = Object.fromEntries(
      bookDetailsConfig.map((f) => [
        f.id,
        f.id === "titolo" ? "Titolo di Test" : "",
      ]),
    );
    bookMock.id = bookId;
    const wrapper = mount(BookDetails, {
      props: { bookId },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bibliografiaStore: { bibliografia: [] },
              userStore: { hasPermission: () => false },
              editoriStore: { editori: [] },
              collaneStore: { collane: [] },
              lingueStore: { lingue: [] },
            },
          }),
        ],
        stubs: { QInput: true, QSelect: true },
      },
    });
    const store = useBibliografiaStore();
    store.$patch({ bibliografia: [bookMock] });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.visibleFields.length).toBe(2);
    expect(wrapper.vm.visibleFields.map((f) => f.id).sort()).toEqual(
      ["titolo", "id"].sort(),
    );
  });
});
