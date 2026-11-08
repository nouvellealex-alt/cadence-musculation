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

Lancez aussi `python tests/import-mobile.py`, `python tests/poids-browser.py` et `python tests/carnet-salle.py` pour vérifier les imports, le suivi du poids, les photos locales et la reprise de 30 séries hors ligne. `python tests/reseau-lent.py` démarre son propre serveur et vérifie le repli sur le cache lorsque le serveur tarde à répondre.

