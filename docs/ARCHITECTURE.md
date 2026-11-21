# Architecture ChopCheck

Document de référence technique. Il décrit l'organisation du dépôt, le pipeline d'analyse, le contrat entre le front et le back, et les règles de sécurité.

## 1. Arborescence du dépôt

```
chopcheck/
├── app/                        Interface et endpoint (Next.js App Router)
│   ├── page.tsx                Page principale : zone document + panneau de verdict et risques
│   ├── layout.tsx              Coque HTML commune
│   ├── globals.css             Styles globaux, couleurs de risque, thème sombre
│   └── api/analyze/
│       └── route.ts            POST /api/analyze : point d'entrée de l'analyse
├── components/                 Composants React d'affichage (aucune règle métier)
│   ├── Header.tsx              En-tête, persona « Tom », sélecteur de langue
│   ├── DocumentTabs.tsx        Onglets des 4 documents d'exemple + « Your own document »
│   ├── DocumentViewer.tsx      Document sur fond clair, passages à risque surlignés
│   ├── VerdictBanner.tsx       Niveau, type, phrase d'action, vendeur
│   ├── KeyFacts.tsx            Total, livraison, paiement, garantie
│   ├── SummaryList.tsx         « What it says » : 3 à 5 puces
│   ├── RiskCard.tsx            Carte de risque : citation, explication, bloc « Fix »
│   ├── RiskBadge.tsx           Badge « Rule-checked » ou « AI-estimated »
│   ├── ReplyButton.tsx         Affiche le message chinois prêt à copier dans WeChat
│   ├── UploadPanel.tsx         Zone « Your own document » (photo ou texte)
│   └── Disclaimer.tsx          Avertissement : aide à la détection, pas un avis juridique
├── lib/                        Logique métier, sans React, testable seule
│   ├── schema.ts               Contrat Analysis (types Zod), partagé par toutes les pistes
│   ├── prompts.ts              Textes envoyés au modèle Claude
│   ├── analysis/               Pipeline en 5 étapes (voir section 2)
│   │   ├── extract.ts
│   │   ├── deterministic.ts
│   │   ├── clauses.ts
│   │   ├── aggregate.ts
│   │   └── generate.ts
│   ├── rules/                  Règles déterministes, en code (voir section 4)
│   │   ├── uscc.ts
│   │   ├── fapiao.ts
│   │   ├── chop.ts
│   │   └── threeFlows.ts
│   ├── legal/
│   │   └── corpus.json         Articles de loi autorisés (30 à 40, vérifiés à la main)
│   └── demo/                   Données de démo, versionnées
│       ├── documents/          4 documents fictifs marqués « 示例 SAMPLE »
│       └── results/            Un résultat Analysis écrit à la main par document
├── tests/
│   ├── rules/                  Tests unitaires des règles, sans réseau
│   └── eval/                   Jeu d'évaluation : l'analyse en direct retrouve-t-elle les risques attendus ?
├── docs/
│   └── ARCHITECTURE.md         Ce document
├── README.md                   Démarrage, répartition du travail, règles d'équipe
├── .gitignore                  Exclut node_modules, .next, .env*, .DS_Store
├── .env.example                Modèle de configuration, sans clé réelle
└── test.py                     Fichier d'un coéquipier, hors projet (à supprimer ou déplacer)
```

### Les trois couches

Le code est découpé en couches qui ne remontent jamais :

| Couche | Dossiers | Rôle | Peut dépendre de |
|---|---|---|---|
| Présentation | `app/`, `components/` | Afficher et déclencher | `lib/schema.ts`, `lib/demo/`, `app/api/` |
| Logique métier | `lib/` (hors `demo/`) | Analyser, appliquer les règles | `lib/schema.ts`, `lib/legal/`, `lib/rules/` |
| Données et tests | `lib/demo/`, `lib/legal/`, `tests/` | Fichiers statiques et vérifications | `lib/schema.ts` |

Conséquence : `lib/` ne sait rien de React, et `components/` ne contient aucune règle.

### Dépendances entre fichiers

```
components/*  ───────────►  lib/schema.ts  ◄──────────  lib/analysis/*
     │                                                      │
     │                                                      ├──► lib/rules/*
     ▼                                                      ├──► lib/prompts.ts
lib/demo/results/  ◄──── tests/eval/                        └──► lib/legal/corpus.json
     ▲
     │
app/page.tsx ──► components/* + lib/demo/documents/

app/api/analyze/route.ts ──► lib/analysis/* ──► (sortie validée par lib/schema.ts)
```

## 2. Pipeline d'analyse

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
   fusion, tri, verdict, faits clés, actions
      │
      ▼
5. Génération                            lib/analysis/generate.ts     (appel modèle)
   explication (langue choisie) + message de réponse en chinois
      │
      ▼
