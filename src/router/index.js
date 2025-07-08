import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { showNotifyNegative } from "src/utils/notify";

// Custom error class
class RouterError extends Error {
  constructor(message, code, redirectTo = null) {
    super(message);
    this.code = code;
    this.redirectTo = redirectTo;
    this.name = "RouterError";
    this.timestamp = new Date().toISOString();
  }
}

const handleRouterError = (error, router) => {
  console.error("Router error:", error);
  showNotifyNegative(`Errore navigazione: ${error.message}`);

  const errorPath = "/error";
  const errorQuery = {
    type: error.code,
    error: JSON.stringify({
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
    }),
    redirect: error.redirectTo || null,
  };

  if (router.currentRoute.value.path !== errorPath) {
    router.push({ path: errorPath, query: errorQuery });
  }
};

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: (to, from, savedPosition) =>
      savedPosition || { left: 0, top: 0 },
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, from, next) => {
    try {
      // Valida parametri dinamici
      if (to.params) {
        for (const [key, value] of Object.entries(to.params)) {
          if (
            !value &&
            to.matched.some((record) => record.path.includes(`:${key}`))
          ) {
            throw new RouterError(
              `Parametro mancante: ${key}`,
              "INVALID_PARAM",
            );
          }
        }
      }

      next();
    } catch (error) {
      const routerError =
        error instanceof RouterError
          ? error
          : new RouterError("Errore generico", "SERVER_ERROR");
      handleRouterError(routerError, Router);
      next(false);
    }
  });

  Router.onError((error) => {
    const routerError = new RouterError(
      error.message || "Errore navigazione",
      "SERVER_ERROR",
    );
    handleRouterError(routerError, Router);
  });

  return Router;
});
