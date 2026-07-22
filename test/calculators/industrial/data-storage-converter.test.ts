import { describe, it, expect } from "vitest";
import config from "../../../src/calculators/industrial/data-storage-converter/index";
import { getValue, parseNumber, near } from "../../helpers";

describe("Data Storage Converter", () => {
  it("1 GB to 1000 MB decimal", () => {
    const results = config.calculate({ value: "1", from: "gb", to: "mb" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1000, 0.1);
  });

  it("1 GiB to 1024 MiB binary", () => {
    const results = config.calculate({ value: "1", from: "gib", to: "mib" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1024, 0.1);
  });

  it("1 TB decimal to 0.909 TiB binary", () => {
    const results = config.calculate({ value: "1", from: "tb", to: "tib" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 0.909, 0.001);
  });

  it("500 GB to 465.66 GiB hard drive discrepancy", () => {
    const results = config.calculate({ value: "500", from: "gb", to: "gib" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 465.66, 0.1);
  });

  it("1 KiB to 1024 B", () => {
    const results = config.calculate({ value: "1", from: "kib", to: "b" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1024, 0.1);
  });

  it("1 KB to 1000 B", () => {
    const results = config.calculate({ value: "1", from: "kb", to: "b" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1000, 0.1);
  });

  it("1 PB to 1000 TB", () => {
    const results = config.calculate({ value: "1", from: "pb", to: "tb" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1000, 0.1);
  });

  it("16 GiB RAM to 17.18 GB", () => {
    const results = config.calculate({ value: "16", from: "gib", to: "gb" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 17.18, 0.01);
  });

  it("same unit returns original value", () => {
    const results = config.calculate({ value: "256", from: "gb", to: "gb" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 256, 0.01);
  });

  it("empty value returns empty array", () => {
    const results = config.calculate({ value: "", from: "gb", to: "mb" });
    expect(results).toEqual([]);
  });

  it("non-numeric value returns empty array", () => {
    const results = config.calculate({ value: "xyz", from: "gb", to: "mb" });
    expect(results).toEqual([]);
  });

  it("1024 B to 1 KiB binary boundary", () => {
    const results = config.calculate({ value: "1024", from: "b", to: "kib" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1.0, 0.01);
  });

  it("formula result is present", () => {
    const results = config.calculate({ value: "500", from: "gb", to: "gib" });
    const formula = results.find(r => r.id === "formula");
    expect(formula).toBeDefined();
    expect(formula!.value).toContain("500");
  });

  it("1 TiB to 1099511627776 B", () => {
    const results = config.calculate({ value: "1", from: "tib", to: "b" });
    const result = getValue(results, "result");
    near(parseNumber(result.split("= ")[1]), 1099511627776, 10);
  });

  it("undefined values returns empty array", () => {
    const results = config.calculate({} as any);
    expect(results).toEqual([]);
  });
});
