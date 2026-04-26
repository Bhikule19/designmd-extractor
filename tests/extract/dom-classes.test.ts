import { describe, it, expect } from "vitest";
import { selectorClasses } from "@/lib/extract/dom-classes";

describe("selectorClasses", () => {
  it("extracts a single class", () => {
    expect(selectorClasses(".btn")).toEqual(["btn"]);
  });

  it("extracts multiple classes from a compound selector", () => {
    expect(selectorClasses("body .btn.btn-primary")).toEqual([
      "btn",
      "btn-primary",
    ]);
  });

  it("strips pseudo states / pseudo elements", () => {
    expect(selectorClasses(".card:hover")).toEqual(["card"]);
    expect(selectorClasses(".card::before")).toEqual(["card"]);
  });

  it("ignores element-only selectors", () => {
    expect(selectorClasses("h1")).toEqual([]);
    expect(selectorClasses("body p strong")).toEqual([]);
  });

  it("strips Tailwind escaped brackets so they don't pollute names", () => {
    expect(selectorClasses(".from-\\[\\#3ECF8E\\]")).toEqual(["from-"]);
  });

  it("handles combinators", () => {
    expect(selectorClasses(".a > .b + .c ~ .d")).toEqual(["a", "b", "c", "d"]);
  });
});
