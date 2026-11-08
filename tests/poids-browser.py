"""Pesées fictives : virgule, moyenne, correction et restauration sur un appareil vierge."""
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/"


def enregistrer(page, date, kg):
    page.locator("#poids-date").fill(date)
    page.locator("#poids-kg").fill(kg)
    page.get_by_role("button", name="Enregistrer le poids").click()


with sync_playwright() as p, TemporaryDirectory() as tmp:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 402, "height": 874}, is_mobile=True, has_touch=True)
    page = context.new_page()
    page.set_default_timeout(12000)
    erreurs = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.goto(URL + "#poids")
    expect(page.get_by_role("heading", name="Poids corporel")).to_be_visible()
    for date, kg in [
        ("2025-09-01", "83,5"),
        ("2025-10-28", "87,3"),
        ("2025-10-29", "81,3"),
        ("2025-11-04", "80,5"),
    ]:
        enregistrer(page, date, kg)
    expect(page.get_by_role("heading", name="80,5 kg")).to_be_visible()
    expect(page.locator("#poids-moyenne")).to_contain_text("80,9 kg")
    expect(page.get_by_role("img", name="Évolution du poids corporel")).to_be_visible()

    page.get_by_role("button", name="Modifier la pesée du 2025-10-29").click()
    expect(page.locator("#poids-kg")).to_have_value("81,3")
    page.locator("#poids-kg").fill("82,3")
    page.get_by_role("button", name="Enregistrer le poids").click()
    expect(page.locator("#poids-moyenne")).to_contain_text("81,4 kg")
    page.get_by_role("button", name="Supprimer la pesée du 2025-10-28").click()
    confirmer = page.get_by_role("button", name="Confirmer", exact=True)
    if confirmer.is_visible():
        confirmer.click()
    expect(page.get_by_role("button", name="Supprimer la pesée du 2025-10-28")).to_have_count(0)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")

    page.goto(URL + "#donnees")
    with page.expect_download() as evenement:
        page.get_by_role("button", name="Exporter en JSON").click()
    sauvegarde = Path(tmp) / "poids.json"
    evenement.value.save_as(sauvegarde)
    contenu = json.loads(sauvegarde.read_text(encoding="utf-8"))
    assert contenu["poids"] == [
        {"date": "2025-09-01", "kg": 83.5},
        {"date": "2025-10-29", "kg": 82.3},
        {"date": "2025-11-04", "kg": 80.5},
    ]

    page.goto(URL + "#poids")
    page.reload()
    expect(page.locator("#poids-moyenne")).to_contain_text("81,4 kg")

    autre = browser.new_context()
    restauration = autre.new_page()
    restauration.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    restauration.goto(URL + "#donnees")
    restauration.get_by_role("button", name="Restaurer un fichier").click()
    restauration.get_by_label("Fichier de sauvegarde").set_input_files(sauvegarde)
    restauration.get_by_role("button", name="Vérifier le fichier").click()
    restauration.get_by_role("button", name="Confirmer", exact=True).click()
    expect(restauration.get_by_role("status").filter(has_text="Carnet restauré")).to_be_visible()
    restauration.goto(URL + "#poids")
    expect(restauration.locator("#poids-moyenne")).to_contain_text("81,4 kg")
    assert not erreurs, erreurs
    print("Poids corporel : virgule, courbe, moyenne 7 jours, correction, suppression, rechargement et restauration OK.")
