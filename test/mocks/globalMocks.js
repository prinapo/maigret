// test/mocks/globalMocks.js
import { ref } from "vue";
import { vi } from "vitest";
export const testValue = 123;

export const mockBibliografia = [
  {
    id: "testBookId",
    titolo: "Test",
    autore: "prova",
    annoPubblicazione: "df",
    annoScrittura: "sdfs",
    collana: "d6348523-bb83-4278-9274-2f6b1bcf05f6",
    editore: "b5b03d6b-036d-4ef3-85ac-cd294dbb0e69",
    lingua: "7ArgJ9Nkzb7QG5f7tTU56h",
    numero: "0",
    numeroCollana: "9",
    posseduto: true,
    confermato: "si",
    titolo: "Test",
    raccolta: "f",
    bookLastUpdate: 1720682307041,
    images: [
      {
        id: "wyn4LA4tc7fcLvvt2ez7SK",
        name: "test-image.jpg",
        timestamp: 1739436603897,
        coverTypeId: "cover1",
      },
      {
        id: "p4MG8DoStEKvWmPcFuTxiv",
        name: "test-image2.jpg",
        timestamp: 1747402411258,
        coverTypeId: "cover2",
      },
    ],
    edizioni: [
      {
        anno: 1900,
        numero: 1,
        posseduto: false,
        uuid: "92dRJbKZAEzp1kCE9FauNS",
      },
      {
        anno: 1900,
        numero: 1,
        posseduto: false,
        uuid: "cjRFEGnky7m1YQU9szn9S2",
      },
      {
        anno: 1900,
        numero: 1,
        posseduto: true,
        uuid: "ratxRvKa95TAgzSLiwWo2b",
      },
      {
        anno: 1900,
        numero: 1,
        posseduto: false,
        uuid: "i6Vkf16XpsDTpw5ZhiuvLq",
      },
    ],
  },
  {
    id: "singleImageTestBook",
    titolo: "Titolo di Prova",
    annoPubblicazione: "1945",
    editore: "91d305ef-30b1-47d2-ae9c-22674b76b3f1",
    collana: "555171d9-7120-4d8f-a910-eb1da28271a2",
    lingua: "7ArgJ9Nkzb7QG5f7tTU56h",
    numero: "",
    bookLastUpdate: 1720682307041,
    images: [
      {
        id: "nLHaP5L4cnywYxUBoVLjqh",
        name: "nLHaP5L4cnywYxUBoVLjqh.png",
        timestamp: 1741881432948,
        coverTypeId: "hAvDZKHe436U4op9zut45E",
      },
    ],
    edizioni: [
      {
        anno: 1901,
        numero: "1",
        uuid: "3d94322f-e60c-4bb1-a0bd-c4674d0aaa49",
        backCoverUrl: "dummy",
        borderCoverUrl: "dummy",
        frontCoverUrl: "dummy",
      },
      {
        anno: 1900,
        numero: "1",
        uuid: "95kzQexhEAgkMJdj3qo2Wz",
        backCoverUrl: "dummy",
        borderCoverUrl: "dummy",
        frontCoverUrl: "dummy",
      },
      // ... altre edizioni simili
      {
        anno: 1900,
        numero: "1",
        uuid: "wWjdgpKhj9hQVj34EPAr7N",
        immagini: [
          {
            /* dettaglio immagini */
          },
        ],
      },
    ],
  },
];

export const mockCovers = [
  {
    value: "5FPqY3QuqLHe8snQwAVNUz",
    label: "Seconda di copertina (aletta anteriore)",
  },
  {
    value: "aezrAwYV4ez6XVSmjy7FHw",
    label: "Frontespizio (pagina interna con Autore Titolo e Editore)",
  },
  { value: "hAvDZKHe436U4op9zut45E", label: "Dorso" },
  { value: "j7DLr3jEyN13U4mvwueYuo", label: "sconosciuta" },
  { value: "jAkMzxmRVCcCVRUwGbjmvN", label: "Colophon (dati edioriali)" },
  { value: "k3ysndTkWdDi9AEZwy2jTp", label: "Indice" },
  {
    value: "neoyx5F9pyCGic5YxehrSM",
    label: "Occhiello (pagina interna con il titolo)",
  },
  { value: "ppMZiW1Yy3EV5xkw6x1Mti", label: "Quarta di copertina" },
  { value: "qNvdwFMLNt2Uz7JjqTjacu", label: "Prima di copertina" },
  {
    value: "sAdhEakJ96NuLDB2nr85qR",
    label: "Terza di copertina (aletta posteriore)",
  },
];

