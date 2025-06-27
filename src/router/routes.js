// src/router/routes.js
const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/", // → corrisponde a "/"
        name: "bibliografia",
        component: () => import("pages/BibliografiaPage.vue"),
        meta: { keepAlive: true, title: "Bibliografia" },
      },

      {
        path: "login", // → "/login"
        name: "LoginPage",
        component: () => import("pages/LoginPage.vue"),
        meta: { keepAlive: false, title: "Login" },
      },

      {
        path: "home", // → "/home" ma ridiretta a "/"
        redirect: "/",
      },

      {
        path: "configuration", // → "/configuration"
        name: "Configuration",
        component: () => import("pages/ConfigurationPage.vue"),
      },

      {
        path: "users", // → "/users"
        name: "UserManagement",
        component: () => import("pages/UserManagementPage.vue"),
        meta: { keepAlive: false, title: "User Management" },
      },

      {
        path: "newbook", // → "/newbook"
        name: "NewBook",
        component: () => import("pages/NewBookPage.vue"),
      },

      {
        path: "error", // → "/error"
        name: "ErrorPage",
        component: () => import("pages/ErrorPage.vue"),
      },

      {
        path: "registration", // → "/registration"
        name: "registration",
        component: () => import("pages/RegistrationPage.vue"),
      },

      {
        path: "tables", // → "/tables"
        name: "tables",
        component: () => import("pages/TablesEditPage.vue"),
        meta: { keepAlive: false },
      },

      {
        path: "loading", // → "/loading"
        name: "loading",
        component: () => import("pages/LoadingPage.vue"),
        meta: { keepAlive: false, title: "Loading" },
      },
      {
        path: "trash", // → "/loading"
        name: "trash",
        component: () => import("pages/Trash.vue"),
        meta: { keepAlive: false, title: "Trash" },
      },
      {
        path: "analytics", // → "/loading"
        name: "analytics",
        component: () => import("pages/Analytics.vue"),
        meta: { keepAlive: false, title: "Trash" },
      },
    ],
  },

  // catch-all 404
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
