// Ce module centralise les appels au fournisseur. La clé reste côté serveur.
// Un modèle de secours est utilisé quand le modèle choisi répond 503.
type ModelMessage = {
  role: "system" | "user";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
};

export async function requestModel(messages: ModelMessage[], temperature = 0): Promise<string> {
  const apiKey = process.env.OPENAI_NEXT_API_KEY;
  if (!apiKey) throw new Error("Add OPENAI_NEXT_API_KEY to .env.local, then restart the app.");

  const primary = process.env.OPENAI_NEXT_MODEL || "claude-sonnet-4-5";
  const fallback = process.env.OPENAI_NEXT_FALLBACK_MODEL || "gpt-4o-mini";
  const models = primary === fallback ? [primary] : [primary, fallback];

  for (const [index, model] of models.entries()) {
    let response: Response;
    try {
      // Une limite par appel évite de figer l'interface si le fournisseur tarde.
      response = await fetch("https://api.openai-next.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, temperature, messages }),
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      if (index < models.length - 1) continue;
      throw new Error("The model connection timed out. Try again or use a demo scenario.");
    }

    // 503 indique un modèle momentanément indisponible. Le modèle de secours
    // traite exactement le même document avec le même prompt.
    if (response.status === 503 && index < models.length - 1) continue;
    if (!response.ok) throw new Error(`Model service returned HTTP ${response.status}. Try again or use a demo scenario.`);

    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("The model returned no readable response.");
    return content;
  }

  throw new Error("No model is available right now. Use a demo scenario.");
}