export const mockUserData = {
  uid: "mock-uid",
  email: "mock@example.com",
  displayName: "Mock User",
  photoURL: "https://placekitten.com/100/100",
};

export const mockBookPosseduti = ["book1", "book2"];
export const mockSettings = {
  theme: "dark",
  notifications: true,
  lingua: "it",
  superadmin: true,
  isAdmin: true,
};

// Mock Notify
export const mockNotify = {
  create: vi.fn(),
  setDefaults: vi.fn(),
  registerType: vi.fn(),
};



// Mock firebaseDatabaseUtils
vi.mock("@/utils/firebaseDatabaseUtils", () => ({
  syncBook: vi.fn(),
}));

// Mock Quasar Notify interamente
vi.mock("quasar", async () => {
  const quasar = await vi.importActual("quasar");
  return {
    ...quasar,
    Notify: {
      create: mockNotify.create,
      setDefaults: mockNotify.setDefaults,
      registerType: mockNotify.registerType,
    },
  };
});

// Mock imageUtils
// In the mock implementation
console.log("Mocking imageUtils");

vi.mock("@/utils/imageUtils", async () => ({
  ...(await vi.importActual("@/utils/imageUtils")),
  deleteImage: vi.fn().mockImplementation((bookId, imageIndex, onUndo) => {
    mockNotify.create({
      html: true,
      position: "bottom",
      timeout: 5000,
      color: "primary",
      message: "Immagine eliminata.",
      actions: [
        {
          label: "Undo",
          color: "white",
          handler: onUndo
        }
      ]
    });
    // Simula il timeout per l'undo
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("undoTimeout"));
    }, 5000);
    return Promise.resolve({ trashEntryId: "mock-trash-id" });
  }),
  addImage: vi.fn().mockImplementation(() => {
    return Promise.resolve([
      { id: "img1", name: "test-image.jpg", coverTypeId: "cover1" },
      { id: "img2", name: "test-image2.jpg", coverTypeId: "cover2" },
    ]);
  }),
  convertAndUploadImage: vi.fn().mockImplementation((file) => {
    if (file.type.includes("image/")) {
      return Promise.resolve([
        {
          id: "converted1",
          name: "converted.jpg",
          type: "image/jpeg",
        },
      ]);
    }
    return Promise.reject(new Error("Invalid file type"));
  }),
}));
// Mock undoStore
vi.mock("../../stores/undoStore", () => ({
  useUndoStore: () => ({
    updateUndoTrash: vi.fn(),
    clearUndo: vi.fn(),
  }),
}));

// Mock userStore
vi.mock("../../stores/userStore", () => ({
  useUserStore: () => ({
    userData: ref(mockUserData),
    libriPosseduti: ref(mockBookPosseduti),
    settings: ref(mockSettings),
    userNotFound: ref(false),
    loading: ref(false),
    initAuthListener: vi.fn().mockResolvedValue(),
    updateUserSetting: vi.fn(),
  }),
}));

// Mock database stores

vi.mock("../../stores/database", () => ({
  useBibliografiaStore: () => {
    const bibliografia = ref(mockBibliografia);
    return {
      bibliografia,
      error: ref(null),
      lastError: ref(null),
      loadBibliografia: vi.fn().mockResolvedValue(),
      addBook: vi.fn(),
      removeBook: vi.fn(),
      updatePosseduto: vi.fn(),
      $patch: (patchObj) => {
        if (patchObj.bibliografia) {
          bibliografia.value = patchObj.bibliografia;
        }
      },
    };
  },
  useCoversStore: () => {
    const covers = ref(mockCovers);
    return {
      covers,
      error: ref(null),
      loadCovers: vi.fn().mockResolvedValue(),
      $patch: (patchObj) => {
        if (patchObj.covers) {
          covers.value = patchObj.covers;
        }
      },
    };
  },
}));
