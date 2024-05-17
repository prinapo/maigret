const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/",
        component: () => import("pages/BibliografiaPage.vue"),
      },
      {
        path: "/dettaglio/:id",
        name: "DettaglioLibro",
        component: () => import("pages/DettaglioLibro.vue"),
      },

      {
        path: "/login",
        name: "LoginPage",
        component: () => import("pages/LoginPage.vue"),
      },
      {
        path: "/home",
        redirect: "/",
      },
      {
        path: "/configuration",
        name: "Configuration",
        component: () => import("pages/ConfigurationPage.vue"),
      },
      {
        path: "/newbook",
        name: "NewBook",
        component: () => import("pages/NewBookPage.vue"),
      },
      {
        path: "/error",
        name: "ErrorPage",
        component: () => import("pages/ErrorPage.vue"),
      },
      {
        path: "/registration",
        name: "registration",
        component: () => import("pages/RegistrationPage.vue"),
      },
      {
        path: "/tables",
        name: "tables",
        component: () => import("pages/TablesEditPage.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
