import {
  mockBibliografia,
  mockCovers,
  mockUserData,
  mockSettings,
} from "../mocks/globalMocks.js";
// console.log("mockBibliografia:", mockBibliografia);
// console.log("mockCovers:", mockCovers);
// console.log("mockUserData:", mockUserData);
// console.log("mockSettings:", mockSettings);
import "../stubs/quasarStubs.js";
import "../mocks/globalMocks.js";
import quasarStubs from "../stubs/quasarStubs.js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import BookImages from "components/BookImages.vue";
import { useUserStore } from "stores/userStore";
import { useCoversStore } from "stores/coversStore.js";
import { useBibliografiaStore } from "stores/bibliografiaStore.js";
import { useUndoStore } from "stores/undoStore";
import { mockNotify } from "../mocks/globalMocks.js";
import { addImage, deleteImage, convertAndUploadImage } from "utils/imageUtils";
import { syncBook } from "utils/firebaseDatabaseUtils";

vi.mock("utils/firebaseDatabaseUtils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    syncBook: vi.fn(),
  };
});

import { connectStorageEmulator } from "firebase/storage";

describe("BookImages.vue", () => {
  let wrapper;
  let pinia;
  let userStore;
  let coversStore;
  let bibliografiaStore;
  const defaultBookId = "testBookId";
  const singleImgeBookId = "singleImageTestBook";

  beforeEach(async () => {
    syncBook.mockClear();

    // Crea una nuova istanza di Pinia per ogni test
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });

    // Inizializza gli store
    userStore = useUserStore();
    userStore.$patch({ settings: mockSettings });

    bibliografiaStore = useBibliografiaStore();
    bibliografiaStore.$patch({ bibliografia: mockBibliografia });

    coversStore = useCoversStore();
    coversStore.$patch({ covers: mockCovers });

    wrapper = mount(BookImages, {
      global: {
        plugins: [pinia],
        stubs: quasarStubs,
      },
      props: {
        bookId: defaultBookId,
      },
    });
    // Accedere ai dati del componente
    //console.log("wrapper html:", wrapper.html());

    // Visualizzare il DOM renderizzato

    await wrapper.vm.$nextTick();
    vi.useFakeTimers();


  });
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
    pinia = null;
    vi.clearAllMocks();
    vi.useRealTimers();
  });
  describe("Component Mounting", () => {
    it("mounts successfully", () => {
      expect(wrapper.exists()).toBe(true);
    });

    it("loads images on mount", async () => {
      expect(wrapper.vm.images).toHaveLength(2);
      expect(wrapper.vm.images[0].name).toBe("test-image.jpg");
      expect(wrapper.vm.images[1].name).toBe("test-image2.jpg");
    });
  });

  describe("Admin Functionality", () => {
    it("shows uploader for admin users", async () => {
      expect(wrapper.vm.isFieldEditable).toBe(true);
      //console.log("in test wrapper.html():\n", wrapper.html());

      const uploader = wrapper.find(".q-uploader");
      //console.log("uploder", uploader.html());
      expect(uploader.exists()).toBe(true);
      expect(uploader.isVisible()).toBe(true);
    });

    it("shows delete icon for admin users", async () => {
      const deleteIcon = wrapper.find(".delete-icon");
      expect(deleteIcon.exists()).toBe(true);
    });

    it("shows cover type selector for admin users", async () => {
      const coverSelect = wrapper.find(".q-select");
      expect(coverSelect.exists()).toBe(true);
      const select = coverSelect.find("select");
      expect(select.attributes("disabled")).toBeUndefined();
    });
  });

  describe("Image Management", () => {
    it("handles image deletion", async () => {
      const deleteIcon = wrapper.find(".delete-icon");
      expect(deleteIcon.exists()).toBe(true);

      await deleteIcon.trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.confirmDialogVisible).toBe(true);

      wrapper.vm.tempImageIndex = 0;
      //console.log("deleteImage function:", deleteImage);
      //console.log("Is mock function?", vi.isMockFunction(deleteImage));
      const deleteImageSpy = vi.spyOn(wrapper.vm, 'deleteImage');
      await wrapper.vm.deleteImageConfirmed();
      expect(deleteImageSpy).toHaveBeenCalledWith(defaultBookId, 0);
    });

    it("handles image upload", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const uploader = wrapper.find(".q-uploader");
      expect(uploader.exists()).toBe(true);
      const input = uploader.find("input[type='file']");
      Object.defineProperty(input.element, "files", { value: [file] });
      await input.trigger("change");
      expect(convertAndUploadImage).toHaveBeenCalledWith(
        file,
        defaultBookId,
        0,
      );
    });

    it("chiama syncBook solo se coverId non è già presente nelle immagini", async () => {
      const immagini = wrapper.vm.images;
      expect(immagini).toBeDefined();
      const coverIdsEsistenti = immagini.map((img) => img.coverTypeId);
      const nuovoCoverId = "5FPqY3QuqLHe8snQwAVNUz";
      expect(coverIdsEsistenti.includes(nuovoCoverId)).toBe(false);

      const coverSelect = wrapper.find(".q-select");
      expect(coverSelect.exists()).toBe(true);
      const select = coverSelect.find("select");
      select.element.value = nuovoCoverId;
      await select.trigger("change");

      // Dovrebbe chiamare syncBook perché il coverId non è duplicato
      expect(syncBook).toHaveBeenCalledWith({
        bookId: "testBookId",
        book: expect.objectContaining({
          images: expect.arrayContaining([
            expect.objectContaining({ coverTypeId: nuovoCoverId }),
          ]),
        }),
      });
    });

    it("non chiama syncBook se coverId è già presente nelle immagini", async () => {
      await wrapper.vm.$nextTick();
      const immagini = wrapper.vm.images;
      expect(immagini).toBeDefined();
      const coverIdEsistente = immagini[1].coverTypeId;
      const coverSelect = wrapper.find(".q-select");
      expect(coverSelect.exists()).toBe(true);
      const select = coverSelect.find("select");
      select.element.value = coverIdEsistente;
      await select.trigger("change");
      // Non dovrebbe chiamare syncBook perché il coverId è duplicato
      expect(syncBook).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("shows error notification on upload failure", async () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const uploader = wrapper.find(".q-uploader");
      expect(uploader.exists()).toBe(true);
      const input = uploader.find("input[type='file']");
      Object.defineProperty(input.element, "files", { value: [file] });
      await input.trigger('change');
      expect(mockNotify.create).toHaveBeenCalledWith({
        message: "Only JPG, JPEG, and PNG files are allowed.",
        type: "negative",
        color: "red",
      });
    });

    it("shows error notification on deletion failure for singleImageTestBook", async () => {
      await wrapper.setProps({
        bookId: "singleImageTestBook",
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.images.length).toBe(1);

      wrapper.vm.tempImageIndex = 0;
      await wrapper.vm.deleteImageConfirmed();

      expect(mockNotify.create).toHaveBeenCalledWith({
        message: "Failed to delete image: Cannot delete the last image",
        type: "negative",
        color: "red",
        timeout: 3000,
      });
    });
  });

  describe("Edge Cases", () => {
    it("prevents deletion of last image", async () => {
      wrapper.unmount();

      // rimonta con prop diversa
      wrapper = mount(BookImages, {
        global: {
          plugins: [pinia],
          stubs: quasarStubs,
        },
        props: {
          bookId: singleImgeBookId,
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.images.length).toBe(1);

      wrapper.vm.tempImageIndex = 0;
      await wrapper.vm.deleteImageConfirmed();

      expect(Notify.create).toHaveBeenCalledWith({
        message: "Failed to delete image: Cannot delete the last image",
        type: "negative",
        color: "red",
        timeout: 3000,
      });
    });
  });

  describe("User Permissions", () => {
    let wrapper;
    let userStore;

    beforeEach(async () => {
      // Aggiungi async
      // Usa la stessa istanza di pinia creata nel beforeEach principale
      userStore = useUserStore();

      // Configura lo store prima del mount
      userStore.$patch({
        settings: {
          theme: "light",
          notifications: true,
          isAdmin: true,
          superadmin: true,
        },
      });

      wrapper = mount(BookImages, {
        props: {
          bookId: "testBookId",
          bookData: mockBibliografia.find((b) => b.id === "testBookId"),
          options: mockCovers,
        },
        global: {
          plugins: [pinia], // Usa l'istanza esistente invece di createPinia()
          stubs: quasarStubs,
        },
      });

      await wrapper.vm.$nextTick();
    });

    it("nasconde le icone di aggiunta/cancellazione per utenti non admin", async () => {
      userStore.settings.isAdmin = false;
      await wrapper.vm.$nextTick();

      const addIcon = wrapper.find(".add-icon");
      const deleteIcon = wrapper.find(".delete-icon");

      expect(addIcon.exists()).toBe(false);
      expect(deleteIcon.exists()).toBe(false);
    });

    it("nasconde le azioni per admin senza superadmin", async () => {
      userStore.settings.isAdmin = true;
      userStore.settings.superadmin = false;
      await wrapper.vm.$nextTick();

      const addIcon = wrapper.find(".add-icon");
      expect(addIcon.exists()).toBe(false);
    });
  });

  describe("Image Upload Handling", () => {
    beforeEach(async () => {
      // Non resettare pinia._s, invece usa una nuova istanza di Pinia
      pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      });

      userStore = useUserStore();
      coversStore = useCoversStore();
      bibliografiaStore = useBibliografiaStore();

      // Configura gli store
      userStore.$patch({
        settings: {
          theme: "light",
          notifications: true,
          superadmin: true,
          isAdmin: true,
        },
      });

      coversStore.$patch({ covers: mockCovers });
      bibliografiaStore.$patch({
        bibliografia: [mockBibliografia.find((b) => b.id === defaultBookId)],
      });
      wrapper.unmount();

      // rimonta con prop diversa
      wrapper = mount(BookImages, {
        global: {
          plugins: [pinia],
          stubs: quasarStubs,
        },
        props: {
          bookId: defaultBookId,
          options: mockCovers,
        },
      });

      await wrapper.vm.$nextTick();
    });

    it("carica le immagini dopo il mount", () => {
      expect(wrapper.vm.images).toHaveLength(2);
      expect(wrapper.vm.images[0].name).toBe("test-image.jpg");
    });

    it("non permette upload di file non immagine", async () => {
      const file = new File(["text"], "test.txt", { type: "text/plain" });
      const uploader = wrapper.find("input[type='file']");
      Object.defineProperty(uploader.element, "files", { value: [file] });

      await uploader.trigger("change");

      expect(mockNotify.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Only JPG, JPEG, and PNG files are allowed.",
          type: "negative",
        }),
      );
    });

    it("rimuove l'immagine correttamente", async () => {
      const deleteIcon = wrapper.find(".delete-icon");
      expect(deleteIcon.exists()).toBe(true);

      await deleteIcon.trigger("click");
      expect(wrapper.vm.confirmDialogVisible).toBe(true);

      wrapper.vm.tempImageIndex = 0;
      const deleteImageSpy = vi.spyOn(wrapper.vm, 'deleteImage');
      await wrapper.vm.deleteImageConfirmed();

      expect(deleteImageSpy).toHaveBeenCalledWith(defaultBookId, 0);
    });

    // Se serve testare con bookId diverso, in quel test specifico fai un mount a parte
  });

  describe("Undo Functionality", () => {
    it("scatena l'evento undoTimeout alla scadenza del timeout", async () => {
      // Preparazione: imposta l'indice e chiama la funzione
      wrapper.vm.tempImageIndex = 0;
      await wrapper.vm.deleteImageConfirmed();

      // Mettiamo un listener sul document per l'evento custom
      const onUndoTimeout = vi.fn();
      document.addEventListener("undoTimeout", onUndoTimeout);

      // Avanziamo di 5000ms
      vi.advanceTimersByTime(5000);

      // Controllo: il listener è stato chiamato
      expect(onUndoTimeout).toHaveBeenCalled();

      // Pulizia
      document.removeEventListener("undoTimeout", onUndoTimeout);
    });
    it("invoca il handler di Undo quando premi il pulsante", async () => {
      // Preparazione e chiamata iniziale
      wrapper.vm.tempImageIndex = 0;
      await wrapper.vm.deleteImageConfirmed();

      // Prendiamo l'ultimo argomento passato a Notify.create
      const notifyCallWithUndo = mockNotify.create.mock.calls.find(call => 
        call[0] && call[0].actions && call[0].actions.some(a => a.label === "Undo")
      );
      expect(notifyCallWithUndo).toBeDefined();
      const notifyArg = notifyCallWithUndo[0];
      const undoAction = notifyArg.actions.find((a) => a.label === "Undo");

      // Spy sullo store di undo
      const undoStore = useUndoStore();
      const undoSpy = vi.spyOn(undoStore, "undoLastOperation");

      // Invoca il handler come se avessimo cliccato “Undo”
      await undoAction.handler();

      // Verifica che undoStore.undoLastOperation() sia stato effettivamente chiamato
      expect(undoSpy).toHaveBeenCalled();

      // (Opzionale) verifica che, dopo l’undo, la UI o lo store siano aggiornati
      // es. expect(wrapper.vm.images).toHaveLength( /* lunghezza originale */ );
    });
  });
});
