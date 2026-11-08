# Tests Cadence

Depuis la racine du dépôt :

```sh
node --test tests/*.test.mjs
python -m pip install playwright
python -m playwright install chromium
python -m http.server 8764 --bind 127.0.0.1 --directory dist
```

Dans un second terminal, lancez `python tests/parcours.py`, `python tests/journal-browser.py` et `python tests/planning-browser.py`. Les tests ouvrent des contextes isolés et créent des carnets fictifs. Pour une autre instance, définissez la variable `CADENCE_TEST_URL` (ou `CADENCE_URL` pour le test de planning).

