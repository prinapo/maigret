import { describe, it, expect, vi } from "vitest";
import i18nBoot, { i18n } from "boot/i18n";
import { createI18n } from "vue-i18n";

describe("i18n boot file", () => {
  it("should initialize i18n correctly", () => {
    expect(i18n).toBeDefined();
    expect(i18n.global.locale.value).toBe("it-IT");
    expect(i18n.global.fallbackLocale.value).toBe("en-US");
    expect(i18n.mode).toBe('composition');
  });

  it("should make i18n available globally via app.use", () => {
    const mockApp = {
      use: vi.fn(),
      config: {
        globalProperties: {},
      },
    };

    i18nBoot({ app: mockApp });

    expect(mockApp.use).toHaveBeenCalledWith(i18n);
    expect(mockApp.config.globalProperties.$i18n).toBe(i18n);
    expect(window.i18n).toBe(i18n);
  });
});