[Rapport : document surligné + panneau des risques]
```

| Étape | Appel modèle | Entrée | Sortie |
|---|---|---|---|
| 1. Extraction | Oui | Image ou texte | Données structurées, citations exactes |
| 2. Règles | Non | Données extraites | Risques `source = "rule"` |
| 3. Clauses | Oui | Clauses + ids d'articles autorisés | Risques `source = "ai"` |
| 4. Agrégation | Non | Tous les risques | `Analysis` complet, sans réponse |
| 5. Génération | Oui | `Analysis` + langue choisie | Explications et `reply_zh` |

Les garde-fous s'appliquent après les étapes 1, 3 et 5 : vérification des citations et validation Zod.

## 3. Contrat front / back

Défini dans `lib/schema.ts` (types Zod). Résumé :

- `docType` : `contract` | `wechat` | `fapiao` | `notice` | `other`
- `verdict` : `level` (`high` | `medium` | `low`) + `headline`
- `keyFacts` : total, livraison, paiement, garantie
- `risks[]` : `level` (`critical` | `warning` | `note`), `title`, `quote_zh`, `explanation`, `fix`, `source` (`rule` | `ai`), `legal_refs[]`
- `actions[]`, `reply_zh?`

Toute modification de ce fichier touche les quatre pistes : elle se discute avant d'être poussée.

## 4. Règles déterministes

Code TypeScript pur, sans appel réseau ni modèle. Ce sont les vérifications dont le résultat est certain.

| Fichier | Vérifie |
|---|---|
| `uscc.ts` | Code d'identification unifié : 18 caractères, dernier caractère = chiffre de contrôle (GB 32100-2015) |
| `fapiao.ts` | Format du numéro (20 chiffres pour l'électronique), HT + TVA = TTC, montant en lettres = en chiffres |
| `chop.ts` | Le nom gravé sur le sceau est identique à celui de la partie contractante |
| `threeFlows.ts` | Contrat, paiement et facture désignent la même entité (étape suivante du MVP) |

Un compte bancaire au nom d'une personne physique (et non d'une entreprise) est également détecté par une règle.

## 5. Corpus juridique

`lib/legal/corpus.json` : un tableau d'articles au format `{ id, law, article, text_zh, summary_en }`.

- Le modèle reçoit la liste des ids autorisés pour le type de document et ne peut citer que ceux-là.
- Un risque sans base légale est affiché sans citation : on n'invente jamais un article.
- Chaque article est vérifié à la main contre le texte officiel avant d'entrer dans le fichier.
- Le fichier est actuellement vide (`[]`).

## 6. Données de démo et tests

- `lib/demo/documents/` : contrat d'achat, conversation WeChat, fapiao, avis de l'autorité de régulation, tous fictifs.
- `lib/demo/results/` : un `Analysis` par document, écrit à la main. Affiché avec le libellé « SAVED DEMO RESULT ».
- `tests/rules/` : un test par règle, sans réseau.
- `tests/eval/` : pour chaque document, vérifie que l'analyse en direct retrouve les risques du résultat enregistré.

## 7. Règles de sécurité

1. **Citation vérifiée côté serveur** : chaque `quote_zh` doit être une sous-chaîne exacte du document, sinon le risque est rejeté ou corrigé. Sans cela, le surlignage casse et les citations ne sont plus fiables.
2. **Pas d'article inventé** : le modèle ne cite que les ids de `lib/legal/corpus.json`.
3. **Clé API côté serveur uniquement** : lue depuis `.env.local` dans `app/api/analyze/route.ts`, jamais envoyée au navigateur.
4. **Pas de conservation ni d'entraînement** sur les documents utilisateurs (argument PIPL).
5. **Données fictives étiquetées** : toute société, donnée de registre et document de démo porte « SAMPLE » ou « 示例 ».

## 8. Décisions techniques

- Next.js (App Router) + TypeScript + Tailwind CSS, déploiement sur Vercel.
- Une seule application : les routes API sont dans le même projet que l'interface.
- Pas de base de données au MVP. Les résultats de démo sont des fichiers JSON versionnés.
- Corpus juridique en un seul fichier JSON, sans base vectorielle.
- Validation des sorties du modèle avec Zod, types partagés entre front et back.
- Variables d'environnement : `ANTHROPIC_API_KEY` (secret), `ANTHROPIC_MODEL` (modèle utilisé, défaut `claude-sonnet-5-5`).

## 9. État actuel

Le squelette est en place, mais rien ne s'exécute encore :

- Pas de `package.json` ni de `tsconfig.json` : Next.js reste à initialiser.
- Les fichiers de code ne contiennent que des commentaires décrivant leur rôle.
- Le corpus juridique est vide.
- Les données de démo ne sont pas encore rédigées.
