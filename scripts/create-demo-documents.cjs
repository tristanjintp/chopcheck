const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const sharp = require("sharp");

// Charge les données TypeScript existantes sans modifier les fichiers source.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
};
const { getScenario } = require("../lib/demo/scenarios.ts");
const { tristanScenario } = require("../lib/demo/presentation.ts");
const output = path.resolve(__dirname, "../demo-documents");
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Ces PNG sont des rendus de nos propres textes fictifs, pas des photos réelles.
// Ils restent hors de public/ pour être importés depuis le sélecteur de fichiers.
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const documents = [
    ["supply-contract-fictional.png", getScenario("contract")],
    ["wechat-conversation-fictional.png", getScenario("wechat")],
    ["wechat-conversation-tristan-fictional.png", tristanScenario],
    ["fapiao-fictional.png", getScenario("fapiao")],
    ["government-notice-fictional.png", getScenario("notice")],
  ];
  for (const [name, scenario] of documents) {
    const chat = scenario.id === "wechat";
    const lines = scenario.result.documentText.split("\n").slice(1).flatMap((line) => {
      const chunks = [];
      for (let i = 0; i < line.length; i += 23) chunks.push(line.slice(i, i + 23));
      if (chunks.length > 1 && /^[。？！，；]$/.test(chunks[chunks.length - 1])) {
        const punctuation = chunks.pop();
        chunks[chunks.length - 1] += punctuation;
      }
      return chunks;
    });
    const height = Math.max(820, 300 + lines.length * 76);
    const body = lines.map((line, i) => `${chat ? `<rect x="48" y="${232 + i * 76}" width="904" height="64" rx="12" fill="${line.startsWith("Tristan") || line.startsWith("Tom") ? "#dcecd7" : "#ffffff"}"/>` : ""}<text x="70" y="${274 + i * 76}" font-size="32" fill="#263140">${escape(line)}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}"><rect width="100%" height="100%" fill="${chat ? "#e9eded" : "#ffffff"}"/><rect width="1000" height="72" fill="#5554b5"/><text x="48" y="46" font-family="Arial" font-size="26" fill="white">DEMO / FICTIONAL · SAMPLE · 示例</text><text x="48" y="142" font-family="Arial" font-size="34" fill="#253145">${escape(scenario.title)}</text><text x="48" y="186" font-family="Arial" font-size="20" fill="#7b8495">ChopCheck · fictional document for a hackathon demo</text>${body}<text x="48" y="${height - 32}" font-family="Arial" font-size="18" fill="#7b8495">Not a real contract, invoice, official notice or WeChat export.</text></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(output, name));
    console.log(`Created demo-documents/${name}`);
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
