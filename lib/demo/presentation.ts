import { getScenario, type DemoScenario } from "./scenarios";

// Tristan est une variante du scénario WeChat, entièrement fictive. Le risque
// du compte personnel contient une citation exacte et un résultat reproductible.
export const tristanScenario: DemoScenario = {
  ...getScenario("wechat"),
  title: "Tristan's WeChat conversation",
  situation: "A fictional supplier asks Tristan to pay an individual before confirming delivery.",
  result: {
    ...getScenario("wechat").result,
    documentId: "wechat-tristan",
    documentText: "DEMO / FICTIONAL · 示例 — 微信聊天\nTristan：请确认12月15日前可以交货。\n供应商：原则上问题不大，我们尽量安排。\n供应商：公司账户暂时不能用，请先转到我个人账户。\nTristan：可以提供公司的对公账户吗？\n供应商：先付80%定金，交货日期后面再确认。",
    verdict: { level: "high", headline: "Do not pay this personal account", action: "Request a company bank account and a written delivery commitment before paying." },
    keyFacts: { payment: "80% deposit · personal account requested", delivery: "15 December requested, not confirmed" },
    summary: ["A supplier asks Tristan for an 80% deposit.", "The requested payment is to an individual's account.", "The supplier gives no firm delivery commitment."],
    explanation: "The supplier asks for a personal transfer before confirming delivery; verify the company account and agree the terms before paying.",
    risks: [
      { id: "personal-account", level: "critical", title: "Payment to a personal account", quote_zh: "公司账户暂时不能用，请先转到我个人账户。", explanation: "The supplier says the company account is unavailable and asks for a transfer to a personal account. The payment would not match the named business.", fix: "Request a bank account in the supplier's legal company name and verify it independently.", source: "ai", legal_refs: [] },
      { ...getScenario("wechat").result.risks[0], id: "qualified-assurance" },
      { id: "upfront", level: "warning", title: "Deposit before a confirmed deadline", quote_zh: "先付80%定金，交货日期后面再确认。", explanation: "The supplier asks for most of the price while leaving the delivery date unsettled.", fix: "Agree a delivery date and milestone payments in writing before sending money.", source: "ai", legal_refs: [] },
    ],
    actions: [
      { id: "t1", label: "Verify the company account", description: "Ask for a company account matching the supplier's business licence.", priority: "high" },
      { id: "t2", label: "Confirm delivery in writing", description: "Include a firm delivery date and delay terms in the agreement.", priority: "high" },
      { id: "t3", label: "Agree milestone payments", description: "Reduce the upfront amount and link payments to delivery and inspection.", priority: "medium" },
    ],
    reply_zh: "您好，付款前请提供与公司营业执照名称一致的对公账户，我们无法向个人账户付款。请同时书面确认交货日期、延期处理方式及分阶段付款安排。确认后我们再安排付款，谢谢。",
  },
};

export const demoCards = [
  { scenario: getScenario("contract"), title: "Supply contract", description: "A different company seal. An 80% deposit.", type: "CONTRACT" },
  { scenario: tristanScenario, title: "WeChat conversation", description: "Tristan is asked to pay a personal account.", type: "SCREENSHOT" },
  { scenario: getScenario("fapiao"), title: "Fapiao", description: "A seller mismatch and a total that doesn't add up.", type: "INVOICE" },
  { scenario: getScenario("notice"), title: "Government notice", description: "An administrative obligation with a deadline.", type: "NOTICE" },
];

// Cette correspondance n'est consultée que lorsque Demo Mode est activé.
// Elle ne remplace jamais une analyse normale par un résultat de démonstration.
export function uploadedDemo(name: string, enabled: boolean): DemoScenario | undefined {
  if (!enabled) return undefined;
  const files: Record<string, DemoScenario> = {
    "supply-contract-fictional.png": getScenario("contract"),
    "wechat-conversation-fictional.png": getScenario("wechat"),
    "wechat-conversation-tristan-fictional.png": tristanScenario,
    "fapiao-fictional.png": getScenario("fapiao"),
    "government-notice-fictional.png": getScenario("notice"),
  };
  return files[name];
}
