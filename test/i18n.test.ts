import { describe, it, expect } from "vitest";
import { translate, resolveLocale } from "../src/i18n";

describe("translate", () => {
  it("returns the string for the locale", () => {
    expect(translate("en", "status.ready")).toBe("Ready");
    expect(translate("ja", "status.ready")).toBe("準備完了");
  });
  it("falls back to the key when missing in both locales", () => {
    expect(translate("en", "no.such.key")).toBe("no.such.key");
  });
});

describe("resolveLocale", () => {
  it("honors a valid stored value over navigator", () => {
    expect(resolveLocale("ja", "en-US")).toBe("ja");
    expect(resolveLocale("en", "ja-JP")).toBe("en");
  });
  it("ignores an invalid stored value and uses navigator", () => {
    expect(resolveLocale(null, "ja-JP")).toBe("ja");
    expect(resolveLocale("xx", "ja")).toBe("ja");
    expect(resolveLocale(null, "en-US")).toBe("en");
    expect(resolveLocale(null, "fr-FR")).toBe("en");
  });
});
