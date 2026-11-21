import {
  Action,
  Analysis,
  ExplanationLanguage,
  Extraction,
  KeyFacts,
  Risk,
  Verdict,
} from "../schema";

// Résultat intermédiaire : generate.ts ajoutera ensuite l'explication finale
// et le message chinois avant de construire un objet Analysis complet.
export type AggregatedAnalysis = Omit<Analysis, "explanation" | "reply_zh">;

// Fusionne les résultats des règles et de l'analyse IA.
export function aggregate(
  extraction: Extraction,
  risks: Risk[],
  language: ExplanationLanguage = "fr",
): AggregatedAnalysis {
  // Un même risque peut être détecté par plusieurs étapes. On garde la première
  // occurrence identifiée par son id pour éviter de l'afficher deux fois.
  const uniqueRisks = deduplicateRisks(risks);

  // Les risques critiques doivent apparaître avant les avertissements et les notes.
  const sortedRisks = [...uniqueRisks].sort(compareRiskSeverity);

  // Le verdict est calculé à partir du risque le plus grave trouvé.
  const verdict = buildVerdict(sortedRisks);

  // On prépare les informations simples visibles dans le panneau de synthèse.
  const keyFacts = buildKeyFacts(extraction);
  const summary = buildSummary(extraction, sortedRisks);
  const actions = buildActions(sortedRisks);

  return {
    documentText: extraction.documentText,
    docType: extraction.docType,
    language,
    verdict,
    keyFacts,
    summary,
    risks: sortedRisks,
    actions,
  };
}

// Supprime les doublons en conservant le premier risque rencontré.
function deduplicateRisks(risks: Risk[]): Risk[] {
  const seen = new Set<string>();
  return risks.filter((risk) => {
    if (seen.has(risk.id)) return false;
    seen.add(risk.id);
    return true;
  });
}

// Transforme le niveau textuel en nombre pour pouvoir trier les risques.
function compareRiskSeverity(left: Risk, right: Risk): number {
  const severity = { critical: 0, warning: 1, note: 2 };
  return severity[left.level] - severity[right.level];
}

// Construit le verdict global à partir du risque le plus important.
function buildVerdict(risks: Risk[]): Verdict {
  if (risks.some((risk) => risk.level === "critical")) {
    return {
      level: "high",
      headline: "High-risk document: verify before signing",
      action: "Resolve the critical issues before making a payment or signing.",
    };
  }

  if (risks.some((risk) => risk.level === "warning")) {
    return {
      level: "medium",
      headline: "Some points need clarification",
      action: "Ask the supplier to clarify the warnings before proceeding.",
    };
  }

  return {
    level: "low",
    headline: "No major risk detected",
    action: "Keep the source documents and complete your normal checks.",
  };
}

// Extrait les quatre informations prévues par l'interface.
function buildKeyFacts(extraction: Extraction): KeyFacts {
  const firstAmount = extraction.amounts[0];
  const firstDate = extraction.dates[0];
  return {
    total: firstAmount?.value !== undefined
      ? `${firstAmount.value} ${firstAmount.currency || ""}`.trim()
      : undefined,
    delivery: firstDate?.value,
    payment: extraction.clauses.find((clause) => /付款|payment|paiement/i.test(clause.text_zh))?.text_zh,
    warranty: extraction.clauses.find((clause) => /保修|质保|warranty|garantie/i.test(clause.text_zh))?.text_zh,
  };
}

// Crée un résumé lisible sans demander une nouvelle réponse au modèle.
function buildSummary(extraction: Extraction, risks: Risk[]): string[] {
  const summary: string[] = [];
  summary.push(`Document type: ${extraction.docType}.`);
  if (extraction.parties.length > 0) {
    summary.push(`${extraction.parties.length} contracting party/parties identified.`);
  }
  if (extraction.amounts.length > 0) {
    summary.push(`${extraction.amounts.length} amount(s) identified.`);
  }
  if (extraction.dates.length > 0) {
    summary.push(`${extraction.dates.length} date(s) identified.`);
  }
  summary.push(`${risks.length} risk(s) detected by the current checks.`);
  return summary;
}

// Chaque risque devient une action courte affichable par le frontend.
function buildActions(risks: Risk[]): Action[] {
  return risks.map((risk) => ({
    id: `action-${risk.id}`,
    label: risk.level === "critical" ? "Resolve this issue" : "Clarify this point",
    description: risk.fix,
    priority: risk.level === "critical" ? "high" : risk.level === "warning" ? "medium" : "low",
  }));
}
