import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { resolveRendererPath } from "../electron/path-resolver";

const root = "/app/out/renderer";

describe("resolveRendererPath", () => {
  it("maps the root request to index.html", () => {
    expect(resolveRendererPath(root, "app://app/")).toBe(join(root, "index.html"));
  });

  it("maps an asset path under the root", () => {
    expect(resolveRendererPath(root, "app://app/assets/x.js")).toBe(
      join(root, "assets", "x.js"),
    );
  });

  it("decodes percent-encoded paths", () => {
    expect(resolveRendererPath(root, "app://app/a%20b.js")).toBe(
      join(root, "a b.js"),
    );
  });

  it("returns null for a traversal attempt", () => {
    expect(resolveRendererPath(root, "app://app/../../etc/passwd")).toBeNull();
  });
});
