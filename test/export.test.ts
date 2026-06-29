import { describe, it, expect } from "vitest";
import { lockedCounterpart } from "../src/export";

describe("lockedCounterpart", () => {
  it("scales height from width by the intrinsic ratio", () => {
    expect(lockedCounterpart("w", 1000, { w: 500, h: 250 })).toBe(500);
  });
  it("scales width from height by the intrinsic ratio", () => {
    expect(lockedCounterpart("h", 200, { w: 500, h: 250 })).toBe(400);
  });
  it("rounds to the nearest integer", () => {
    expect(lockedCounterpart("w", 101, { w: 100, h: 33 })).toBe(33);
  });
  it("guards against a zero intrinsic dimension", () => {
    expect(lockedCounterpart("w", 100, { w: 0, h: 0 })).toBe(100);
  });
});
