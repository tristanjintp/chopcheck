import { describe, expect, it } from "vitest";
import { isValidUscc, validateUscc } from "../../lib/rules/uscc";

// Ce code est un exemple de code USCC valide utilisé uniquement pour le test.
const validUscc = "91350211M000100Y49";

describe("USCC rules", () => {
  it("accepts a valid code", () => {
    expect(isValidUscc(validUscc)).toBe(true);
  });

  it("rejects an incorrect check character", () => {
    expect(isValidUscc(`${validUscc.slice(0, -1)}4`)).toBe(false);
  });

  it("rejects an incorrect length", () => {
    expect(isValidUscc("123456789")).toBe(false);
  });

  it("rejects a forbidden character", () => {
    expect(isValidUscc("91350211I000100Y43")).toBe(false);
  });

  it("returns no risk for an absent or valid code", () => {
    expect(validateUscc("", "Example Company")).toEqual([]);
    expect(validateUscc(validUscc, "Example Company")).toEqual([]);
  });

  it("returns a critical rule risk for an invalid code", () => {
    const risks = validateUscc("91350211M000100Y48", "Example Company");
    expect(risks).toHaveLength(1);
    expect(risks[0].source).toBe("rule");
    expect(risks[0].level).toBe("critical");
  });
});
