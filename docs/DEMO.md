# ChopCheck — démo et vidéo

## Préparation locale

1. Dans `chopcheck`, lancer `npm install`, puis `npm run dev`.
2. Ouvrir `http://localhost:3000` et mettre le navigateur en plein écran.
3. Vérifier qu'aucun secret, terminal ou fichier `.env.local` n'est visible dans la capture.
4. Cliquer sur **Reset Demo** avant chaque prise. Les scénarios n'utilisent aucun service externe.

Pour vérifier le build de production, arrêter `npm run dev` avant de lancer
`npm run build` puis `npm run start`. Les deux serveurs écrivent dans `.next`
et ne doivent pas tourner en parallèle pendant la vérification.

## Démo de 3 minutes

- 0:00–0:25 — Présenter Tom et cliquer **Start Demo**.
- 0:25–1:15 — Montrer **HIGH RISK**, cliquer le risque du sceau, lire la citation chinoise surlignée et l'explication anglaise.
- 1:15–1:45 — Montrer les actions séquencées, cliquer **Copy reply**, puis le **Company check · Demo data**.
- 1:45–2:10 — Cliquer **WeChat Chat** et expliquer « 原则上问题不大 ».
- 2:10–2:40 — Cliquer **Fapiao** et rapprocher le vendeur, le compte et le calcul de taxe ; puis **Government Notice** et sa date limite.
- 2:40–3:00 — Conclure sur le passage document → risque exact → action. Cliquer **Reset Demo**.

## Vidéo de 60 à 90 secondes : ordre des clics

1. **Reset Demo**, puis démarrer l'enregistrement sur l'écran d'accueil.
2. Montrer le titre et cliquer **Start Demo**.
3. Montrer **HIGH RISK** et la conclusion.
4. Cliquer **Seal belongs to another company** ; montrer le surlignage exact du chinois.
5. Lire brièvement l'explication en anglais et les trois actions.
6. Descendre à **Reply in Chinese**, cliquer **Copy reply** et montrer « Copied! ».
7. Montrer **Company check · Demo data**.
8. Cliquer **WeChat Chat** et montrer la phrase « 原则上问题不大 ».
9. Conclusion : “ChopCheck turns unfamiliar Chinese documents into a clear next move.”

## Fallbacks et vérification

Chaque tuile de scénario est un fallback instantané. Si l'analyse d'une photo
ou d'un texte échoue, cliquer directement la tuile voulue ou **Load instant
Supply Contract fallback**. Il n'y a aucun appel externe dans le parcours vidéo.

Avant l'envoi, rejouer trois fois depuis **Reset Demo** : Start Demo → risque
du sceau → citation → actions → Copy reply → Company check → WeChat Chat.
Contrôler la lisibilité, l'absence d'écran blanc, le bouton « Copied! » et
l'absence de secret à l'écran. Ne pas présenter les données fictives comme des
résultats de registre officiel.
