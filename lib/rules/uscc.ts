import { Risk } from "../schema";

// Alphabet autorisé par le format USCC. Certaines lettres sont exclues
// pour éviter les confusions avec des chiffres ou d'autres caractères.
const USCC_CHARACTERS = "0123456789ABCDEFGHJKLMNPQRTUWXY";

// Poids utilisés par la formule officielle de contrôle USCC.
const USCC_WEIGHTS = [1, 3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

// Correspondance entre le reste de la formule et le dernier caractère attendu.
const CHECK_CHARACTERS = "0123456789ABCDEFGHJKLMNPQRTUWXY";

// Vérifie la structure et le caractère de contrôle d'un code USCC.
export function isValidUscc(value: string): boolean {
  const code = value.trim().toUpperCase();

  // Un USCC contient exactement 18 caractères.
  if (code.length !== 18) return false;

  // Tous les caractères doivent appartenir à l'alphabet autorisé.
  if ([...code].some((character) => !USCC_CHARACTERS.includes(character))) {
    return false;
  }

  // On calcule le reste à partir des 17 premiers caractères.
  const sum = [...code.slice(0, 17)].reduce((total, character, index) => {
    return total + USCC_CHARACTERS.indexOf(character) * USCC_WEIGHTS[index];
  }, 0);
  const expectedCheckCharacter = CHECK_CHARACTERS[(31 - (sum % 31)) % 31];

  // Le dernier caractère doit correspondre au caractère calculé.
  return code[17] === expectedCheckCharacter;
}

// Applique la règle à une partie extraite et renvoie un risque uniquement
// lorsque le code est présent mais invalide.
export function validateUscc(uscc: string, partyName: string): Risk[] {
  const code = uscc.trim();
  if (!code || isValidUscc(code)) return [];

  return [{
    id: `uscc-invalid-${code}`,
    level: "critical",
    title: "Invalid Chinese Unified Social Credit Code",
    quote_zh: code,
    explanation: `The USCC associated with ${partyName} does not pass the format or check-character validation.`,
    fix: "Ask the supplier for the official 18-character USCC and compare it with the business licence.",
    source: "rule",
    legal_refs: [],
  }];
}
