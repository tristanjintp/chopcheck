import { Extraction, Risk, RiskSchema } from "../schema";
import { requestModel } from "./model";

// OpenAI-Next fournit une API compatible avec OpenAI Chat Completions.
// La clé reste dans l'environnement serveur et ne doit jamais être préfixée
// par NEXT_PUBLIC_, sinon elle serait envoyée au navigateur.

// Analyse les clauses avec le modèle choisi sur OpenAI-Next.
export async function analyzeClauses(extraction: Extraction): Promise<Risk[]> {
  // Le client partagé tente le modèle configuré, puis le secours si nécessaire.
  const content = await requestModel([
    { role: "system", content: buildSystemPrompt(extraction.documentText) },
    { role: "user", content: JSON.stringify({ document: extraction.documentText, clauses: extraction.clauses }) },
  ]);

  return validateAiRisks(parseJsonResponse(content), extraction.documentText);
}

// Le prompt impose un JSON minimal et interdit au modèle d'inventer des citations
// ou des références juridiques qui ne seraient pas fournies par l'application.
function buildSystemPrompt(documentText: string): string {
  return `You analyze Chinese commercial document clauses for business risks.
Return ONLY a JSON array. Each item must have exactly these fields:
id, level (critical|warning|note), title, quote_zh, explanation, fix,
source (always ai), legal_refs (always an empty array).
Write title, explanation and fix in clear English. Only quote_zh stays in Chinese.
quote_zh must be an exact substring of the document.
Do not invent legal article references. If there is no clear risk, return [].
Document:
${documentText}`;
}

// Les modèles renvoient parfois le JSON dans un bloc Markdown ; cette fonction
// retire ce décor avant de demander à JavaScript de lire le JSON.
function parseJsonResponse(content: string): unknown {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("The AI response was not valid JSON");
  }
}

// Vérifie chaque risque produit par l'IA et rejette les citations qui ne sont
// pas réellement présentes dans le document analysé.
function validateAiRisks(value: unknown, documentText: string): Risk[] {
  if (!Array.isArray(value)) throw new Error("The AI response must be a JSON array");

  return value.flatMap((candidate, index) => {
    const parsed = RiskSchema.safeParse({
      ...(candidate as Record<string, unknown>),
      source: "ai",
      legal_refs: [],
    });

    if (!parsed.success) {
      throw new Error(`Invalid AI risk at index ${index}`);
    }
    if (!documentText.includes(parsed.data.quote_zh)) {
      return [];
    }
    return [parsed.data];
  });
}
