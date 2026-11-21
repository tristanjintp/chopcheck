# Démonstration et vidéo ChopCheck

## Lancement

Dans le dossier chopcheck : `npm run dev`, puis ouvrir http://localhost:3000.
Pour filmer la version de production : arrêter le serveur dev, lancer
`npm run build` puis `npm run start`. Ne jamais exécuter dev et build en parallèle.

Les images ne sont pas embarquées sur le site. Les cinq fichiers fictifs se
trouvent dans `demo-documents/`. Les raccourcis de scénario restent un secours
immédiat. Pour régénérer les PNG : `node scripts/create-demo-documents.cjs`.

## Parcours vidéo de 60 à 90 secondes

1. Accueil — présenter « Chinese documents. Clear decisions. » (0–10 s).
2. Activer **Demo Mode**. Il ouvre un état propre (10–15 s).
3. Choisir **Screenshot**, puis **Upload**.
4. Sélectionner `demo-documents/wechat-conversation-tristan-fictional.png`.
5. Le résultat enregistré **HIGH RISK** apparaît immédiatement (15–30 s).
6. Cliquer **Payment to a personal account** : le texte chinois exact se surligne (30–45 s).
7. Montrer l'explication en anglais, puis **Next steps** (45–55 s).
8. Cliquer **Reply**, puis **Copy reply** et montrer « Copied! » (55–65 s).
9. Montrer **Company check · Demo data**, puis **Try another scenario** (65–75 s).
10. Conclure : « ChopCheck turns unfamiliar Chinese documents into a clear next move. »

L'upload en Demo Mode est une simulation explicite : le nom du PNG fourni
sélectionne le résultat enregistré, marqué **Demo / Fictional · saved analysis**.
Ne pas renommer ni modifier ces fichiers pour ce parcours.
Un upload normal et une capture collée utilisent le moteur réel et la clé locale.
Les documents de démo ne sont jamais présentés comme une vérification officielle.

## Démo de 3 minutes

- 0:00–0:30 : accueil, modes, upload de Tristan en Demo Mode.
- 0:30–1:15 : compte personnel, citation exacte et formulation indirecte.
- 1:15–1:45 : actions séquencées et copie de la réponse chinoise.
- 1:45–2:15 : Supply Contract, sceau d'une autre société.
- 2:15–2:40 : Fapiao, vendeur différent et calcul erroné.
- 2:40–3:00 : Government Notice, date limite, puis retour à l'accueil.

## Fallbacks et contrôle avant envoi

Les quatre cartes de l'accueil et les boutons de changement de scénario dans
les résultats sont instantanés. Le scénario WeChat de l'accueil est celui de
Tristan. **Original WeChat** conserve l'ancien scénario. **New analysis** ou
le logo retourne à l'accueil ; Demo Mode reste actif jusqu'à désactivation.

Rejouer trois fois : accueil → Screenshot → Upload du PNG Tristan → risque
du compte personnel → citation → Next steps → Copy reply → autre scénario.
Contrôler que l'image est lisible, la citation est exacte, « Copied! » apparaît,
et qu'aucun secret ni terminal sensible n'est visible.

Contrôles automatisés : intégrité des cinq PNG, résultats complets, citations
exactes, séparation mode réel/démo et trois répétitions des données du parcours.
Les tests de données ne remplacent pas les trois répétitions visuelles.
