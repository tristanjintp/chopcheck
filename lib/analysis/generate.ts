import { Analysis, AnalysisSchema } from "../schema";
import { AggregatedAnalysis } from "./aggregate";
import { requestModel } from "./model";

// Ajoute l'explication humaine et la réponse chinoise au résultat agrégé.
export async function generate(aggregated: AggregatedAnalysis): Promise<Analysis> {
  // La réponse finale suit le même repli que l'analyse des clauses.
  const content = await requestModel([
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
  ], 0.2);

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
