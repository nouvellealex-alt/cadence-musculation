"""Le choix de la variante dans un import est conservé après rechargement."""
import json
import os

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/"
cible = dict(id="dc", nom="Développé incliné à la Smith", series=2, reps=8,
             repsMax=10, repos=90, reposMax=120)
semaine = {
    "format": "cadence-semaine-v1",
    "semaine": {
        "objectif": "Objectif fictif",
        "jours": [{"nom": "Jour test", "exercices": [cible]}] +
                 [{"nom": "Repos", "exercices": []} for _ in range(6)]
    }
}
routine = {
    "format": "cadence-routine-v1",
    "routine": {"nom": "Routine test", "exercices": [cible]}
}

def fichier(source):
    return {"name": "cadence.json", "mimeType": "application/json",
            "buffer": json.dumps(source).encode()}

with sync_playwright() as p:
    browser = p.webkit.launch()
    page = browser.new_context(**p.devices["iPhone 13"]).new_page()
    page.goto(URL + "#semaine")
    page.get_by_role("button", name="Importer ma semaine").click()
    page.get_by_label("Fichier de semaine Cadence").set_input_files(fichier(semaine))
    page.get_by_role("button", name="Importer la semaine", exact=True).click()
    dialogue = page.get_by_role("dialog", name="Importer dans Ma semaine")
    select = dialogue.get_by_label("Développé incliné à la Smith")
    expect(select).to_have_value("")
    dialogue.get_by_role("button", name="Importer dans Ma semaine").click()
    expect(dialogue).to_be_visible()
    select.select_option("di-smith")
    dialogue.get_by_role("button", name="Importer dans Ma semaine").click()
    page.get_by_role("button", name="Lundi", exact=True).click()
    expect(page.get_by_role("heading", name="Développé incliné à la Smith")).to_be_visible()
    page.reload()
    page.get_by_role("button", name="Lundi", exact=True).click()
    expect(page.get_by_role("heading", name="Développé incliné à la Smith")).to_be_visible()

    page.goto(URL + "#routines")
    page.get_by_role("button", name="Importer une routine").click()
    page.get_by_label("Fichier de routine Cadence").set_input_files(fichier(routine))
    page.get_by_role("button", name="Importer", exact=True).click()
    dialogue = page.get_by_role("dialog", name="Vérifier les exercices importés")
    select = dialogue.get_by_label("Développé incliné à la Smith")
    expect(select).to_have_value("")
    select.select_option("di-smith")
    dialogue.get_by_role("button", name="Importer la routine").click()
    carte = page.locator("article").filter(has=page.get_by_role("heading", name="Routine test"))
    expect(carte).to_contain_text("Développé incliné à la Smith")
    print("Choix explicite et persistance vérifiés sur semaine et routine dans WebKit mobile.")
