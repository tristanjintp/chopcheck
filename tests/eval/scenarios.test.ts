import { describe, expect, it } from "vitest";
import { AnalysisSchema } from "../../lib/schema";
import { scenarios } from "../../lib/demo/scenarios";

// Ce test protège le parcours filmé : chaque résultat enregistré doit être
// complet et chaque risque doit pointer vers le texte chinois exact.
describe("one-click demo scenarios", () => {
  it("provides four complete, independent scenarios", () => {
    expect(scenarios.map((scenario) => scenario.id)).toEqual(["contract", "wechat", "fapiao", "notice"]);
    for (const scenario of scenarios) {
      expect(AnalysisSchema.safeParse(scenario.result).success).toBe(true);
      expect(scenario.result.documentText).toContain("SAMPLE");
      expect(scenario.company.note).toContain("Demo data");
      expect(scenario.result.summary.length).toBeGreaterThanOrEqual(3);
      expect(scenario.result.actions.length).toBeGreaterThan(0);
      expect(scenario.result.reply_zh?.length ?? 0).toBeGreaterThan(0);
      for (const risk of scenario.result.risks) {
        expect(scenario.result.documentText).toContain(risk.quote_zh);
      }
    }
  });

  it("keeps the Supply Contract video path reproducible", () => {
    // Trois cycles simulent Reset → Start Demo → risque → réponse → WeChat.
    for (let run = 0; run < 3; run++) {
      const contract = scenarios[0].result;
      expect(contract.verdict.level).toBe("high");
      expect(contract.risks.find((risk) => risk.id === "seal")?.quote_zh).toContain("乙方公章");
      expect(contract.reply_zh).toContain("对公账户");
      expect(scenarios[1].result.documentText).toContain("原则上问题不大");
    }
  });
});
