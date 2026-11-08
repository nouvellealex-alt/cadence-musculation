"""Vérifie la semaine locale et les remplacements dans un navigateur vierge."""
import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/"

def cible(id, reps, max_reps, repos):
    return dict(id=id, series=2, reps=reps, repsMax=max_reps, repos=repos, reposMax=repos)

semaine = {
    "format": "cadence-semaine-v1",
    "semaine": {
        "active": True,
        "objectif": "Objectif fictif de test",
        "jours": [
            {"nom":"Départ test", "exercices":[cible("di",8,12,120)]},
            {"nom":"Repos", "exercices":[]},
            {"nom":"Jambes de test", "exercices":[cible("pre",10,15,120)]},
            {"nom":"Repos", "exercices":[]},
            {"nom":"Repos", "exercices":[]},
            {"nom":"Repos", "exercices":[]},
            {"nom":"Abdos de test", "exercices":[cible("cr-poulie",10,15,60)]}
        ]
    }
}
payload = Path(os.environ["CADENCE_TEST_SEMAINE"]).read_bytes() if os.environ.get("CADENCE_TEST_SEMAINE") else json.dumps(semaine).encode()
routine = json.loads(payload)["semaine"]

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width":360,"height":780}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.set_default_timeout(15000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL+"#semaine")
    page.get_by_role("button",name="Importer ma semaine").click()
    page.get_by_label("Fichier de semaine Cadence").set_input_files({"name":"semaine.json","mimeType":"application/json","buffer":payload})
    page.get_by_role("button",name="Importer la semaine",exact=True).click()
    expect(page.get_by_role("button",name="Lundi",exact=True)).to_be_visible()
    page.get_by_role("button",name="Mercredi",exact=True).click()
    expect(page.get_by_role("heading",name=routine["jours"][2]["nom"],exact=True)).to_be_visible()
    page.get_by_text("Organiser ma semaine",exact=True).click()
    page.get_by_role("button",name="Passer ce jour en repos").click()
    page.get_by_role("button",name="Confirmer le repos").click()
    expect(page.get_by_role("heading",name="Repos",exact=True)).to_be_visible()
    page.get_by_role("button",name="Lundi",exact=True).click()
    page.get_by_role("button",name="Démarrer la séance",exact=True).click()
    expect(page.locator("#guide-etape")).to_contain_text("Développé incliné")
    expect(page.locator("#chrono")).to_have_count(0)
    premier = page.locator(".journal-exercice").first
    expect(premier.locator(".journal-cible")).to_contain_text("8–12")
    premier.get_by_label("Charge de la série 1").fill("42")
    premier.get_by_role("button",name="Valider la série 1").click()
    expect(premier.locator(".done")).to_have_count(1)
    page.reload()
    expect(page.locator(".journal-exercice").first.locator(".done")).to_have_count(1)
    expect(page.locator(".journal-exercice").first.get_by_label("Charge de la série 1")).to_have_value("42")
    page.get_by_role("button",name="Terminer et enregistrer").click()
    expect(page.get_by_role("heading",name="Progression",exact=True)).to_be_visible()
    page.get_by_role("link",name="Ma semaine",exact=True).click()
    page.get_by_role("button",name="Dimanche",exact=True).click()
    page.get_by_role("button",name="Démarrer la séance",exact=True).click()
    cr = page.locator(".journal-exercice").first
    cr.get_by_label("Charge de la série 1").fill("20")
    cr.get_by_role("button",name="Valider la série 1").click()
    cr.get_by_role("button",name="Machine indisponible").click()
    page.get_by_role("button",name="Choisir Enroulement du buste",exact=True).click()
    expect(page.locator(".journal-exercice").first.locator(".done")).to_have_count(1)
    expect(page.locator(".journal-exercice").nth(1).get_by_role("heading",name="Enroulement du buste")).to_be_visible()
    expect(page.locator(".journal-exercice").nth(1).get_by_label("Charge de la série 1")).to_have_count(0)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert not errors, errors
    print("Semaine privée, repos éditable, guide, reprise de brouillon et remplacement avec préservation de la série validée : OK.")
