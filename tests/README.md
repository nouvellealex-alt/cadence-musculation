# Tests Cadence

Depuis la racine du dépôt :

```sh
node --test tests/*.test.mjs
python -m pip install playwright
python -m playwright install chromium
python -m playwright install webkit
python -m http.server 8764 --bind 127.0.0.1 --directory dist
```

Dans un second terminal, lancez `python tests/parcours.py`, `python tests/journal-browser.py`, `python tests/planning-browser.py` et `python tests/semaine-browser.py`. Les tests ouvrent des contextes isolés et créent des carnets fictifs. Pour une autre instance, définissez la variable `CADENCE_TEST_URL` (ou `CADENCE_URL` pour le test de planning).

Lancez aussi `python tests/import-mobile.py`, `python tests/poids-browser.py` et `python tests/carnet-salle.py` pour vérifier les imports, le suivi du poids, les photos locales et la reprise de 30 séries hors ligne. `python tests/reseau-lent.py` et `python tests/mise-a-jour-browser.py` démarrent chacun un serveur isolé. Ils vérifient le chargement depuis le cache malgré un réseau lent et la cohérence des ressources avant et après l’activation d’une mise à jour.

`python tests/correspondances-browser.py` vérifie le choix d’une variante lors d’un import ambigu. `python tests/medias-browser.py` décode les médias via HTTP et vérifie que la fiche reste utile sans le pack hors ligne. `python tests/salle-remplacement-hors-ligne.py` couvre le parcours en émulation iPhone, du fichier de routine à la progression après un changement d’exercice.

`python tests/seance-integrite.py` vérifie la confirmation de suppression d’une série validée, la gestion d’un conflit entre onglets et le retour à un champ invalide. `python tests/restauration-atomique-browser.py` vérifie qu’une restauration refusée conserve le carnet courant et qu’une restauration réussie survit au rechargement.

