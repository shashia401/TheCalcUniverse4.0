import { describe, it, expect } from "vitest";
import config from "../../../src/calculators/industrial/cooking-converter/index";
import { getValue, parseNumber, near } from "../../helpers";

describe("Cooking Converter", () => {
  it("1 cup to 236.6 mL", () => {
    const results = config.calculate({ value: "1", from: "cup", to: "ml" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 236.6, 0.1);
  });

  it("500 mL to 2.11 cups", () => {
    const results = config.calculate({ value: "500", from: "ml", to: "cup" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 2.11, 0.01);
  });

  it("1 tbsp to 14.79 mL", () => {
    const results = config.calculate({ value: "1", from: "tbsp", to: "ml" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 14.79, 0.01);
  });

  it("3 tsp to 1 tbsp", () => {
    const results = config.calculate({ value: "3", from: "tsp", to: "tbsp" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1.0, 0.01);
  });

  it("1 fl oz to 29.57 mL", () => {
    const results = config.calculate({ value: "1", from: "floz", to: "ml" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 29.57, 0.01);
  });

  it("1 quart to 946.4 mL", () => {
    const results = config.calculate({ value: "1", from: "qt", to: "ml" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 946.4, 0.1);
  });

  it("1 gallon to 3.785 L", () => {
    const results = config.calculate({ value: "1", from: "gal", to: "l" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 3.785, 0.01);
  });

  it("water 1 cup to 236.6 g", () => {
    const results = config.calculate({ value: "1", from: "cup", to: "gram" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 236.6, 0.1);
  });

  it("water 500 g to 2.11 cups", () => {
    const results = config.calculate({ value: "500", from: "gram", to: "cup" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 2.11, 0.01);
  });

  it("1 L to 33.81 fl oz", () => {
    const results = config.calculate({ value: "1", from: "l", to: "floz" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 33.81, 0.01);
  });

  it("4 cups to 1 quart", () => {
    const results = config.calculate({ value: "4", from: "cup", to: "qt" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1.0, 0.01);
  });

  it("same unit returns original value", () => {
    const results = config.calculate({ value: "2", from: "cup", to: "cup" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 2, 0.01);
  });

  it("empty value returns empty array", () => {
    const results = config.calculate({ value: "", from: "cup", to: "ml" });
    expect(results).toEqual([]);
  });

  it("non-numeric value returns empty array", () => {
    const results = config.calculate({ value: "abc", from: "cup", to: "ml" });
    expect(results).toEqual([]);
  });

  it("formula result is present", () => {
    const results = config.calculate({ value: "2", from: "cup", to: "ml" });
    const formula = results.find(r => r.id === "formula");
    expect(formula).toBeDefined();
    expect(formula!.value).toContain("2");
  });

  it("1 pint to 2 cups", () => {
    const results = config.calculate({ value: "1", from: "pt", to: "cup" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 2.0, 0.01);
  });

  it("undefined values returns empty array", () => {
    const results = config.calculate({} as any);
    expect(results).toEqual([]);
  });
});
