"""Test de parcours, de restauration v1 et de téléchargement hors ligne."""
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/"
ANCIEN_CARNET = {
    "schema": 1, "profil": "test-migration", "theme": "sombre", "repos": 90,
    "actif": None, "routines": [], "persos": [],
    "seances": [{
        "id": "test-seance", "nom": "Séance héritée", "debut": 1735689600000,
        "fin": 1735690200000, "notes": "Import de test",
        "exercices": [{
            "id": "dc", "nom": "Développé couché", "muscle": "Pectoraux",
            "materiel": "Barre", "conseil": "",
            "series": [{"kg": 60, "reps": 8, "type": "Travail", "faite": True}]
        }]
    }]
}


def ouvrir_depuis_plus(page, nom):
    page.locator("nav .nav-plus > summary").click()
    page.get_by_role("link", name=nom, exact=True).click()


with sync_playwright() as p, TemporaryDirectory() as tmp:
    browser = p.chromium.launch()
    desktop = browser.new_context()
    page = desktop.new_page()
    page.set_default_timeout(12000)
    erreurs = []
    page.on("pageerror", lambda error: erreurs.append(str(error)))
    page.goto(URL + "#exercices")
    expect(page.get_by_role("heading", name="Exercices", exact=True)).to_be_visible()
    page.get_by_label("Rechercher", exact=True).fill("developpe couche")
    card = page.locator("#cartes article").filter(has=page.get_by_role("heading", name="Développé couché", exact=True))
    expect(card).to_be_visible()
    card.get_by_role("button", name="Ajouter aux favoris").click()
    page.reload()
    page.get_by_label("Collection").select_option("favoris")
    expect(page.locator("#cartes article")).to_have_count(1)
    page.get_by_role("button", name="Voir la fiche").click()
    video = page.locator("dialog video")
    expect(video).to_be_visible()
    video.evaluate("el => el.preload = 'metadata'")
    page.wait_for_function("document.querySelector('dialog video').readyState >= 1")
    expect(page.locator("dialog a").first).to_be_visible()
    page.get_by_role("button", name="Fermer", exact=True).click()
    ouvrir_depuis_plus(page, "Données")
    ancien = Path(tmp) / "ancien.json"
    ancien.write_text(json.dumps(ANCIEN_CARNET), encoding="utf-8")
    page.get_by_role("button", name="Restaurer un fichier").click()
    page.get_by_label("Fichier de sauvegarde").set_input_files(ancien)
    page.get_by_role("button", name="Vérifier le fichier").click()
    page.get_by_role("button", name="Confirmer", exact=True).click()
    expect(page.get_by_role("status").filter(has_text="Carnet restauré")).to_be_visible()
    page.get_by_role("link", name="Progression", exact=True).click()
    page.locator("#periode").select_option("tout")
    expect(page.get_by_text("480 kg", exact=True).first).to_be_visible()
    ouvrir_depuis_plus(page, "Planning")
    expect(page.get_by_role("heading", name="Planning", exact=True)).to_be_visible()
    ouvrir_depuis_plus(page, "Données")
    page.wait_for_function("navigator.serviceWorker.ready.then(() => true)")
    page.reload()
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    page.get_by_role("button", name="Télécharger les démonstrations").click()
    expect(page.locator("#message")).to_have_text("Démonstrations prêtes hors ligne.", timeout=60000)
    desktop.set_offline(True)
    page.goto(URL + "#exercices")
    page.get_by_label("Rechercher", exact=True).fill("developpe couche")
    card.get_by_role("button", name="Voir la fiche").click()
    video.evaluate("el => el.preload = 'metadata'")
    page.wait_for_function("document.querySelector('dialog video').readyState >= 1")
    assert not erreurs, erreurs
    mobile = browser.new_context(viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True)
    phone = mobile.new_page()
    phone.goto(URL)
    expect(phone.get_by_role("heading", name="Tableau de bord")).to_be_visible()
    for route in ["#exercices", "#planning", "#routines", "#stats"]:
        phone.goto(URL + route)
        expect(phone.locator("h1")).to_be_visible()
        assert phone.evaluate("document.documentElement.scrollWidth <= innerWidth"), route
    print("OK : recherche, favoris persistants, vidéo avec crédits, carnet v1, pack et vidéo hors ligne, vues à 360 px.")

