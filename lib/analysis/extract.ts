// On importe les validateurs et les types définis dans schema.ts.
// Cela garantit que les données produites ici ont toujours la forme attendue
// par les prochaines étapes de l'analyse.
import { AnalyzeInput, AnalyzeInputSchema, Extraction, ExtractionSchema } from "../schema";

// Cette fonction est le point d'entrée principal pour un document déjà converti
// en texte. Elle orchestre toutes les petites fonctions d'extraction ci-dessous.
/**
 * Extrait les éléments simples d'un texte déjà lisible.
 *
 * Cette première version est volontairement déterministe : elle permet de
 * tester le pipeline sans clé API. Une extraction Claude/OCR pourra ensuite
 * enrichir le même objet et être validée par ExtractionSchema.
 */
export function extractFromText(text: string): Extraction {
  // Les espaces au début et à la fin ne contiennent pas d'information utile.
  // On les retire avant de commencer l'analyse.
  const documentText = text.trim();

  // Un document vide ne peut pas être analysé. On arrête donc immédiatement
  // avec un message compréhensible plutôt que de produire un faux résultat.
  if (!documentText) {
    throw new Error("The document text cannot be empty");
  }

  // Chaque fonction récupère une catégorie d'information différente.
  // Le résultat final rassemble toutes ces catégories dans un seul objet.
  const result: Extraction = {
    documentText,
    docType: detectDocType(documentText),
    parties: extractParties(documentText),
    amounts: extractAmounts(documentText),
    dates: extractDates(documentText),
    bankAccounts: extractBankAccounts(documentText),
    seals: extractSeals(documentText),
    clauses: extractClauses(documentText),
    fapiao: extractFapiao(documentText),
  };

  // Zod vérifie ici que le résultat respecte le contrat partagé du projet.
  // Si une donnée obligatoire manque ou a un mauvais format, une erreur est levée.
  return ExtractionSchema.parse(result);
}

// Cette fonction cherche les informations chiffrées les plus simples d'une
// fapiao. Elle ne remplace pas encore une lecture OCR complète du document.
function extractFapiao(text: string): Extraction["fapiao"] {
  // Le numéro d'une facture électronique chinoise est généralement présenté
  // comme une suite de 20 chiffres.
  const numberMatch = text.match(/(?:发票号码|invoice\s*(?:no|number)?)\s*[:：]?\s*(\d{20})/i);
  const subtotal = extractLabeledAmount(text, /(?:不含税|金额|subtotal)\s*[:：]?\s*(?:人民币|RMB|¥|￥)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const tax = extractLabeledAmount(text, /(?:税额|VAT|tax)\s*[:：]?\s*(?:人民币|RMB|¥|￥)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const total = extractLabeledAmount(text, /(?:价税合计|含税合计|total)\s*[:：]?\s*(?:人民币|RMB|¥|￥)?\s*([\d,]+(?:\.\d{1,2})?)/i);

  if (!numberMatch && subtotal === undefined && tax === undefined && total === undefined) {
    return undefined;
  }

  return { number: numberMatch?.[1], subtotal, tax, total };
}

// Convertit un montant écrit après un libellé en nombre utilisable par les règles.
function extractLabeledAmount(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  return match?.[1] ? Number(match[1].replace(/,/g, "")) : undefined;
}

// Cette fonction sera appelée par la route API. Elle accepte le format envoyé
// par l'utilisateur et choisit pour l'instant uniquement le chemin texte.
export async function extract(input: AnalyzeInput): Promise<Extraction> {
  // On valide la requête avant de la traiter : il faut au moins du texte ou une image.
  const parsedInput = AnalyzeInputSchema.parse(input);

  if (parsedInput.text) return extractFromText(parsedInput.text);
  // La photo est lue par le modèle vision via la même clé locale que l'analyse.
  // Le texte retourné passe ensuite par la même extraction que le texte collé.
  return extractFromText(await readImageText(parsedInput.imageBase64!));
}

// Cette fonction demande une transcription fidèle des caractères visibles.
// Un format data URL valide évite les URL distantes et les fichiers arbitraires.
async function readImageText(dataUrl: string): Promise<string> {
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
    throw new Error("Please upload a PNG, JPEG or WebP image.");
  }
  const apiKey = process.env.OPENAI_NEXT_API_KEY;
  if (!apiKey) throw new Error("Local API key missing. Add OPENAI_NEXT_API_KEY to .env.local.");
  const response = await fetch("https://api.openai-next.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_NEXT_MODEL || "claude-sonnet-4-5",
      messages: [{ role: "user", content: [
        { type: "text", text: "Transcribe every visible line of this Chinese commercial document faithfully. Return only the document text, preserving Chinese characters, numbers and line breaks. Do not infer missing text." },
        { type: "image_url", image_url: { url: dataUrl } },
      ] }],
    }),
  });
  if (!response.ok) throw new Error(`Image transcription failed (HTTP ${response.status}).`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No readable text found in the image.");
  return text;
}

