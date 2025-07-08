import { mount } from "@vue/test-utils";
import BibliografiaPage from "src/pages/BibliografiaPage.vue";
import { createTestingPinia } from "@pinia/testing";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { vi } from "vitest";
import { QLayout, QPageContainer } from "quasar";

// Mock edizioniUtils per evitare errori di Pinia fuori contesto
vi.mock("utils/edizioniUtils", () => ({
  // esporta funzioni vuote o mockate se necessario
  getEdizioniForBook: () => [],
}));

// Mock useQuasar per fornire loading.show/hide
vi.mock("quasar", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuasar: () => ({
      loading: {
        show: vi.fn(),
        hide: vi.fn(),
      },
    }),
  };
});

// Importa gli store per mutare canCollectBooks dopo il mount
import { useUserStore } from "stores/userStore";
import { useBibliografiaStore } from "stores/bibliografiaStore";
import { useFiltersStore } from "stores/filtersStore";
import { useEditoriStore } from "stores/editoriStore";
import { useCollaneStore } from "stores/collaneStore";
import { useLingueStore } from "stores/lingueStore";

// Funzione di utilità per simulare il merge reale nei test
function mergeBibliografiaConUtenteTest(bibliografiaStore, userStore) {
  const booksRaw = bibliografiaStore.booksRaw || [];
  const booksUtente = userStore.books || [];
  const merged = booksRaw.map((book) => {
    const userBook = booksUtente.find((b) => b.bookId === book.id);
    const edizioniConPossesso = (book.edizioni || []).map((ed) => {
      const posseduta =
        userBook?.edizioni?.some(
          (ue) =>
            ue.uuid === ed.uuid &&
            (ue.posseduta === true || ue.posseduto === true),
        ) ?? false;
      return {
        ...ed,
        posseduta,
      };
    });
    const posseduto = edizioniConPossesso.some((ed) => ed.posseduta === true);
    return {
      ...book,
      edizioni: edizioniConPossesso,
      posseduto,
    };
  });
  bibliografiaStore.updateBibliografia(merged);
}

// Utility per generare libri di test con edizioni coerenti
function makeBook({
  id,
  titolo,
  posseduto,
  defaultImageName,
  edizioniCount = 1,
}) {
  const edizioni = Array.from({ length: edizioniCount }, (_, i) => ({
    uuid: `ed${id}_${i + 1}`,
  }));
  return {
    id,
    titolo,
    posseduto,
    defaultImageName,
    edizioni,
  };
}

// Wrapper per testare BibliografiaPage dentro QLayout e QPageContainer
const TestLayoutWrapper = {
  components: { QLayout, QPageContainer, BibliografiaPage },
  template: `<q-layout><q-page-container><BibliografiaPage /></q-page-container></q-layout>`,
};

function mountPage({
  bibliografia = [],
  canCollect = false,
  userStore = {},
  filters = {},
  editori = [],
  collane = [],
  lingue = [],
}) {
  // Crea la pinia e popola gli store PRIMA del mount
  const pinia = createPinia();
  setActivePinia(pinia);
  // Popola gli store
  const bibliografiaStore = useBibliografiaStore();
  const user = useUserStore();
  bibliografiaStore.booksRaw = bibliografia;
  user.books = (bibliografia || []).map((b) => ({
    bookId: b.id,
    edizioni: (b.edizioni || []).map((ed) => ({
      uuid: ed.uuid,
      posseduta: b.posseduto === true,
    })),
    posseduto: b.posseduto === true,
  }));
  user.user = {
    role: userStore.role || "user",
    permissions: canCollect ? ["collect_books"] : [],
    ...userStore,
  };
  const filtersStore = useFiltersStore();
  filtersStore.filters = {
    orderBy: [],
    search: "",
    selectedEditori: [],
    selectedCollane: [],
    lingua: [],
    posseduto: [],
    ...filters,
  };
  useEditoriStore().editori = editori;
  useCollaneStore().collane = collane;
  useLingueStore().lingue = lingue;
  // Simula il merge reale
  mergeBibliografiaConUtenteTest(bibliografiaStore, user);
  // Monta il wrapper che include QLayout e BibliografiaPage
  const wrapper = mount(TestLayoutWrapper, {
    global: {
      plugins: [pinia],
      stubs: [
        "BookDetailContent",
        "q-img",
        "q-badge",
        "q-icon",
        "q-spinner",
        "q-dialog",
        "q-btn",
        "q-card-section",
        "BookEditions",
      ],
    },
  });
  // Ritorna il wrapper del layout, ma i test dovranno cercare i badge dentro wrapper.findComponent(BibliografiaPage)
  return wrapper.findComponent({ name: "BibliografiaPage" });
}

