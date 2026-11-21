# Documents locaux de démonstration

Ces cinq PNG sont des rendus des textes fictifs du dépôt. Ils ne sont pas
servis comme fichiers publics et ne sont pas intégrés à la galerie du site.
Pour les régénérer : `node scripts/create-demo-documents.cjs`.

Pour enregistrer la vidéo, activer **Demo Mode**, sélectionner **Screenshot**,
puis **Upload** et choisir `wechat-conversation-tristan-fictional.png`.
Le résultat est alors enregistré et affiché comme tel, sans appel réseau.

En mode normal, tout fichier passe par le moteur d'analyse réel, y compris
ces exemples. Une capture collée n'a pas de nom de fichier reconnaissable :
elle utilise aussi le moteur réel. Le mode démo reconnaît uniquement les
noms des cinq PNG fournis ; ne pas les renommer ni remplacer leur contenu.
