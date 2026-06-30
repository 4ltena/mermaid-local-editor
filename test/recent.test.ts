import { describe, it, expect, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    getPath: () => "/mock/userData",
  },
}));

import { addRecent } from "../electron/recent";

describe("addRecent", () => {
  it("prepends a new path", () => {
    expect(addRecent(["a", "b"], "c", 10)).toEqual(["c", "a", "b"]);
  });

  it("moves an existing path to the front without duplicating", () => {
    expect(addRecent(["a", "b", "c"], "b", 10)).toEqual(["b", "a", "c"]);
  });

  it("caps the list at max, dropping the oldest", () => {
    expect(addRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });
});
