import { Risk } from "../schema";

// Compare le nom légal de la partie avec le nom trouvé sur son sceau.
export function validateSeal(partyName: string, sealName: string): Risk[] {
  const normalizedParty = partyName.replace(/\s+/g, "").trim();
  const normalizedSeal = sealName.replace(/\s+/g, "").trim();

  // Un nom identique ne présente pas de risque.
  if (!normalizedParty || normalizedParty === normalizedSeal) return [];

  // Une différence de nom doit être vérifiée manuellement avant signature.
  return [{
    id: `seal-mismatch-${partyName}`,
    level: "critical",
    title: "Company name does not match the seal",
    quote_zh: sealName,
    explanation: `The seal name (${sealName}) differs from the contracting party (${partyName}).`,
    fix: "Ask for a corrected seal or official proof explaining the difference before signing.",
    source: "rule",
    legal_refs: [],
  }];
}
