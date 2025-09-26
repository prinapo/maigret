// /src/stores/loadersStore.js
import { defineStore } from "pinia";

export const useLoaderStore = defineStore("loadersStore", {
  state: () => ({
    tokens: {}, // mappa token -> { message, percent, createdAt, timeoutId }
  }),
  getters: {
    isLoading: (state) => Object.keys(state.tokens).length > 0,
    message: (state) => {
      const keys = Object.keys(state.tokens);
      if (!keys.length) return "";
      const token = state.tokens[keys[keys.length - 1]];
      if (token.percent !== null) {
        return `${token.message ? token.message + " — " : ""}${token.percent}%`;
      }
      return token.message || "";
    },
    activeCount: (state) => Object.keys(state.tokens).length,
  },

  actions: {
    start(opts = {}) {
      const token =
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

      // Crea il token
      this.tokens[token] = {
        message: opts.message || "",
        percent: opts.percent ?? null,
        createdAt: Date.now(),
        timeoutId: null,
      };

      // Timeout automatico di 5 secondi
      this.tokens[token].timeoutId = setTimeout(() => {
        this.stop(token);
      }, 5000);

      return token;
    },

    update(token, opts = {}) {
      if (!token || !this.tokens[token]) return;
      if (opts.message !== undefined) this.tokens[token].message = opts.message;
      if (opts.percent !== undefined) this.tokens[token].percent = opts.percent;
    },

    stop(token) {
      if (!token) {
        const keys = Object.keys(this.tokens);
        if (!keys.length) return;
        token = keys[keys.length - 1];
      }

      if (token && this.tokens[token]) {
        // Cancella il timeout associato
        if (this.tokens[token].timeoutId) {
          clearTimeout(this.tokens[token].timeoutId);
        }
        delete this.tokens[token];
      }
    },

    reset() {
      Object.keys(this.tokens).forEach((token) => {
        if (this.tokens[token].timeoutId)
          clearTimeout(this.tokens[token].timeoutId);
      });
      this.tokens = {};
    },
  },
});
