import { Analysis, AnalysisSchema } from "../schema";
import { AggregatedAnalysis } from "./aggregate";

const API_URL = "https://api.openai-next.com/v1/chat/completions";
const DEFAULT_MODEL = "claude-sonnet-4-5";

// Ajoute l'explication humaine et la réponse chinoise au résultat agrégé.
export async function generate(aggregated: AggregatedAnalysis): Promise<Analysis> {
  const apiKey = process.env.OPENAI_NEXT_API_KEY;

  // La génération utilise l'API uniquement côté serveur.
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
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You explain a Chinese commercial document to a non-lawyer.
Return ONLY a JSON object with exactly these fields:
explanation: a clear explanation in the requested language,
reply_zh: a polite Chinese message the user can send to the supplier.
The message should request corrections for detected risks, a valid company seal,
payment to a company account, and a safer payment schedule when relevant.
Do not invent facts or legal references.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            language: aggregated.language,
            documentType: aggregated.docType,
            verdict: aggregated.verdict,
            keyFacts: aggregated.keyFacts,
            summary: aggregated.summary,
            risks: aggregated.risks,
            actions: aggregated.actions,
          }),
        },
      ],
    }),
  });

  // Une erreur fournisseur doit être remontée clairement sans exposer la clé.
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI-Next request failed (${response.status}): ${details}`);
  }

  const payload = await response.json() as OpenAIChatResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI-Next returned an empty response");

  // On lit la réponse JSON produite par le modèle.
  const generated = parseJsonResponse(content);

  // On fusionne les données fiables du pipeline avec les deux champs générés,
  // puis on valide le rapport complet avant de le transmettre au frontend.
  return AnalysisSchema.parse({
    ...aggregated,
    explanation: generated.explanation,
    reply_zh: generated.reply_zh,
  });
}

// Les modèles peuvent entourer leur JSON de balises Markdown ; on les retire.
function parseJsonResponse(content: string): GeneratedText {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned) as Partial<GeneratedText>;
    if (typeof parsed.explanation !== "string" || typeof parsed.reply_zh !== "string") {
      throw new Error("Missing generated fields");
    }
    return {
      explanation: parsed.explanation,
      reply_zh: parsed.reply_zh,
    };
  } catch {
    throw new Error("The AI generation response was not valid JSON");
  }
}

type GeneratedText = {
  explanation: string;
  reply_zh: string;
};

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};
