import { Extraction, Risk, RiskSchema } from "../schema";

// OpenAI-Next fournit une API compatible avec OpenAI Chat Completions.
// La clé reste dans l'environnement serveur et ne doit jamais être préfixée
// par NEXT_PUBLIC_, sinon elle serait envoyée au navigateur.
const API_URL = "https://api.openai-next.com/v1/chat/completions";
const DEFAULT_MODEL = "claude-sonnet-4-5";

// Analyse les clauses avec le modèle choisi sur OpenAI-Next.
export async function analyzeClauses(extraction: Extraction): Promise<Risk[]> {
  const apiKey = process.env.OPENAI_NEXT_API_KEY;

  // Une clé absente est une erreur de configuration, pas un problème du document.
  if (!apiKey) {
    throw new Error("OPENAI_NEXT_API_KEY is not configured");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_NEXT_MODEL || DEFAULT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(extraction.documentText),
        },
        {
          role: "user",
          content: JSON.stringify({
            document: extraction.documentText,
            clauses: extraction.clauses,
          }),
        },
      ],
    }),
  });

  // On expose le message d'erreur du fournisseur pour faciliter le diagnostic,
  // sans jamais révéler la clé API.
  if (!response.ok) {
    throw new Error(`OpenAI-Next analysis failed (HTTP ${response.status}).`);
  }

  const payload = await response.json() as OpenAIChatResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI-Next returned an empty response");

  return validateAiRisks(parseJsonResponse(content), extraction.documentText);
}

// Le prompt impose un JSON minimal et interdit au modèle d'inventer des citations
// ou des références juridiques qui ne seraient pas fournies par l'application.
function buildSystemPrompt(documentText: string): string {
  return `You analyze Chinese commercial document clauses for business risks.
Return ONLY a JSON array. Each item must have exactly these fields:
id, level (critical|warning|note), title, quote_zh, explanation, fix,
source (always ai), legal_refs (always an empty array).
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

// Type local correspondant uniquement à la partie de réponse utilisée.
type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};
