import { describe, it, expect } from "vitest";
import config from "../../../src/calculators/industrial/speed-converter/index";
import { getValue, parseNumber, near } from "../../helpers";

describe("Speed Converter", () => {
  it("100 km/h to 62.14 mph", () => {
    const results = config.calculate({ value: "100", from: "kmh", to: "mph" });
    const result = getValue(results, "result");
    expect(result).toContain("mph");
    near(parseNumber(result.split("= ")[1]), 62.14, 0.01);
  });

  it("60 mph to 96.56 km/h", () => {
    const results = config.calculate({ value: "60", from: "mph", to: "kmh" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 96.56, 0.01);
  });

  it("1 m/s to 3.6 km/h", () => {
    const results = config.calculate({ value: "1", from: "ms", to: "kmh" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 3.6, 0.01);
  });

  it("50 knots to 92.6 km/h", () => {
    const results = config.calculate({ value: "50", from: "kn", to: "kmh" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 92.6, 0.1);
  });

  it("Mach 1 to 1225 km/h at sea level", () => {
    const results = config.calculate({ value: "1", from: "mach", to: "kmh" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1225, 1);
  });

  it("1 c to 299792458 m/s", () => {
    const results = config.calculate({ value: "1", from: "c", to: "ms" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 299792458, 1);
  });

  it("100 km/h to 27.78 m/s", () => {
    const results = config.calculate({ value: "100", from: "kmh", to: "ms" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 27.78, 0.01);
  });

  it("same unit conversion returns original value", () => {
    const results = config.calculate({ value: "50", from: "kmh", to: "kmh" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 50, 0.01);
  });

  it("empty value returns empty array", () => {
    const results = config.calculate({ value: "", from: "kmh", to: "mph" });
    expect(results).toEqual([]);
  });

  it("non-numeric value returns empty array", () => {
    const results = config.calculate({ value: "abc", from: "kmh", to: "mph" });
    expect(results).toEqual([]);
  });

  it("10 m/s to 19.44 knots", () => {
    const results = config.calculate({ value: "10", from: "ms", to: "kn" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 19.44, 0.01);
  });

  it("761 mph is approx Mach 1 at sea level", () => {
    const results = config.calculate({ value: "761", from: "mph", to: "mach" });
    const result = getValue(results, "result");
    const machValue = parseNumber(result.split("= ")[1]);
    expect(machValue).toBeGreaterThan(0.99);
    expect(machValue).toBeLessThan(1.01);
  });

  it("formula result is present", () => {
    const results = config.calculate({ value: "100", from: "kmh", to: "mph" });
    const formula = results.find(r => r.id === "formula");
    expect(formula).toBeDefined();
    expect(formula!.value).toContain("100");
    expect(formula!.value).toContain("×");
  });

  it("undefined values returns empty array", () => {
    const results = config.calculate({} as any);
    expect(results).toEqual([]);
  });
});
