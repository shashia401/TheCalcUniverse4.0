import { describe, it, expect } from "vitest";
import config from "../../../src/calculators/math/character-token/index";

describe("character-token-converter", () => {
  it("exports valid config", () => {
    expect(config).toBeDefined();
    expect(typeof config.calculate).toBe("function");
  });
  it("handles empty input", () => {
    expect(Array.isArray(config.calculate({inputText:"", tokenizerType:"general"}))).toBe(true);
  });
  it("works with demo values", () => {
    const r=config.calculate({inputText:"Hello world", tokenizerType:"openai"});
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });
});
