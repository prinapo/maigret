// Define visibility levels based on permissions
export const VISIBILITY = {
  PUBLIC: "public", // Anyone can see
  READ_BASIC: "read_basic", // Users with basic read permission
  READ_ADVANCED: "read_advanced", // Users with advanced read permission
  READ_ADMIN: "read_admin", // Users with admin read permission
  READ_SYSTEM: "read_system", // Users with system read permission
};

export const bookDetailsConfig = [
  // Dettagli Principali - Public Information
  {
    id: "titolo",
    label: "Titolo",
    type: "text",
    section: "Dettagli Principali",
    sectionOrder: 0,
    visibility: VISIBILITY.PUBLIC,
  },
  {
    id: "editore",
    label: "Editore",
    type: "select",
    options: "editori",
    section: "Dettagli Principali",
    sectionOrder: 0,
    visibility: VISIBILITY.PUBLIC,
    store: {
      use: "useEditoriStore",
      name: "editoriStore",
      labelField: "editore",
    },
  },
  {
    id: "collana",
    label: "Collana",
    type: "select",
    options: "collane",
    section: "Dettagli Principali",
    sectionOrder: 0,
    visibility: VISIBILITY.PUBLIC,
    store: {
      use: "useCollaneStore",
      name: "collaneStore",
      labelField: "collana",
    },
  },
  {
    id: "numeroCollana",
    label: "Numero Collana",
    type: "text",
    section: "Dettagli Principali",
    sectionOrder: 0,
    visibility: VISIBILITY.PUBLIC,
  },
  {
    id: "autore",
    label: "Autore",
    type: "text",
    section: "Dettagli Principali",
    sectionOrder: 0,
    visibility: VISIBILITY.PUBLIC,
  },

  // Dettagli Secondari - Collector Information
  {
    id: "traduttore",
    label: "Traduttore",
    type: "text",
    section: "Dettagli Secondari",
    sectionOrder: 1,
    visibility: VISIBILITY.READ_BASIC,
  },
  {
    id: "annoScrittura",
    label: "Anno Scrittura",
    type: "text",
    section: "Dettagli Secondari",
    sectionOrder: 1,
    visibility: VISIBILITY.READ_BASIC,
  },
  {
    id: "annoPubblicazione",
    label: "Anno Pubblicazione",
    type: "text",
    section: "Dettagli Secondari",
    sectionOrder: 1,
    visibility: VISIBILITY.READ_BASIC,
  },

  {
    id: "lingua",
    label: "Lingua",
    type: "select",
    options: "lingue",
    section: "Dettagli Secondari",
    sectionOrder: 1,
    visibility: VISIBILITY.PUBLIC,
    store: {
      use: "useLingueStore",
      name: "lingueStore",
      labelField: "lingua",
    },
  },

  // Dettagli Terzi - Admin Information
  {
    id: "ISBN",
    label: "ISBN",
    type: "text",
    section: "Dettagli Terzi",
    sectionOrder: 3,
    visibility: VISIBILITY.READ_ADVANCED,
  },
  {
    id: "copertina",
    label: "Copertina",
    type: "text",
    section: "Dettagli Terzi",
    sectionOrder: 3,
    visibility: VISIBILITY.READ_ADVANCED,
  },
  {
    id: "contiene",
    label: "Contiene",
    type: "text",
    section: "Dettagli Terzi",
    sectionOrder: 3,
    visibility: VISIBILITY.READ_ADVANCED,
  },
  {
    id: "raccolta",
    label: "Raccolta",
    type: "text",
    section: "Dettagli Terzi",
    sectionOrder: 3,
    visibility: VISIBILITY.READ_ADVANCED,
  },

  // Dettagli Sistema - SuperAdmin Information
  {
    id: "id",
    label: "Id",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "bookLastUpdate",
    label: "Ultimo Aggiornamento",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "timestamp",
    label: "Data Creazione",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "confermato",
    label: "Confermato",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "deleted",
    label: "Cancellato",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "images",
    label: "Images",
    type: "array",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "defaultImageName",
    label: "Default Image Name",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "signedUrl",
    label: "Signed Url",
    type: "array",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "signedUrlBrd",
    label: "Signed Url Brd",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
  {
    id: "signedUrlBck",
    label: "Signed Url Bck",
    type: "text",
    section: "Dettagli Sistema",
    sectionOrder: 4,
    visibility: VISIBILITY.READ_SYSTEM,
  },
];
