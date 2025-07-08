import { ref } from "vue";
vi.mock("stores/userStore", () => ({
  useUserStore: () => ({
    hasPermission: () => false,
    settings: ref({}),
    $patch: vi.fn(),
    $reset: vi.fn(),
  }),
}));

import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import BookImages from "components/BookImages.vue";

describe("BookImages.vue non-admin (mock ESM hasPermission false + Pinia)", () => {
  it("isFieldEditable è false e non mostra uploader nel virtual scroll", () => {
    const bookId = "userbook";
    const bookData = {
      id: bookId,
      edizioni: [1],
      images: [
        { id: "img1", name: "img1", url: "test1.jpg" },
        { id: "img2", name: "img2", url: "test2.jpg" },
      ],
    };
    const pinia = createTestingPinia({
      initialState: {
        bibliografia: {
          bibliografia: [bookData],
        },
      },
      stubActions: false,
    });
    const wrapper = mount(BookImages, {
      props: { bookId },
      global: {
        plugins: [pinia],
        stubs: {
          "q-virtual-scroll": {
            props: ["items"],
            template: `
              <div>
                <slot v-for=\"(item, index) in items\" :item=\"item\" :index=\"index\" />
              </div>
            `,
          },
        },
      },
    });
    console.log("Dati libro usati:", JSON.stringify(bookData, null, 2));
    console.log("isFieldEditable:", wrapper.vm.isFieldEditable);
    const uploaders = wrapper.findAll(".q-uploader");
    console.log("Numero di .q-uploader trovati:", uploaders.length);
    expect(wrapper.vm.isFieldEditable).toBe(false);
    expect(uploaders.length).toBe(0);
  });
});
