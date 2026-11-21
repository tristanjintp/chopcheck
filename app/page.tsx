"use client";

import { useEffect, useRef, useState } from "react";
import AnalysisComposer, { type InputMode } from "../components/AnalysisComposer";
import DemoGallery from "../components/DemoGallery";
import { tristanScenario, uploadedDemo } from "../lib/demo/presentation";
import type { Analysis, ExplanationLanguage } from "../lib/schema";
import { getScenario, scenarios, type DemoScenario } from "../lib/demo/scenarios";

// Découpe le document autour des citations exactes afin de les surligner.
function DocumentText({ result, selected }: { result: Analysis; selected: string | null }) {
  const activeRef = useRef<HTMLElement>(null);
  useEffect(() => { activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [selected]);
  const matches = result.risks.flatMap((risk) => {
    const start = result.documentText.indexOf(risk.quote_zh);
    return start < 0 ? [] : [{ risk, start, end: start + risk.quote_zh.length }];
  }).sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    parts.push(result.documentText.slice(cursor, match.start));
    parts.push(<mark key={match.risk.id} ref={selected === match.risk.id ? activeRef : undefined} className={`quote ${selected === match.risk.id ? "quote-selected" : ""}`} title={match.risk.title}>{result.documentText.slice(match.start, match.end)}</mark>);
    cursor = match.end;
  }
  parts.push(result.documentText.slice(cursor));
  return <div className="document-text" lang="zh">{parts}</div>;
}

