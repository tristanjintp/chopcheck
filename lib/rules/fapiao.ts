import { Risk } from "../schema";

type FapiaoData = {
  number?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
};

// Vérifie le format du numéro et la cohérence arithmétique des montants.
export function validateFapiao(fapiao: FapiaoData): Risk[] {
  const risks: Risk[] = [];

  // Une facture détectée doit avoir un numéro de 20 chiffres.
  if (fapiao.number && !/^\d{20}$/.test(fapiao.number)) {
    risks.push({
      id: "fapiao-invalid-number",
      level: "warning",
      title: "Invalid fapiao number format",
      quote_zh: fapiao.number,
      explanation: "The electronic invoice number does not contain 20 digits.",
      fix: "Ask for the original electronic fapiao and verify its number on the official platform.",
      source: "rule",
      legal_refs: [],
    });
  }

  // Les trois montants doivent être présents pour vérifier l'addition.
  if (fapiao.subtotal !== undefined && fapiao.tax !== undefined && fapiao.total !== undefined) {
    const expectedTotal = Math.round((fapiao.subtotal + fapiao.tax) * 100) / 100;
    if (expectedTotal !== fapiao.total) {
      risks.push({
        id: "fapiao-total-mismatch",
        level: "critical",
        title: "Fapiao total does not match the tax calculation",
        quote_zh: `subtotal=${fapiao.subtotal}, tax=${fapiao.tax}, total=${fapiao.total}`,
        explanation: "The subtotal plus VAT is different from the stated total.",
        fix: "Request a corrected fapiao whose subtotal, VAT and total reconcile exactly.",
        source: "rule",
        legal_refs: [],
      });
    }
  }

  return risks;
}
