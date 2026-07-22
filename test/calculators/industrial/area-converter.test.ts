import { describe, it, expect } from "vitest";
import config from "../../../src/calculators/industrial/area-converter/index";
import { getValue, parseNumber, near } from "../../helpers";

describe("Area Converter", () => {
  it("100 sq m to 1076 sq ft", () => {
    const results = config.calculate({ value: "100", from: "m2", to: "ft2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1076.4, 0.5);
  });

  it("1000 sq ft to 92.9 sq m", () => {
    const results = config.calculate({ value: "1000", from: "ft2", to: "m2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 92.9, 0.1);
  });

  it("1 acre to 4047 sq m", () => {
    const results = config.calculate({ value: "1", from: "ac", to: "m2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 4047, 1);
  });

  it("10 hectares to 24.71 acres", () => {
    const results = config.calculate({ value: "10", from: "ha", to: "ac" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 24.71, 0.01);
  });

  it("1 sq km to 0.386 sq mi", () => {
    const results = config.calculate({ value: "1", from: "km2", to: "mi2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 0.386, 0.001);
  });

  it("1 sq mi to 640 acres", () => {
    const results = config.calculate({ value: "1", from: "mi2", to: "ac" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 640, 0.1);
  });

  it("1 sq in to 6.452 sq cm", () => {
    const results = config.calculate({ value: "1", from: "in2", to: "cm2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 6.452, 0.001);
  });

  it("1 acre to 43560 sq ft", () => {
    const results = config.calculate({ value: "1", from: "ac", to: "ft2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 43560, 1);
  });

  it("same unit returns original value", () => {
    const results = config.calculate({ value: "500", from: "m2", to: "m2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 500, 0.01);
  });

  it("empty value returns empty array", () => {
    const results = config.calculate({ value: "", from: "m2", to: "ft2" });
    expect(results).toEqual([]);
  });

  it("non-numeric value returns empty array", () => {
    const results = config.calculate({ value: "abc", from: "m2", to: "ft2" });
    expect(results).toEqual([]);
  });

  it("5000 sq ft to 0.115 acres", () => {
    const results = config.calculate({ value: "5000", from: "ft2", to: "ac" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 0.115, 0.001);
  });

  it("formula result is present", () => {
    const results = config.calculate({ value: "100", from: "m2", to: "ft2" });
    const formula = results.find(r => r.id === "formula");
    expect(formula).toBeDefined();
    expect(formula!.value).toContain("100");
  });

  it("1000000 sq mm to 1 sq m", () => {
    const results = config.calculate({ value: "1000000", from: "mm2", to: "m2" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1.0, 0.001);
  });

  it("undefined values returns empty array", () => {
    const results = config.calculate({} as any);
    expect(results).toEqual([]);
  });
});
