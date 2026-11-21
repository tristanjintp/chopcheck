import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AnalysisSchema } from "../../lib/schema";
import { demoCards, uploadedDemo } from "../../lib/demo/presentation";

// Le parcours enregistré doit rester instantané et les documents personnels
// ne doivent pas basculer vers des résultats fictifs en mode normal.
describe("redesigned demo entry", () => {
  it("never matches a demo file when Demo Mode is off", () => {
    expect(uploadedDemo("wechat-conversation-tristan-fictional.png", false)).toBeUndefined();
    expect(uploadedDemo("my-invoice.png", true)).toBeUndefined();
  });

  it("provides four complete fallback cards with exact citations", () => {
    expect(demoCards).toHaveLength(4);
    for (const card of demoCards) {
      expect(AnalysisSchema.safeParse(card.scenario.result).success).toBe(true);
      for (const risk of card.scenario.result.risks) {
        expect(card.scenario.result.documentText).toContain(risk.quote_zh);
      }
    }
  });

  it("provides five local PNGs outside public assets", () => {
    for (const name of ["supply-contract-fictional.png", "wechat-conversation-fictional.png", "wechat-conversation-tristan-fictional.png", "fapiao-fictional.png", "government-notice-fictional.png"]) {
      const file = fs.readFileSync(path.resolve("demo-documents", name));
      expect(file.subarray(1, 4).toString()).toBe("PNG");
      expect(uploadedDemo(name, true)).toBeDefined();
    }
  });

  it.each([1, 2, 3])("keeps the Tristan video data reproducible, run %i", () => {
    const scenario = uploadedDemo("wechat-conversation-tristan-fictional.png", true)!;
    expect(scenario.result.verdict.level).toBe("high");
    const risk = scenario.result.risks.find((item) => item.id === "personal-account")!;
    expect(scenario.result.documentText).toContain(risk.quote_zh);
    expect(scenario.result.actions.length).toBeGreaterThan(0);
    expect(scenario.result.reply_zh).toContain("无法向个人账户付款");
    expect(scenario.company.note).toContain("Demo data");
  });
});
