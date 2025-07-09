/*
Test generici BookDetails.vue:
- Mostra nulla se libro non esiste
- Edge case/fallback
*/

import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import BookDetails from "src/components/BookDetails.vue";
import { createTestingPinia } from "@pinia/testing";

const bookMock = {
  id: "book-1",
  titolo: "Il titolo",
};

function mountWithStores(book = bookMock) {
  const pinia = createTestingPinia({
    initialState: {
      bibliografia: { bibliografia: [book] },
    },
    stubActions: false,
  });
  return mount(BookDetails, {
    global: {
      plugins: [pinia],
      mocks: { $t: (msg) => msg },
    },
    props: { bookId: book.id },
  });
}

describe("BookDetails.vue generici", () => {
  it("mostra nulla se il libro non esiste", async () => {
    const pinia = createTestingPinia({
      initialState: {
        bibliografia: { bibliografia: [] },
      },
      stubActions: false,
    });
    const wrapper = mount(BookDetails, {
      global: {
        plugins: [pinia],
        mocks: { $t: (msg) => msg },
      },
      props: { bookId: "not-found" },
    });
    await flushPromises();
    expect(wrapper.html()).not.toContain("Titolo");
  });
  // Altri test edge/fallback qui...
});
