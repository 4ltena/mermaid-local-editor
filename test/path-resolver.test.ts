import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { resolveRendererPath } from "../electron/path-resolver";

// Build the root with the OS-native separator so the traversal check (which
// compares against `path.sep`) matches on both POSIX and Windows.
const root = join("/app", "out", "renderer");

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

  it("strips a query string", () => {
    expect(resolveRendererPath(root, "app://app/index.html?foo=bar")).toBe(
      join(root, "index.html"),
    );
  });

  it("strips a fragment", () => {
    expect(resolveRendererPath(root, "app://app/index.html#frag")).toBe(
      join(root, "index.html"),
    );
  });

  it("returns null for malformed percent-encoding", () => {
    expect(resolveRendererPath(root, "app://app/%zz")).toBeNull();
  });
});
