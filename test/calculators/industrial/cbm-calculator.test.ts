import { describe, it, expect } from "vitest";
import config from "../../../src/calculators/industrial/cbm-calculator/index";
import { getValue, parseNumber, near } from "../../helpers";

describe("CBM Calculator", () => {
  it("standard box 100x50x40 cm 1 pkg 50 kg air freight", () => {
    const results = config.calculate({
      length: "100", width: "50", height: "40",
      unit: "cm", packages: "1", actualWeight: "50", shippingMode: "air",
    });
    // CBM = 1.0 * 0.5 * 0.4 = 0.200
    const cbm = getValue(results, "cbm");
    near(parseNumber(cbm), 0.200, 0.001);
    // Dim weight = 100*50*40/6000 = 200000/6000 = 33.33 kg
    const dimWeight = getValue(results, "dimWeight");
    near(parseNumber(dimWeight), 33.33, 0.1);
    // Chargeable = max(50, 33.33) = 50 kg
    const chargeable = getValue(results, "chargeableWeight");
    near(parseNumber(chargeable), 50, 0.1);
    // Billing basis should be actual weight
    const basis = getValue(results, "weightBasis");
    expect(basis).toContain("Actual");
  });

  it("bulky lightweight box chargeable is dimensional weight", () => {
    const results = config.calculate({
      length: "100", width: "100", height: "100",
      unit: "cm", packages: "1", actualWeight: "10", shippingMode: "courier",
    });
    const cbm = getValue(results, "cbm");
    near(parseNumber(cbm), 1.0, 0.01);
    // Dim weight = 100*100*100/5000 = 200 kg
    const chargeable = getValue(results, "chargeableWeight");
    near(parseNumber(chargeable), 200, 0.1);
    const basis = getValue(results, "weightBasis");
    expect(basis).toContain("Dimensional");
  });

  it("sea freight 1 CBM to 1000 kg dim weight", () => {
    const results = config.calculate({
      length: "100", width: "100", height: "100",
      unit: "cm", packages: "1", actualWeight: "500", shippingMode: "sea",
    });
    const dimWeight = getValue(results, "dimWeight");
    near(parseNumber(dimWeight), 1000, 1);
    const chargeable = getValue(results, "chargeableWeight");
    near(parseNumber(chargeable), 1000, 1);
  });

  it("multiple packages 10 boxes at 50x40x30 cm", () => {
    const results = config.calculate({
      length: "50", width: "40", height: "30",
      unit: "cm", packages: "10", actualWeight: "100", shippingMode: "air",
    });
    // CBM per box = 0.5*0.4*0.3 = 0.06, total = 0.6
    const cbm = getValue(results, "cbm");
    near(parseNumber(cbm), 0.600, 0.001);
    // Dim weight per box = 50*40*30/6000 = 10, total = 100
    const dimWeight = getValue(results, "dimWeight");
    near(parseNumber(dimWeight), 100, 1);
    const chargeable = getValue(results, "chargeableWeight");
    near(parseNumber(chargeable), 100, 0.1);
    // Per-unit CBM
    const perUnitCbm = results.find(r => r.id === "perUnitCbm");
    expect(perUnitCbm).toBeDefined();
    near(parseNumber(perUnitCbm!.value), 0.060, 0.001);
  });

  it("feet input 3.28084 ft cube equals approx 1 CBM", () => {
    const results = config.calculate({
      length: "3.28084", width: "3.28084", height: "3.28084",
      unit: "ft", packages: "1", actualWeight: "100", shippingMode: "air",
    });
    const cbm = getValue(results, "cbm");
    near(parseNumber(cbm), 1.0, 0.01);
  });

  it("inches input 39.37 inches cube approx 1 CBM", () => {
    const results = config.calculate({
      length: "39.37", width: "39.37", height: "39.37",
      unit: "in", packages: "1", actualWeight: "50", shippingMode: "courier",
    });
    const cbm = getValue(results, "cbm");
    near(parseNumber(cbm), 1.0, 0.02);
  });

  it("container estimate for large shipment", () => {
    const results = config.calculate({
      length: "100", width: "100", height: "100",
      unit: "cm", packages: "100", actualWeight: "1000", shippingMode: "sea",
    });
    const containerEstimate = getValue(results, "containerEstimate");
    expect(containerEstimate).toContain("20ft");
    expect(containerEstimate).toContain("40ft");
  });

  it("empty dimensions return empty array", () => {
    const results = config.calculate({
      length: "", width: "", height: "",
      unit: "cm", packages: "1", actualWeight: "50", shippingMode: "air",
    });
    expect(results).toEqual([]);
  });

  it("zero dimensions return empty array", () => {
    const results = config.calculate({
      length: "0", width: "50", height: "40",
      unit: "cm", packages: "1", actualWeight: "50", shippingMode: "air",
    });
    expect(results).toEqual([]);
  });

  it("negative weight returns empty array", () => {
    const results = config.calculate({
      length: "100", width: "50", height: "40",
      unit: "cm", packages: "1", actualWeight: "-10", shippingMode: "air",
    });
    expect(results).toEqual([]);
  });

  it("volume breakdown is present", () => {
    const results = config.calculate({
      length: "100", width: "50", height: "40",
      unit: "cm", packages: "1", actualWeight: "50", shippingMode: "air",
    });
    const breakdown = results.find(r => r.id === "volumeBreakdown");
    expect(breakdown).toBeDefined();
    expect(breakdown!.value).toContain("×");
  });

  it("meter input 2x1.5x1 m equals 3 CBM", () => {
    const results = config.calculate({
      length: "2", width: "1.5", height: "1",
      unit: "m", packages: "1", actualWeight: "100", shippingMode: "sea",
    });
    const cbm = getValue(results, "cbm");
    near(parseNumber(cbm), 3.0, 0.01);
  });

  it("single package does not show perUnitCbm", () => {
    const results = config.calculate({
      length: "100", width: "50", height: "40",
      unit: "cm", packages: "1", actualWeight: "50", shippingMode: "air",
    });
    const perUnitCbm = results.find(r => r.id === "perUnitCbm");
    expect(perUnitCbm).toBeUndefined();
  });
});
