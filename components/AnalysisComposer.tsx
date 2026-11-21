"use client";

import { useRef } from "react";

export type InputMode = "photo" | "screenshot" | "text" | "company" | "demo";
export const modes: Array<{ id: InputMode; title: string; icon: string; description: string }> = [
  { id: "photo", title: "Document photo", icon: "▤", description: "Upload or drop a PNG, JPEG or WebP photo of a contract, invoice or notice. Analysis starts automatically." },
  { id: "screenshot", title: "Screenshot", icon: "▣", description: "Paste a screenshot with ⌘/Ctrl+V or upload an image. You can also try Tristan's fictional conversation below." },
  { id: "text", title: "Text paste", icon: "文", description: "Paste Chinese text, then select Analyze. We connect every risk to the original wording." },
  { id: "company", title: "Company check", icon: "⌕", description: "Explore a sample company check. Mock integration only; no official registry search is available." },
  { id: "demo", title: "Try a demo", icon: "▷", description: "Four complete, fictional scenarios. Instant results, no external calls. Pick a card below." },
];

type Props = {
  mode: InputMode; onMode: (mode: InputMode) => void;
  draft: string; onDraft: (text: string) => void;
  busy: boolean; message: string;
  onFile: (file?: File) => void; onSubmit: () => void; onPaste: () => void;
};

// Cette entrée unique réutilise les callbacks d'analyse existants de la page.
export default function AnalysisComposer(props: Props) {
  const file = useRef<HTMLInputElement>(null);
  const current = modes.find((mode) => mode.id === props.mode)!;
  const company = props.mode === "company";
  const demo = props.mode === "demo";
  return <section className="composer-area" aria-label="Start an analysis">
    <div className="mode-tabs" aria-label="Analysis mode">{modes.map((mode) => <button key={mode.id} aria-pressed={mode.id === props.mode} onClick={() => props.onMode(mode.id)}><span aria-hidden="true">{mode.icon}</span>{mode.title}</button>)}</div>
    <div className="composer" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); props.onFile(event.dataTransfer.files[0]); }}>
      <label htmlFor="document-entry" className="sr-only">Chinese document or company name</label>
      <textarea id="document-entry" value={props.draft} onChange={(event) => props.onDraft(event.target.value)} placeholder={company ? "Enter a Chinese company name to explore demo data…" : "Upload or paste a Chinese contract, invoice, WeChat message, or notice…"} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") props.onSubmit(); }} />
      <div className="composer-toolbar"><div className="composer-tools"><button className="button subtle" onClick={() => file.current?.click()} aria-label="Upload document photo">＋ <span>Upload</span></button><button className="button subtle" onClick={props.onPaste}>▣ <span>Paste</span></button><span className="composer-mode">{current.title}</span></div><button className="button primary" disabled={props.busy || (!company && !demo && !props.draft.trim())} onClick={props.onSubmit}>{props.busy ? "Analyzing…" : company ? "View demo check" : demo ? "Explore scenarios" : "Analyze"}</button></div>
      <input type="file" ref={file} hidden accept="image/png,image/jpeg,image/webp" onChange={(event) => { props.onFile(event.target.files?.[0]); event.target.value = ""; }} />
    </div>
    <p className="mode-description">{current.description}</p>
    {props.message && <p className="composer-message" role="status">{props.message}</p>}
    <p className="privacy-note">Your document stays out of the repository. Live analysis sends it to the configured AI provider.</p>
  </section>;
}
