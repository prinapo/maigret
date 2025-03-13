const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/",
        name: "bibliografia",
        component: () => import("pages/BibliografiaPage.vue"),
        meta: {
          keepAlive: true,
          title: "Bibliografia",
        },
      },

      {
        path: "/login",
        name: "LoginPage",
        component: () => import("pages/LoginPage.vue"),
        meta: {
          keepAlive: false,
          title: "Login",
        },
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
        path: "tables",
        name: "tables",
        component: () => import("pages/TablesEditPage.vue"),
        meta: {
          keepAlive: false, // Don't cache tables page due to data requirements
        },
      },
      {
        path: "/loading",
        name: "loading",
        component: () => import("pages/LoadingPage.vue"),
        meta: {
          keepAlive: false,
          title: "Loading",
        },
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
