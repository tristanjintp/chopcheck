# ChopCheck

Comprendre n'importe quel document commercial chinois en quelques secondes : ce qu'il dit, ce qui est risqué, quoi faire ensuite.

Projet de hackathon « business in China » (Télécom Paris). Application web Next.js + TypeScript + Tailwind.

## Démarrer

Le contexte complet du projet est dans `contexte.md` (à ajouter au dépôt par l'équipe). L'architecture détaillée est dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

1. Copier `.env.example` en `.env.local` et renseigner `ANTHROPIC_API_KEY` (ne jamais committer ce fichier).
2. Installer les dépendances et lancer le projet une fois le squelette Next.js initialisé (`npx create-next-app` à faire par la personne qui s'occupe de l'interface, voir la répartition ci-dessous).

## Structure du dépôt

| Dossier / fichier | Rôle |
|---|---|
| `app/` | Pages et routes Next.js. `app/page.tsx` = interface principale, `app/api/analyze/route.ts` = endpoint d'analyse. |
| `components/` | Composants React d'affichage (zone document, carte de risque, bandeau de verdict…). |
| `lib/schema.ts` | Types Zod partagés front / back (contrat `Analysis`). **À ne modifier qu'en concertation.** |
| `lib/prompts.ts` | Prompts envoyés au modèle Claude. |
| `lib/analysis/` | Pipeline d'analyse en 5 étapes (extraction, règles, clauses, agrégation, génération). |
| `lib/rules/` | Règles déterministes en TypeScript : USCC, fapiao, sceau, cohérence « trois flux ». |
| `lib/legal/corpus.json` | Corpus juridique curé (30 à 40 articles vérifiés à la main). |
| `lib/demo/` | 4 documents d'exemple (`documents/`) et leurs résultats enregistrés (`results/`). |
| `tests/` | Tests unitaires des règles (`rules/`) et jeu d'évaluation (`eval/`). |
| `docs/ARCHITECTURE.md` | Pipeline, format de sortie, décisions techniques. |
| `test.py` | Fichier existant d'un coéquipier, sans lien avec l'application : à supprimer ou à déplacer quand l'équipe l'aura décidé. |

## Répartition du travail (4 pistes indépendantes)

Chaque piste travaille dans ses propres fichiers pour limiter les conflits Git.

| Piste | Fichiers principaux | Dépend de |
|---|---|---|
| **A. Interface** | `app/`, `components/` | `lib/schema.ts` (types) et `lib/demo/` (données de démo) |
| **B. Règles déterministes** | `lib/rules/`, `tests/rules/` | `lib/schema.ts` |
| **C. Corpus juridique et analyse IA** | `lib/legal/`, `lib/prompts.ts`, `lib/analysis/`, `tests/eval/` | `lib/schema.ts` |
| **D. Démo et pitch** | `lib/demo/`, `docs/` | `lib/schema.ts` |

Règle commune : **`lib/schema.ts` est le contrat entre les pistes**. Toute modification se discute avant d'être poussée, car elle touche tout le monde.

## Règles de l'équipe

- Un document d'exemple ou un article de loi n'entre dans le dépôt qu'après vérification (articles : contre le texte officiel).
- Aucune clé API dans le code ni dans le dépôt. Les clés restent dans `.env.local`, côté serveur uniquement.
- Aucun document utilisateur n'est stocké. Pas de base de données pour le MVP.
- Toute donnée fictive (sociétés, registre, documents) est marquée « SAMPLE » / « 示例 ».
- Commits en petits lots, une piste par branche : `piste-interface`, `piste-regles`, `piste-corpus`, `piste-demo`.
