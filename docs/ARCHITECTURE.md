# Architecture ChopCheck

## Pipeline d'analyse

```
[Photo / texte uploadé]
      │
      ▼
1. Lecture et extraction structurée      lib/analysis/extract.ts      (appel modèle)
   parties, montants, dates, comptes, numéros USCC, sceaux lus, clauses + citation exacte
      │
      ▼
2. Règles déterministes                  lib/analysis/deterministic.ts (code TypeScript)
   → risques avec source = "rule"        s'appuie sur lib/rules/
      │
      ▼
3. Analyse des clauses                   lib/analysis/clauses.ts      (appel modèle + ids d'articles autorisés)
   → risques avec source = "ai"
      │
      ▼
4. Agrégation                            lib/analysis/aggregate.ts
   verdict, faits clés, risques triés, actions
      │
      ▼
5. Génération                            lib/analysis/generate.ts
   explication (langue choisie) + message de réponse en chinois
      │
      ▼
[Rapport : document surligné + panneau des risques]
```

## Contrat front / back

Défini dans `lib/schema.ts` (types Zod). Résumé :

- `docType` : `contract` | `wechat` | `fapiao` | `notice` | `other`
- `verdict` : `level` (`high` | `medium` | `low`) + `headline`
- `keyFacts` : total, livraison, paiement, garantie
- `risks[]` : `level` (`critical` | `warning` | `note`), `quote_zh`, `source` (`rule` | `ai`), `legal_refs[]`
- `actions[]`, `reply_zh?`

## Règles de sécurité

1. **Citation vérifiée côté serveur** : chaque `quote_zh` doit être une sous-chaîne exacte du document, sinon le risque est rejeté ou corrigé.
2. **Pas d'article inventé** : le modèle ne peut citer que les ids présents dans `lib/legal/corpus.json` pour le type de document.
3. **Clé API côté serveur uniquement** (variable d'environnement).
4. **Pas de conservation ni d'entraînement** sur les documents utilisateurs (argument PIPL).

## Décisions techniques

- Next.js (App Router) + TypeScript + Tailwind CSS, déploiement Vercel.
- Pas de base de données au MVP : résultats de démo en JSON dans `lib/demo/results/`.
- Corpus juridique = un seul fichier JSON, sans base vectorielle.
- Validation des sorties du modèle avec Zod.
