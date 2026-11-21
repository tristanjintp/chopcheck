import { Extraction, Risk, RiskSchema } from "../schema";
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
    // Le calcul de TVA ne contient pas une citation à lui seul. On l'associe
    // à la ligne du total réellement présente dans le document source.
    const invoiceRisks = validateFapiao(extraction.fapiao);
    const totalLine = extraction.clauses.find((clause) => /价税合计|含税合计|total/i.test(clause.text_zh));
    risks.push(...invoiceRisks.map((risk) => risk.id === "fapiao-total-mismatch" && totalLine
      ? { ...risk, quote_zh: totalLine.text_zh }
      : risk));
  }

  // Cette validation finale protège le contrat partagé avant de transmettre
  // les risques aux étapes d'agrégation et d'affichage.
  // Seuls les risques dont la citation figure exactement dans le texte
  // passent au rapport. Les erreurs calculées sans citation sont omises.
  return risks.filter((risk) => extraction.documentText.includes(risk.quote_zh))
    .map((risk) => RiskSchema.parse(risk));
}
