import type { Analysis } from "../schema";

// Les quatre cas sont des documents fictifs. Chaque citation est copiée mot pour mot
// depuis le document afin que le surlignage fonctionne sans appel réseau.
export type DemoScenario = {
  id: "contract" | "wechat" | "fapiao" | "notice";
  title: string;
  day: string;
  situation: string;
  company: { name: string; status: string; note: string };
  result: Analysis;
};

export const scenarios: DemoScenario[] = [
  {
    id: "contract", title: "Supply Contract", day: "MON · DAY 1",
    situation: "Tom receives a supplier agreement before paying a deposit.",
    company: { name: "上海晨星贸易有限公司", status: "Name mismatch", note: "The contract names Morning Star Trading, while the seal names another company. Demo data; no official registry lookup." },
    result: {
      documentId: "contract", docType: "contract", language: "en",
      documentText: "示例 · SAMPLE — 采购合同\n甲方：上海晨星贸易有限公司\n乙方：上海蓝海科技有限公司\n合同总金额：人民币 120,000 元。\n付款方式：签约后支付80%定金，余款交货后支付。\n收款账户：张伟，账号 6222 0000 0000 1234。\n交货日期：2026年12月15日。\n乙方公章：上海远航科技有限公司。\n如发生争议，最终解释权归乙方所有。",
      verdict: { level: "high", headline: "HIGH RISK · Do not pay yet", action: "Request a corrected seal and a company bank account before sending the deposit." },
      keyFacts: { total: "¥120,000", delivery: "15 Dec 2026", payment: "80% deposit after signature", warranty: "Not specified" },
      summary: ["A ¥120,000 supplier agreement with delivery on 15 December.", "It asks for an 80% deposit immediately after signature.", "The payment account belongs to a person, not the named company.", "The seal names a different company."],
      risks: [
        { id: "seal", level: "critical", title: "Seal belongs to another company", quote_zh: "乙方公章：上海远航科技有限公司。", explanation: "The supplier is Blue Ocean Technology, but the company seal reads Far Sail Technology. You may be contracting with the wrong legal entity.", fix: "Ask for a contract stamped by 上海蓝海科技有限公司 and verify the legal entity before signing.", source: "rule", legal_refs: [] },
        { id: "account", level: "critical", title: "Payment to a personal account", quote_zh: "收款账户：张伟，账号 6222 0000 0000 1234。", explanation: "The money would go to an individual's account. This makes it harder to match the payment to the supplier and future invoice.", fix: "Request a bank account in the supplier company's exact legal name.", source: "ai", legal_refs: [] },
        { id: "deposit", level: "warning", title: "Large advance payment", quote_zh: "付款方式：签约后支付80%定金，余款交货后支付。", explanation: "Tom would pay most of the price before receiving the goods.", fix: "Propose milestone payments, for example 30% upfront, 60% on delivery, 10% after inspection.", source: "ai", legal_refs: [] },
      ],
      actions: [
        { id: "a1", label: "Verify the legal entity", description: "Request a business licence and a corrected company seal.", priority: "high" },
        { id: "a2", label: "Change payment details", description: "Pay only an account held by the named supplier company.", priority: "high" },
        { id: "a3", label: "Renegotiate the deposit", description: "Suggest 30% upfront, 60% at delivery and 10% after inspection.", priority: "medium" },
      ],
      explanation: "The document is risky because its seal and bank account do not match the named supplier. Resolve both before paying. The 80% deposit also shifts most of the delivery risk to Tom.",
      reply_zh: "您好，感谢发送合同。签署和付款前，请提供与合同乙方名称一致的营业执照及公司公章，并将收款账户改为该公司的对公账户。另外，我们建议付款安排调整为签约后30%、交货时60%、验收后10%。请发送修订版合同，谢谢。",
    },
  },
  {
    id: "wechat", title: "WeChat Chat", day: "TUE · DAY 2",
    situation: "The supplier gives Tom a vague assurance in chat.",
    company: { name: "上海蓝海科技有限公司", status: "Unverified", note: "Chat identity is not independently verified. Demo data; no WeChat integration." },
    result: {
      documentId: "wechat", docType: "wechat", language: "en",
      documentText: "示例 · SAMPLE — 微信聊天截图文字\nTom：这批货能在12月15日前交付吗？\n供应商：原则上问题不大，我们尽量安排。\nTom：如果延迟，怎么处理？\n供应商：后面再说吧，先付定金。",
      verdict: { level: "medium", headline: "WARNING · Get it in writing", action: "Confirm a fixed delivery date and delay terms in the contract." },
      keyFacts: { delivery: "15 Dec requested, not confirmed", payment: "Deposit requested" },
      summary: ["Tom asks whether delivery can happen before 15 December.", "The supplier gives a qualified, noncommittal answer.", "Delay terms are deferred while a deposit is requested."],
      risks: [
        { id: "vague", level: "warning", title: "No firm delivery commitment", quote_zh: "原则上问题不大，我们尽量安排。", explanation: "This means roughly ‘in principle it should be okay; we will try.’ It does not firmly promise delivery by the date.", fix: "Ask for a written delivery deadline and a consequence for delay.", source: "ai", legal_refs: [] },
        { id: "later", level: "warning", title: "Delay terms postponed", quote_zh: "后面再说吧，先付定金。", explanation: "The supplier wants payment before settling what happens if delivery slips.", fix: "Agree the delay and refund terms before paying a deposit.", source: "ai", legal_refs: [] },
      ],
      actions: [
        { id: "w1", label: "Confirm the date", description: "Get 15 December in the signed contract, not only in chat.", priority: "high" },
        { id: "w2", label: "Agree delay terms", description: "Ask what refund or remedy applies if the deadline is missed.", priority: "medium" },
      ],
      explanation: "The supplier's wording sounds reassuring but does not make a firm commitment. Tom should clarify the delivery and delay terms before paying.",
      reply_zh: "您好，为避免误解，请在合同中明确确认12月15日前交货，并写明延期时的处理方式和退款条件。确认这些条款后，我们再安排定金，谢谢。",
    },
  },
  {
    id: "fapiao", title: "Fapiao", day: "THU · DAY 4",
    situation: "The invoice arrives with a different seller name and an incorrect total.",
    company: { name: "上海远航科技有限公司", status: "Different entity", note: "Invoice seller differs from the supplier in the sample contract. Demo data; no tax platform lookup." },
    result: {
      documentId: "fapiao", docType: "fapiao", language: "en",
      documentText: "示例 · SAMPLE — 电子发票\n发票号码：12345678901234567890\n销售方：上海远航科技有限公司\n购买方：Tom Trading\n不含税金额：人民币 100,000 元\n税额：人民币 13,000 元\n价税合计：人民币 120,000 元",
      verdict: { level: "high", headline: "HIGH RISK · Request a corrected invoice", action: "Match the seller and recalculate the total before accounting for this fapiao." },
      keyFacts: { total: "¥120,000 stated", payment: "¥100,000 + ¥13,000 tax" },
      summary: ["The invoice states a total of ¥120,000.", "Its pre-tax amount plus tax equals ¥113,000, not ¥120,000.", "The seller differs from the supplier in Tom's sample contract."],
      risks: [
        { id: "math", level: "critical", title: "Invoice total does not add up", quote_zh: "价税合计：人民币 120,000 元", explanation: "¥100,000 plus ¥13,000 tax equals ¥113,000, while the invoice states ¥120,000.", fix: "Ask for a corrected fapiao with consistent amounts.", source: "rule", legal_refs: [] },
        { id: "entity", level: "critical", title: "Invoice names a different seller", quote_zh: "销售方：上海远航科技有限公司", explanation: "The invoice seller does not match the supplier in Tom's sample contract. The contract, payment and invoice should be reconciled.", fix: "Ask the supplier to explain the different entity and issue a matching invoice if appropriate.", source: "rule", legal_refs: [] },
      ],
      actions: [
        { id: "f1", label: "Reconcile the three flows", description: "Compare contract party, bank recipient and invoice seller.", priority: "high" },
        { id: "f2", label: "Request correction", description: "Ask for an invoice with a mathematically consistent total.", priority: "high" },
      ],
      explanation: "This invoice has two concrete inconsistencies: the arithmetic is wrong and the seller differs from the supplier in the contract. It needs correction and verification.",
      reply_zh: "您好，这张发票的不含税金额与税额合计为113,000元，但价税合计写为120,000元。另外，销售方名称与合同供应商不一致。请核对并提供更正后的发票及情况说明，谢谢。",
    },
  },
  {
    id: "notice", title: "Government Notice", day: "FRI · DAY 5",
    situation: "Tom receives an administrative notice with a response deadline.",
    company: { name: "Tom Trading", status: "Not applicable", note: "This scenario concerns a sample administrative notice, not a company registry check. Demo data." },
    result: {
      documentId: "notice", docType: "notice", language: "en",
      documentText: "示例 · SAMPLE — 行政通知\n致：Tom Trading\n请于2026年12月10日前提交营业执照复印件及经营场所证明。\n逾期未提交的，将按照有关规定处理。\n受理窗口：市场监督管理部门。",
      verdict: { level: "medium", headline: "WARNING · Deadline to verify", action: "Check the notice's authenticity and prepare the requested documents before 10 December." },
      keyFacts: { delivery: "10 Dec 2026 deadline" },
      summary: ["The notice requests a business licence copy and proof of business premises.", "It states a deadline of 10 December 2026.", "Consequences for late submission are not specified in this sample."],
      risks: [
        { id: "deadline", level: "warning", title: "Administrative deadline", quote_zh: "请于2026年12月10日前提交营业执照复印件及经营场所证明。", explanation: "The notice asks for two documents by a stated date. Tom should verify the sender and the current status before acting.", fix: "Confirm authenticity through the relevant official channel and prepare the two listed documents.", source: "ai", legal_refs: [] },
      ],
      actions: [
        { id: "n1", label: "Verify the notice", description: "Contact the authority through a separately verified official channel.", priority: "high" },
        { id: "n2", label: "Prepare documents", description: "Collect the licence copy and premises proof before the deadline.", priority: "medium" },
      ],
      explanation: "The sample notice contains a clear submission deadline. Its authenticity and current validity have not been verified; check them before responding.",
      reply_zh: "您好，我们已收到通知。请确认该通知的受理窗口和提交方式。我们将准备营业执照复印件及经营场所证明，并在核实后按要求提交。谢谢。",
    },
  },
];

export const getScenario = (id: DemoScenario["id"]) => scenarios.find((item) => item.id === id)!;
