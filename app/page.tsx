// Page de démarrage minimale en attendant l'interface complète.
export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm uppercase tracking-widest text-orange-300">ChopCheck</p>
        <h1 className="text-4xl font-bold">Comprendre un document commercial chinois</h1>
        <p className="mt-4 text-slate-300">
          Importez un document ou collez son texte pour détecter les risques.
        </p>
      </section>
    </main>
  );
}