describe("BibliografiaPage - Visualizzazione badge posseduto", () => {
  let pinia;
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it("non mostra badge se utente non ha profilo (userStore vuoto)", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: true,
        defaultImageName: "img1.jpg",
      }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: false,
        defaultImageName: "img2.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books });
    await nextTick();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(0);
  });

  it("non mostra badge se utente non può collezionare", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: true,
        defaultImageName: "img1.jpg",
      }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: false,
        defaultImageName: "img2.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: false });
    await nextTick();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(0);
  });

  it("non mostra badge se utente può collezionare ma nessun libro è posseduto", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: false,
        defaultImageName: "img1.jpg",
      }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: false,
        defaultImageName: "img2.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: true });
    await nextTick();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(0);
  });

  it("mostra badge solo per i libri posseduti se utente può collezionare", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: true,
        defaultImageName: "img1.jpg",
      }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: true,
        defaultImageName: "img2.jpg",
      }),
      makeBook({
        id: 3,
        titolo: "Libro 3",
        posseduto: false,
        defaultImageName: "img3.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: true });
    await nextTick();
    await wrapper.vm.$forceUpdate();
    const badges = wrapper.findAll(".posseduto-badge");
    expect(badges.length).toBe(2);
  });

  it("mostra badge per ogni edizione posseduta se utente può collezionare", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: true,
        defaultImageName: "img1.jpg",
      }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: true,
        defaultImageName: "img2.jpg",
      }),
      makeBook({
        id: 3,
        titolo: "Libro 3",
        posseduto: true,
        defaultImageName: "img3.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: true });
    await nextTick();
    await wrapper.vm.$forceUpdate();
    const badges = wrapper.findAll(".posseduto-badge");
    expect(badges.length).toBe(3);
  });

  it("non mostra badge se il libro non ha il campo posseduto (undefined/null)", async () => {
    const books = [
      makeBook({ id: 1, titolo: "Libro 1", defaultImageName: "img1.jpg" }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: null,
        defaultImageName: "img2.jpg",
      }),
      makeBook({
        id: 3,
        titolo: "Libro 3",
        posseduto: undefined,
        defaultImageName: "img3.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: true });
    await nextTick();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(0);
  });

  it("aggiorna la visualizzazione dei badge se canCollectBooks cambia dopo il mount", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: true,
        defaultImageName: "img1.jpg",
      }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: true,
        defaultImageName: "img2.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: false });
    await nextTick();
    await wrapper.vm.$forceUpdate();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(0);
    // Cambia permesso dinamicamente
    const userStore = useUserStore();
    userStore.user = { role: "user", permissions: ["collect_books"] };
    await nextTick();
    await wrapper.vm.$forceUpdate();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(2);
    // Torna a false
    userStore.user = { role: "user", permissions: [] };
    await nextTick();
    await wrapper.vm.$forceUpdate();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(0);
  });

  it("non mostra badge se posseduto è false esplicito", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: false,
        defaultImageName: "img1.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: true });
    await nextTick();
    expect(wrapper.findAll(".posseduto-badge").length).toBe(0);
  });

  it("gestisce libri con proprietà extra o dati incompleti senza errori", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: true,
        defaultImageName: "img1.jpg",
        edizioniCount: 2,
      }),
      makeBook({ id: 2, titolo: "Libro 2", defaultImageName: "img2.jpg" }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: true });
    await nextTick();
    await wrapper.vm.$forceUpdate();
    // Solo il primo libro ha posseduto: true
    expect(wrapper.findAll(".posseduto-badge").length).toBe(1);
  });

  it("gestisce libri duplicati con stesso ID (edge case)", async () => {
    const books = [
      makeBook({
        id: 1,
        titolo: "Libro 1",
        posseduto: true,
        defaultImageName: "img1.jpg",
      }),
      makeBook({
        id: 1,
        titolo: "Libro 1 bis",
        posseduto: true,
        defaultImageName: "img1b.jpg",
      }),
      makeBook({
        id: 2,
        titolo: "Libro 2",
        posseduto: false,
        defaultImageName: "img2.jpg",
      }),
    ];
    const wrapper = mountPage({ bibliografia: books, canCollect: true });
    await nextTick();
    await wrapper.vm.$forceUpdate();
    // Solo i libri con posseduto: true hanno la label, anche se l'id è duplicato
    expect(wrapper.findAll(".posseduto-badge").length).toBe(2);
  });
});

