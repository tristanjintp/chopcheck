import { describe, expect, it } from "vitest";
import { extractFromText } from "../../lib/analysis/extract";
import { runDeterministicChecks } from "../../lib/analysis/deterministic";
import { aggregate } from "../../lib/analysis/aggregate";
import { getScenario } from "../../lib/demo/scenarios";

// Les deux documents testent le chemin réel avant l'appel IA : extraction,
// règle, citation présente dans la source, verdict et action.
describe("local analysis path", () => {
  it("detects the mismatched company seal", () => {
    const extraction = extractFromText(getScenario("contract").result.documentText);
    const risks = runDeterministicChecks(extraction);
    expect(risks.some((risk) => risk.id.startsWith("seal-mismatch"))).toBe(true);
    expect(risks.every((risk) => extraction.documentText.includes(risk.quote_zh))).toBe(true);
    expect(aggregate(extraction, risks).verdict.level).toBe("high");
  });

  it("detects the invoice total mismatch with an exact quote", () => {
    const extraction = extractFromText(getScenario("fapiao").result.documentText);
    const risk = runDeterministicChecks(extraction).find((item) => item.id === "fapiao-total-mismatch");
    expect(risk).toBeDefined();
    expect(extraction.documentText).toContain(risk?.quote_zh);
  });
});