// Les mots-clés permettent d'estimer le type du document sans appeler l'IA.
// Cette détection est volontairement simple et pourra être améliorée plus tard.
function detectDocType(text: string): Extraction["docType"] {
  if (/发票|电子普通发票|增值税发票|fapiao/i.test(text)) return "fapiao";
  if (/微信|wechat|wxid/i.test(text)) return "wechat";
  if (/通知|notice/i.test(text)) return "notice";
  if (/合同|协议|contract|agreement/i.test(text)) return "contract";
  return "other";
}

// Cette fonction cherche les deux parties classiques d'un contrat chinois.
// Elle renvoie une liste vide si aucun nom reconnaissable n'est trouvé.
function extractParties(text: string): Extraction["parties"] {
  const parties: Extraction["parties"] = [];
  const patterns = [
    /(?:甲方|party\s*a|buyer|买方)\s*[:：]?\s*([^\n,，;；]+)/i,
    /(?:乙方|party\s*b|seller|卖方)\s*[:：]?\s*([^\n,，;；]+)/i,
  ];

  // Chaque expression régulière correspond à un rôle : partie A ou partie B.
  patterns.forEach((pattern, index) => {
    const match = text.match(pattern);
    if (match?.[1]) {
      parties.push({
        role: index === 0 ? "party_a" : "party_b",
        name: match[1].trim(),
        uscc: text.match(/(?:统一社会信用代码|USCC)\s*[:：]?\s*([0-9A-HJ-NPQRTUWXY]{18})/i)?.[1],
        sealName: index === 1 ? text.match(/(?:乙方公章|乙方盖章)\s*[:：]?\s*([^\n,，;；]+)/)?.[1]?.replace(/[。.]$/, "") : undefined,
      });
    }
  });

  return parties;
}

// Cette fonction recherche des montants écrits avec les symboles ou noms
// courants du yuan chinois, puis transforme le nombre trouvé en valeur numérique.
function extractAmounts(text: string): Extraction["amounts"] {
  const amounts: Extraction["amounts"] = [];
  const pattern = /(?:人民币|RMB|CNY|¥|￥)\s*([\d,]+(?:\.\d{1,2})?)/gi;
  let match: RegExpExecArray | null;

  // La boucle continue jusqu'à trouver toutes les occurrences de montant.
  while ((match = pattern.exec(text)) !== null) {
    const value = Number(match[1].replace(/,/g, ""));
    amounts.push({
      label: "amount",
      value,
      currency: "CNY",
      quote_zh: match[0],
    });
  }

  return amounts;
}

// Cette fonction cherche des dates au format numérique ou au format chinois,
// par exemple 2026-12-01 ou 2026年12月1日.
function extractDates(text: string): Extraction["dates"] {
  const dates: Extraction["dates"] = [];
  const pattern = /(?:20\d{2}[-/.年]\s*\d{1,2}[-/.月]\s*\d{1,2}日?)/g;
  let match: RegExpExecArray | null;

  // Un document peut contenir plusieurs dates : signature, livraison, paiement...
  while ((match = pattern.exec(text)) !== null) {
    dates.push({
      label: "date",
      value: match[0].trim(),
      quote_zh: match[0],
    });
  }

  return dates;
}

// Cette fonction repère les numéros associés à un compte bancaire.
// Elle conserve également la citation exacte pour permettre un affichage vérifiable.
function extractBankAccounts(text: string): Extraction["bankAccounts"] {
  const accounts: Extraction["bankAccounts"] = [];
  const pattern = /(?:账号|账户|account(?:\s+number)?|银行卡)\s*[:：]?\s*(\d[\d\s-]{7,})/gi;
  let match: RegExpExecArray | null;

  // On parcourt toutes les correspondances trouvées dans le document.
  while ((match = pattern.exec(text)) !== null) {
    accounts.push({
      accountNumber: match[1].replace(/[\s-]/g, ""),
      quote_zh: match[0],
    });
  }

  return accounts;
}

// Cette fonction cherche les mentions de sceau ou de tampon chinois.
// Le nom récupéré pourra ensuite être comparé au nom de l'entreprise.
function extractSeals(text: string): Extraction["seals"] {
  const seals: Extraction["seals"] = [];
  const pattern = /(?:公章|合同章|盖章|seal)\s*[:：]?\s*([^\n,，;；]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    seals.push({
      name: match[1].trim(),
      quote_zh: match[0],
    });
  }

  return seals;
}

// Pour cette première version, chaque ligne non vide est considérée comme une clause.
// Cela fournit un support simple aux règles et à l'analyse IA en attendant
// une extraction plus intelligente des articles et paragraphes.
function extractClauses(text: string): Extraction["clauses"] {
  // split sépare le document ligne par ligne, puis map construit un objet clause.
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      id: `clause-${index + 1}`,
      title: `Clause ${index + 1}`,
      text_zh: line,
    }));
}