describe("BibliografiaPage - Badge posseduto (test parametrizzato)", () => {
  const userCases = [
    {
      descrizione: "utente collector vede il badge se possiede il libro",
      user: { role: "user", permissions: ["collect_books"] },
      canCollect: true,
      posseduto: true,
      expectedBadge: 1,
    },
    {
      descrizione:
        "utente collector NON vede il badge se non possiede il libro",
      user: { role: "user", permissions: ["collect_books"] },
      canCollect: true,
      posseduto: false,
      expectedBadge: 0,
    },
    {
      descrizione:
        "utente senza permesso collector NON vede il badge anche se possiede il libro",
      user: { role: "user", permissions: [] },
      canCollect: false,
      posseduto: true,
      expectedBadge: 0,
    },
    {
      descrizione:
        "utente senza permesso collector NON vede il badge se non possiede il libro",
      user: { role: "user", permissions: [] },
      canCollect: false,
      posseduto: false,
      expectedBadge: 0,
    },
    {
      descrizione:
        "admin senza collect_books NON vede il badge anche se possiede il libro",
      user: { role: "admin", permissions: [] },
      canCollect: false,
      posseduto: true,
      expectedBadge: 0,
    },
    {
      descrizione: "admin con collect_books vede il badge se possiede il libro",
      user: { role: "admin", permissions: ["collect_books"] },
      canCollect: true,
      posseduto: true,
      expectedBadge: 1,
    },
    {
      descrizione:
        "superadmin senza collect_books NON vede il badge anche se possiede il libro",
      user: { role: "superadmin", permissions: [] },
      canCollect: false,
      posseduto: true,
      expectedBadge: 0,
    },
    {
      descrizione:
        "superadmin con collect_books vede il badge se possiede il libro",
      user: { role: "superadmin", permissions: ["collect_books"] },
      canCollect: true,
      posseduto: true,
      expectedBadge: 1,
    },
    {
      descrizione:
        "utente non loggato NON vede il badge anche se il libro è posseduto",
      user: null,
      canCollect: false,
      posseduto: true,
      expectedBadge: 0,
    },
    {
      descrizione: "utente collector vede badge su più libri posseduti",
      user: { role: "user", permissions: ["collect_books"] },
      canCollect: true,
      posseduto: [true, true, false],
      expectedBadge: 2,
    },
    {
      descrizione:
        "utente collector NON vede badge se nessun libro è posseduto",
      user: { role: "user", permissions: ["collect_books"] },
      canCollect: true,
      posseduto: [false, false, false],
      expectedBadge: 0,
    },
  ];

  userCases.forEach(
    ({ descrizione, user, canCollect, posseduto, expectedBadge }) => {
      it(descrizione, async () => {
        let books;
        if (Array.isArray(posseduto)) {
          books = posseduto.map((p, i) =>
            makeBook({
              id: i + 1,
              titolo: `Libro ${i + 1}`,
              posseduto: p,
              defaultImageName: `img${i + 1}.jpg`,
            }),
          );
        } else {
          books = [
            makeBook({
              id: 1,
              titolo: "Libro 1",
              posseduto: posseduto,
              defaultImageName: "img1.jpg",
            }),
          ];
        }
        const userStoreObj = user ? user : {};
        const wrapper = mountPage({
          bibliografia: books,
          canCollect,
          userStore: userStoreObj,
        });
        await nextTick();
        expect(wrapper.findAll(".posseduto-badge").length).toBe(expectedBadge);
      });
    },
  );
});