// FileReader convertit une photo ou une capture en entrée pour l'API locale.
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export default function HomePage() {
  const [screen, setScreen] = useState<"home" | "results">("home");
  const [mode, setMode] = useState<InputMode>("photo");
  const [demoMode, setDemoMode] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [language, setLanguage] = useState<ExplanationLanguage>("en");
  const resultRef = useRef<HTMLElement>(null);
  const operationRef = useRef(0);
  const demoModeRef = useRef(false);
  demoModeRef.current = demoMode;
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  // Le scénario charge un résultat instantané, vérifié et sans réseau.
  function showScenario(item: DemoScenario) {
    requestRef.current?.abort();
    requestRef.current = null;
    operationRef.current++;
    setScreen("results"); setCompanyOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScenario(item); setResult(item.result); setSelected(null); setDraft("");
    setImage(null); setImageName(""); setBusy(false); setMessage(""); setCopied(false);
  }
  function reset() {
    requestRef.current?.abort();
    requestRef.current = null;
    operationRef.current++;
    setScreen("home"); setCompanyOpen(false); setMode("photo");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScenario(null); setResult(null); setSelected(null); setDraft("");
    setImage(null); setImageName(""); setBusy(false); setMessage(""); setCopied(false);
  }
  async function acceptFile(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5_000_000) { setMessage("Choose a PNG, JPEG or WebP under 5 MB."); return; }
    // En mode démo uniquement, les noms de nos fichiers fictifs chargent un
    // résultat enregistré. Les uploads ordinaires suivent toujours l'API réelle.
    const knownFile = uploadedDemo(file.name, demoModeRef.current);
    const operation = ++operationRef.current;
    // La photo est analysée dès qu'elle est choisie ou collée.
    try {
      setMessage("Reading image…");
      const imageData = await readImage(file);
      if (operation !== operationRef.current) return;
      if (knownFile) { showScenario(knownFile); setImage(imageData); setImageName(file.name); return; }
      setImage(imageData); setImageName(file.name); setScenario(null); setResult(null); setDraft("");
      // Autorise la sélection du même fichier après un échec ou un nouvel essai.
      if (fileRef.current) fileRef.current.value = "";
      await analyze({ imageBase64: imageData });
    }
    catch { setMessage("Could not read the image."); }
  }
  // Une image copiée dans le presse-papiers peut être collée directement sur la page.
  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files || []).find((entry) => entry.type.startsWith("image/"));
      if (file) { event.preventDefault(); void acceptFile(file); }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []);

  // Le délai maximum évite une attente infinie lorsque la connexion au modèle échoue.
  async function analyze(source?: { imageBase64?: string; text?: string }) {
    // Une image passée en argument évite d'attendre la mise à jour de React.
    const payload = source || (image ? { imageBase64: image } : { text: draft.trim() });
    if (!payload.imageBase64 && !payload.text) { setMessage("Paste text or add an image first."); return; }
    requestRef.current?.abort();
    setScreen("results"); setCompanyOpen(false);
    setBusy(true); setMessage(payload.imageBase64 ? "Reading Chinese text from the image…" : "Analyzing the document…"); setResult(null); setScenario(null);
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, language }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      if (requestRef.current !== controller) return;
      setResult(data as Analysis); setSelected(null); setMessage("Analysis complete.");
    } catch (error) { if (requestRef.current === controller) setMessage(`Analysis could not finish (${error instanceof Error && error.name === "AbortError" ? "timeout" : error instanceof Error ? error.message : "error"}). Try again or open a demo scenario.`); }
    finally { window.clearTimeout(timer); if (requestRef.current === controller) { requestRef.current = null; setBusy(false); } }
  }

  // Le même bouton accepte le texte ou une capture présente dans le presse-papiers.
  async function pasteContent() {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((value) => value.startsWith("image/"));
        if (type) { await acceptFile(new File([await item.getType(type)], "pasted-image.png", { type })); return; }
        if (item.types.includes("text/plain")) {
          setDraft(await (await item.getType("text/plain")).text()); setImage(null); setMode("text"); return;
        }
      }
      setMessage("Clipboard is empty. Use ⌘/Ctrl+V or Upload.");
    } catch { setMessage("Use ⌘/Ctrl+V in the input, or choose Upload."); }
  }

  async function copyReply() {
    if (!result?.reply_zh) return;
    try { await navigator.clipboard.writeText(result.reply_zh); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { setMessage("Select the Chinese text and copy it manually."); }
  }

  const verdictLabel = result?.verdict.level === "high" ? "HIGH RISK" : result?.verdict.level === "medium" ? "WARNING" : "SAFE";
  return <main className="shell">
    <header className="topbar">
      <button className="brand" onClick={reset} aria-label="ChopCheck home"><span>章</span><div><strong>ChopCheck</strong><small>Understand Chinese business documents before you sign or pay</small></div></button>
      <nav className="top-actions" aria-label="Main navigation">
        <label className="language-label">Explain in <select aria-label="Explanation language" value={language} onChange={(event) => setLanguage(event.target.value as ExplanationLanguage)}><option value="en">English</option><option value="fr">Français</option><option value="zh">中文</option></select></label>
        <button className="button subtle" onClick={() => { reset(); setMode("demo"); }}>Demo scenarios</button>
        <button className={demoMode ? "button demo-active" : "button outline"} aria-pressed={demoMode} onClick={() => { reset(); setDemoMode(!demoMode); }}>{demoMode ? "Demo Mode on" : "Demo Mode"}</button>
      </nav>
    </header>
    {screen === "home" ? <>
      <section className="home-intro"><span className="product-label">CLARITY BEFORE COMMITMENT</span><h1>Chinese documents.<br /><em>Clear decisions.</em></h1><p>Understand what your Chinese business documents really mean.</p><small>Upload a document, paste a WeChat conversation, or try a demo scenario.</small></section>
      {demoMode && <p className="demo-notice">Demo Mode · Upload a supplied fictional PNG to use its saved result. Other documents use live analysis.</p>}
      <AnalysisComposer mode={mode} onMode={(value) => { setMode(value); setCompanyOpen(false); }} draft={draft} onDraft={(text) => { setDraft(text); setImage(null); }} busy={busy} message={message}
        onFile={(file) => void acceptFile(file)}
        onPaste={() => void pasteContent()}
        onSubmit={() => { if (mode === "company") setCompanyOpen(true); else if (mode === "demo") document.getElementById("demo-scenarios")?.scrollIntoView({ behavior: "smooth" }); else void analyze(); }} />
      {companyOpen && <section className="panel home-company" role="status"><span className="tag">Demo data · Mock integration</span><h2>{draft.trim() || getScenario("contract").company.name}</h2><p>No official registry is connected. A real company check is on the roadmap.</p><p>For the fictional supplier, the contract, seal and account names do not match.</p><button className="button outline" onClick={() => showScenario(getScenario("contract"))}>View sample company check</button></section>}
      <DemoGallery onOpen={showScenario} />
    </> : <>
      <div className="results-nav"><button className="button outline" onClick={reset}>New analysis</button><button className="button subtle" onClick={() => { reset(); setMode("demo"); }}>Try another scenario</button><a className="button subtle" href="#next-steps">Next steps</a><a className="button subtle" href="#reply">Reply</a><span>{scenario ? "Demo / Fictional · saved analysis in English" : "Your document · live analysis"}</span><button className="button subtle" onClick={reset}>Reset analysis</button></div>
      {scenario && <nav className="scenario-switch" aria-label="Switch scenario">{scenarios.map((item) => <button key={item.id} className="button subtle" onClick={() => showScenario(item.id === "wechat" ? tristanScenario : item)}>{item.title}</button>)}<button className="button subtle" onClick={() => showScenario(getScenario("wechat"))}>Original WeChat</button></nav>}
    <section className="workspace" ref={resultRef}><div className="left-column">
      {!scenario && message && <div className="panel upload-status" role="status">{busy && <span className="spinner" aria-hidden="true" />}<strong>{message}</strong>{!busy && (image || draft.trim()) && <button className="button outline" onClick={() => void analyze()}>Try again</button>}</div>}
      <section className="panel document-panel"><div className="panel-heading"><div><p className="eyebrow">SOURCE DOCUMENT</p><h2>{scenario?.title || imageName || "Your document"}</h2></div><span className="tag">{scenario ? "SAMPLE · 示例" : "LOCAL INPUT"}</span></div>{scenario && <p className="muted">{scenario.situation}</p>}{result ? <>{image && <><img className="uploaded-image" src={image} alt="Uploaded document" /><p className="muted">Transcription used for exact quote highlighting:</p></>}<DocumentText result={result} selected={selected} /></> : image ? <img className="uploaded-image" src={image} alt="Uploaded document preview" /> : <div className="empty-document">Select a scenario or add your own document below.</div>}</section>
      <details className="result-composer"><summary>Analyze another document</summary><section className="panel input-panel"><p className="eyebrow">YOUR OWN DOCUMENT</p><h2>Try local analysis</h2><p className="muted">Upload a photo, paste a screenshot with Ctrl/Cmd+V, or paste Chinese text. Live analysis uses your local API key.</p><textarea aria-label="Paste Chinese text" placeholder="Paste Chinese document text here…" value={draft} onChange={(event) => { setDraft(event.target.value); if (event.target.value) setImage(null); }} /><input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => void acceptFile(event.target.files?.[0])} /><div className="input-actions"><button className="button outline" onClick={() => fileRef.current?.click()}>Upload photo</button><button className="button outline" onClick={async () => { try { const items = await navigator.clipboard.read(); for (const item of items) { const type = item.types.find((t) => t.startsWith("image/")); if (type) { await acceptFile(new File([await item.getType(type)], "pasted-image.png", { type })); return; } } setMessage("No image in clipboard. Try Ctrl/Cmd+V."); } catch { setMessage("Use Ctrl/Cmd+V or Upload photo."); } }}>Paste image</button><button className="button primary" disabled={busy || (!draft.trim() && !image)} onClick={() => void analyze()}>{busy ? "Analyzing…" : "Analyze locally"}</button></div>{message && <p className="status" role="status">{message}</p>}<button className="fallback-link" onClick={() => showScenario(getScenario("contract"))}>Load instant Supply Contract fallback</button></section></details>
    </div><div className="right-column">{result ? <>
      <section className={`verdict verdict-${result.verdict.level}`}><div className="verdict-top"><span>DOCUMENT VERDICT</span><span>{scenario ? "SAVED DEMO RESULT" : "LOCAL ANALYSIS"}</span></div><strong>{verdictLabel}</strong><h2>{result.verdict.headline}</h2><p>{result.verdict.action}</p></section>
      <section className="panel conclusion"><p className="eyebrow">THE SHORT ANSWER</p><h2>{result.explanation}</h2></section>
      <section className="panel"><p className="eyebrow">KEY FACTS</p><div className="fact-grid">{Object.entries(result.keyFacts).filter(([, value]) => value).map(([key, value]) => <div key={key}><small>{key}</small><strong>{value}</strong></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">WHAT TO WATCH</p><h2>Risk flags</h2></div><span className="count">{result.risks.length}</span></div><div className="risk-list">{result.risks.map((risk) => <button key={risk.id} className={`risk-card ${selected === risk.id ? "selected" : ""}`} onClick={() => setSelected(risk.id)}><span className={`severity severity-${risk.level}`}>{risk.level}</span><strong>{risk.title}</strong><span className="risk-quote" lang="zh">“{risk.quote_zh}”</span><span>{risk.explanation}</span><span className="risk-fix">Do next: {risk.fix}</span><small>{scenario ? "SAVED DEMO RESULT" : risk.source === "rule" ? "RULE CHECKED" : "AI ESTIMATED"} · Click to locate quote</small></button>)}</div>{!result.risks.length && <p className="muted">No specific risk identified; this is not a guarantee of safety.</p>}</section>
      <section className="panel"><p className="eyebrow">WHAT IT SAYS</p><ul className="summary-list">{result.summary.slice(0, 5).map((line, index) => <li key={index}>{line}</li>)}</ul></section>
      <section className="panel" id="next-steps"><p className="eyebrow">WHAT TO DO NEXT</p><ol className="action-list">{result.actions.map((action, index) => <li key={action.id}><span>{index + 1}</span><div><strong>{action.label}</strong><p>{action.description}</p></div></li>)}</ol></section>
      <section className="panel reply" id="reply"><div className="panel-heading"><div><p className="eyebrow">READY TO SEND</p><h2>Reply in Chinese</h2></div><button className="button primary" onClick={() => void copyReply()}>{copied ? "Copied!" : "Copy reply"}</button></div><p lang="zh">{result.reply_zh || "No reply generated."}</p></section>
      <section className="panel company"><div className="panel-heading"><div><p className="eyebrow">COMPANY CHECK</p><h2>{scenario?.company.name || "Company not verified"}</h2></div><span className="tag">Demo data</span></div><strong>{scenario?.company.status || "Not available for live input"}</strong><p>{scenario?.company.note || "Mock integration. No official company registry is queried."}</p></section>
    </> : <div className="panel waiting"><span>{busy ? <span className="spinner large" aria-hidden="true" /> : "章"}</span><h2>{busy ? "Analyzing your document" : message ? "Analysis status" : "One document. A clearer decision."}</h2><p>{message || "Choose a sample scenario for an instant analysis. Every risk links to the Chinese source."}</p></div>}</div></section>
    </>}
    <footer>ChopCheck · Hackathon prototype · Sample documents and company information are Demo data. Not legal advice.</footer>
  </main>;
}
