import { Extraction, Risk } from "../schema";
import { validateUscc } from "../rules/uscc";
import { validateSeal } from "../rules/chop";
import { validateFapiao } from "../rules/fapiao";

// Cette fonction reçoit les données déjà extraites et applique uniquement
// des règles de code. Elle ne fait aucun appel à l'IA.
export function runDeterministicChecks(extraction: Extraction): Risk[] {
  const risks: Risk[] = [];

  // Chaque partie peut avoir son propre USCC. On vérifie uniquement les codes
  // réellement trouvés : l'absence d'un code sera traitée par une autre règle.
  for (const party of extraction.parties) {
    if (party.uscc) {
      risks.push(...validateUscc(party.uscc, party.name));
    }
    if (party.sealName) {
      risks.push(...validateSeal(party.name, party.sealName));
    }
  }

  // La fapiao est optionnelle : cette règle ne s'exécute que si l'extraction
  // a trouvé au moins une information de facture.
  if (extraction.fapiao) {
    risks.push(...validateFapiao(extraction.fapiao));
  }

  // Cette validation finale protège le contrat partagé avant de transmettre
  // les risques aux étapes d'agrégation et d'affichage.
  return risks;
}
