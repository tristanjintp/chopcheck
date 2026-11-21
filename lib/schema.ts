import { z } from "zod";

export const DocTypeSchema = z.enum(["contract", "wechat", "fapiao", "notice", "other"]);
export type DocType = z.infer<typeof DocTypeSchema>;

export const VerdictLevelSchema = z.enum(["high", "medium", "low"]);
export type VerdictLevel = z.infer<typeof VerdictLevelSchema>;

export const RiskLevelSchema = z.enum(["critical", "warning", "note"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RiskSourceSchema = z.enum(["rule", "ai"]);
export type RiskSource = z.infer<typeof RiskSourceSchema>;

export const ExplanationLanguageSchema = z.enum(["fr", "en", "zh"]);
export type ExplanationLanguage = z.infer<typeof ExplanationLanguageSchema>;

export const VerdictSchema = z.object({
  level: VerdictLevelSchema,
  headline: z.string().min(1),
  action: z.string().min(1).optional(),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const KeyFactsSchema = z.object({
  total: z.string().optional(),
  delivery: z.string().optional(),
  payment: z.string().optional(),
  warranty: z.string().optional(),
});
export type KeyFacts = z.infer<typeof KeyFactsSchema>;

export const LegalReferenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  explanation: z.string().optional(),
});
export type LegalReference = z.infer<typeof LegalReferenceSchema>;

export const RiskSchema = z.object({
  id: z.string().min(1),
  level: RiskLevelSchema,
  title: z.string().min(1),
  quote_zh: z.string().min(1),
  explanation: z.string().min(1),
  fix: z.string().min(1),
  source: RiskSourceSchema,
  legal_refs: z.array(LegalReferenceSchema).default([]),
});
export type Risk = z.infer<typeof RiskSchema>;

export const ActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});
export type Action = z.infer<typeof ActionSchema>;

export const AnalysisSchema = z.object({
  documentId: z.string().optional(),
  documentText: z.string().min(1),
  docType: DocTypeSchema,
  language: ExplanationLanguageSchema.default("en"),
  verdict: VerdictSchema,
  keyFacts: KeyFactsSchema,
  summary: z.array(z.string().min(1)).min(1),
  risks: z.array(RiskSchema),
  actions: z.array(ActionSchema),
  explanation: z.string().min(1),
  reply_zh: z.string().optional(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const ExtractionSchema = z.object({
  documentText: z.string().min(1),
  docType: DocTypeSchema,
  parties: z.array(z.object({
    role: z.string().min(1),
    name: z.string().min(1),
    uscc: z.string().optional(),
    sealName: z.string().optional(),
  })).default([]),
  amounts: z.array(z.object({
    label: z.string().min(1),
    value: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    quote_zh: z.string().min(1).optional(),
  })).default([]),
  dates: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1),
    quote_zh: z.string().min(1).optional(),
  })).default([]),
  bankAccounts: z.array(z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    quote_zh: z.string().min(1).optional(),
  })).default([]),
  seals: z.array(z.object({
    name: z.string().min(1),
    quote_zh: z.string().min(1),
  })).default([]),
  clauses: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    text_zh: z.string().min(1),
  })).default([]),
  fapiao: z.object({
    number: z.string().optional(),
    subtotal: z.number().nonnegative().optional(),
    tax: z.number().nonnegative().optional(),
    total: z.number().nonnegative().optional(),
  }).optional(),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

export const AnalyzeInputSchema = z.object({
  text: z.string().min(1).optional(),
  imageBase64: z.string().min(1).optional(),
  language: ExplanationLanguageSchema.default("en"),
}).refine((input) => Boolean(input.text || input.imageBase64), {
  message: "Provide either text or imageBase64",
});
export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;
