import { NextResponse } from "next/server";
import { AnalyzeInputSchema } from "../../../lib/schema";
import { extract } from "../../../lib/analysis/extract";
import { runDeterministicChecks } from "../../../lib/analysis/deterministic";
import { analyzeClauses } from "../../../lib/analysis/clauses";
import { aggregate } from "../../../lib/analysis/aggregate";
import { generate } from "../../../lib/analysis/generate";

// Cette route reçoit les documents envoyés par l'interface et exécute toutes
// les étapes du pipeline uniquement côté serveur.
export async function POST(request: Request) {
  try {
    // On lit le JSON envoyé par le navigateur puis on vérifie son format.
    const body: unknown = await request.json();
    const input = AnalyzeInputSchema.parse(body);

    // Étape 1 : transformer le document en données structurées.
    const extraction = await extract(input);

    // Étape 2 : appliquer les contrôles fiables sans IA.
    const deterministicRisks = runDeterministicChecks(extraction);

    // Étape 3 : demander au modèle d'analyser les clauses.
    const clauseRisks = await analyzeClauses(extraction);

    // Étape 4 : fusionner les risques et calculer le verdict.
    const aggregated = aggregate(
      extraction,
      [...deterministicRisks, ...clauseRisks],
      input.language,
    );

    // Étape 5 : générer l'explication et la réponse chinoise.
    const analysis = await generate(aggregated);

    // Le rapport final est renvoyé au frontend en JSON.
    return NextResponse.json(analysis);
  } catch (error) {
    // Les erreurs de validation ou d'API sont renvoyées sans exposer de secret.
    const message = error instanceof Error ? error.message : "Unknown analysis error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
