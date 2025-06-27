import { config } from "@vue/test-utils";
import { Quasar } from "quasar";
import { createPinia } from "pinia";

import "fake-indexeddb/auto";
import "@testing-library/jest-dom";

const pinia = createPinia();

// Mock Quasar components
const components = [
  "QVirtualScroll",
  "QImg", 
  "QSelect",
  "QDialog",
  "QCard",
  "QCardSection", 
  "QCardActions",
  "QBtn",
  "QUploader",
  "QIcon",
  "QSpinner",
  "QSpinnerDots",
  "QBadge",
  "QNotify"
];

components.forEach((component) => {
  config.global.components[component] = {
    template: '<div class="mock-component" data-test-id="${component}"></div>'
  };
});

// Global plugins
config.global.plugins = [
  [Quasar, {
    components: {},
    directives: {},
    plugins: {
      Notify: {
        create: vi.fn()
      }
    },
  }],
  pinia // Use the same pinia instance
];

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Add global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock Intersection Observer
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));
