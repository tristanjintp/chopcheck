"use client";

import { demoCards } from "../lib/demo/presentation";
import type { DemoScenario } from "../lib/demo/scenarios";

// Les cartes chargent les résultats locaux déjà disponibles dans le dépôt.
export default function DemoGallery({ onOpen }: { onOpen: (scenario: DemoScenario) => void }) {
  return <section className="demo-gallery" id="demo-scenarios" aria-label="Demo scenarios">
    <div className="gallery-heading"><div><p className="eyebrow">A FIRST WEEK DOING BUSINESS IN CHINA</p><h2>Try a demo scenario</h2></div><span>Fictional documents · instant results</span></div>
    <div className="demo-grid">{demoCards.map((card) => <article className="demo-card" key={card.scenario.id}>
      <div className="demo-card-body"><small>{card.type}</small><h3>{card.title}</h3><p>{card.description}</p><button className="button outline" onClick={() => onOpen(card.scenario)}>Open scenario<span className="sr-only">: {card.title}</span></button></div>
    </article>)}</div>
  </section>;
}
