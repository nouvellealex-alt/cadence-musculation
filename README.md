# Cadence

Cadence est un carnet de musculation en français, gratuit et sans compte. Les données restent dans le navigateur, via IndexedDB. Le site ne requiert ni serveur de comptes, ni clé, ni service payant.

## Démarrer

Dans ce dossier, avec Python 3 installé :

```sh
python -m http.server 8764 --bind 127.0.0.1 --directory dist
```

Ouvrez http://127.0.0.1:8764/. Pour auto-héberger le site, servez le contenu de `dist/` en HTTPS. Gardez le même navigateur et la même origine (protocole, hôte et port) pour retrouver votre carnet. Un sous-dossier partage le stockage de son origine. Pour isoler une instance, hébergez-la sur sa propre origine. Pour changer d’adresse ou d’appareil, exportez les données de l’ancienne instance puis importez le fichier dans la nouvelle.

## Parcours

- Préparez une routine, planifiez une séance ou démarrez librement. Cadence sauvegarde le brouillon pendant l’entraînement.
- Recherchez un exercice par nom, muscle, lieu ou matériel. Gardez vos favoris et consultez les démonstrations depuis la séance.
- Utilisez le calendrier pour distinguer séances prévues et réalisées. Les programmes proposent plusieurs semaines que vous pouvez ajuster.
- Consultez l’historique et la progression par exercice. Le tonnage cumule les séries en mode **Charge**. Le poids du corps, le lest, l’assistance, la durée et la distance ont leurs propres indicateurs.
- Dans **Données**, exportez le carnet ou téléchargez les médias disponibles de votre semaine ou du catalogue complet. Vous pouvez aussi garder une seule démonstration hors ligne depuis sa fiche. En séance, **Lire la vidéo** lance directement le mouvement quand il existe. Les vidéos se lisent en boucle avec trois vitesses. Pour une sauvegarde chiffrée, conservez le fichier et son code séparément. La restauration demande les deux.
- Les routines s’échangent par fichier, avec les fiches personnelles qu’elles utilisent. L’import protège les fiches du destinataire et adapte les identifiants en cas de conflit.

## Ma semaine

Dans **Ma semaine**, créez une semaine vide ou importez un fichier de semaine Cadence. Choisissez les exercices, les fourchettes de répétitions et de repos pour chaque jour. La semaine type reste dans le navigateur et est incluse dans la sauvegarde du carnet. En séance guidée, Cadence affiche un exercice à la fois, garde le repos visible et reprend sur l’exercice consulté après fermeture. La série précédente se reprend en un geste.

Sur iPhone, ouvrez Cadence dans Safari, utilisez **Partager → Sur l’écran d’accueil** et activez **Ouvrir comme app web** si l’option apparaît. Ouvrez ensuite Cadence depuis son icône. Restaurez le carnet dans l’app installée depuis **Plus → Données** si votre historique est stocké dans un autre navigateur ou appareil.

Dans **Plus → Poids**, enregistrez une pesée par date et consultez la moyenne des pesées sur les sept derniers jours calendaires. La pesée est incluse dans la sauvegarde du carnet.

Dans **Exercices → Ma machine**, créez une fiche locale avec un étage ou une zone et une photo facultative. La photo est redimensionnée dans le navigateur et reste exclue des fichiers de routine. Dans **Données**, choisissez explicitement **Inclure les photos** si vous souhaitez les transférer dans une sauvegarde complète.

Si un poste est occupé, **Machine indisponible** propose des mouvements proches avec le matériel restant. Choisissez le poste concerné si l’exercice utilise plusieurs équipements. La recherche manuelle depuis cette fenêtre respecte aussi cette exclusion. Le remplacement vaut pour la séance en cours, conserve les séries déjà validées et laisse la nouvelle charge à saisir. Sur les appareils compatibles, **Écran allumé** évite la mise en veille pendant la séance guidée.

## Organisation du projet

- `dist/app.js` et `dist/style.css` portent l’interface.
- `dist/donnees.js` vérifie les sauvegardes, chiffre les exports et gère IndexedDB.
- `dist/journal.js` définit les mesures et calculs des séries. `dist/planning.js` gère le calendrier, les programmes et le partage de routines.
- `dist/semaine.js` valide les semaines importées et gère l’interface personnelle. `dist/alternatives.js` classe les substitutions et écarte le matériel signalé.
- `dist/exercices.js`, `dist/mouvements.js` et `dist/medias.js` portent le catalogue, les schémas et le registre des médias.
- `dist/sw.js` installe ensemble les ressources d’une version et sert ce même lot jusqu’à la fermeture des onglets et de l’app installée. Changez le numéro de cache à chaque mise à jour des ressources applicatives. Donnez un nouveau nom à tout fichier média dont le contenu change pour éviter de resservir une ancienne démonstration téléchargée.

## Vérification

Avec Node.js récent : `node --test tests/*.test.mjs`. Les tests d’interface utilisent Chromium via Playwright. Voir les instructions dans `tests/README.md`.

## Licences et contributions

Le code et les contenus originaux de Cadence sont sous **AGPL-3.0-only**, voir [LICENSE](LICENSE). Les médias tiers conservent leur licence, détaillée dans [CREDITS-MEDIAS.md](CREDITS-MEDIAS.md) et sur les fiches. Voir [CONTRIBUER.md](CONTRIBUER.md).

