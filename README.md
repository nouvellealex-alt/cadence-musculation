# Cadence

Cadence est un carnet de musculation en français, gratuit et sans compte. Les données restent dans le navigateur, via IndexedDB. Le site ne requiert ni serveur de comptes, ni clé, ni service payant.

## Démarrer

Dans ce dossier, avec Python 3 installé :

```sh
python -m http.server 8764 --bind 127.0.0.1 --directory dist
```

Ouvrez http://127.0.0.1:8764/. Pour auto-héberger le site, servez le contenu de `dist/` en HTTPS. Gardez le même navigateur et la même adresse pour retrouver votre carnet. Pour changer d’adresse ou d’appareil, exportez les données de l’ancienne instance puis importez le fichier dans la nouvelle.

## Parcours

- Préparez une routine, planifiez une séance ou démarrez librement. Cadence sauvegarde le brouillon pendant l’entraînement.
- Recherchez un exercice par nom, muscle, lieu ou matériel. Gardez vos favoris et consultez les démonstrations depuis la séance.
- Utilisez le calendrier pour distinguer séances prévues et réalisées. Les programmes proposent plusieurs semaines que vous pouvez ajuster.
- Consultez l’historique et la progression par exercice. Le tonnage cumule les séries en mode **Charge**. Le poids du corps, le lest, l’assistance, la durée et la distance ont leurs propres indicateurs.
- Dans **Données**, exportez le carnet ou téléchargez le pack de démonstrations pour le consulter hors ligne. Pour une sauvegarde chiffrée, conservez le fichier et son code séparément. La restauration demande les deux.
- Les routines s’échangent par fichier, avec les fiches personnelles qu’elles utilisent. L’import protège les fiches du destinataire et adapte les identifiants en cas de conflit.

## Organisation du projet

- `dist/app.js` et `dist/style.css` portent l’interface.
- `dist/donnees.js` vérifie les sauvegardes, chiffre les exports et gère IndexedDB.
- `dist/journal.js` définit les mesures et calculs des séries. `dist/planning.js` gère le calendrier, les programmes et le partage de routines.
- `dist/exercices.js`, `dist/mouvements.js` et `dist/medias.js` portent le catalogue, les schémas et le registre des médias.
- `dist/sw.js` installe les ressources locales du site. Changez le numéro de cache à chaque mise à jour des ressources applicatives.

## Vérification

Avec Node.js récent : `node --test tests/*.test.mjs`. Les tests d’interface utilisent Chromium via Playwright. Voir les instructions dans `tests/README.md`.

## Licences et contributions

Le code et les contenus originaux de Cadence sont sous **AGPL-3.0-only**, voir [LICENSE](LICENSE). Les médias tiers conservent leur licence, détaillée dans [CREDITS-MEDIAS.md](CREDITS-MEDIAS.md) et sur les fiches. Voir [CONTRIBUER.md](CONTRIBUER.md).

