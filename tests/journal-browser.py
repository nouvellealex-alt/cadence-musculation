import os
from pathlib import Path
from tempfile import TemporaryDirectory

from playwright.sync_api import expect, sync_playwright

with sync_playwright() as playwright, TemporaryDirectory() as temp:
    browser = playwright.chromium.launch()
    context = browser.new_context(accept_downloads=True, viewport={"width": 360, "height": 800}, is_mobile=True)
    page = context.new_page()
    page.set_default_timeout(6000)
    erreurs = []
    page.on("pageerror", lambda error: erreurs.append(str(error)))
    page.goto(os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/#seance")
    page.get_by_role("button", name="Démarrer une séance").click()

    def ajouter(requete, nom):
        page.get_by_role("button", name="Ajouter un exercice").click()
        page.get_by_label("Rechercher dans la bibliothèque").fill(requete)
        page.get_by_role("button", name="Ajouter " + nom, exact=True).click()

    ajouter("developpe couche", "Développé couché")
    ajouter("pompes", "Pompes")
    x = page.locator(".journal-exercice").nth(0)
    y = page.locator(".journal-exercice").nth(1)
    x.get_by_label("Charge de la série 1").fill("60")
    x.get_by_label("Répétitions de la série 1").fill("8")
    y.get_by_label("Répétitions de la série 1").fill("12")
    expect(y.get_by_label("Charge de la série 1")).to_have_count(0)
    for carte in [x,y]:
        carte.get_by_text("Réglages de l’exercice").click()
        carte.get_by_label("Supersérie").select_option("A")
    y.get_by_label("Repos (s)", exact=True).fill("45")
    y.get_by_label("Note de l’exercice").fill("Descente contrôlée")
    x.get_by_text("Options de la série 1").click()
    x.get_by_label("RPE de la série 1").fill("8.5")
    x.get_by_role("button", name="Valider la série 1").click()
    expect(page.locator("#repos")).to_have_text("0:00")
    y.get_by_role("button", name="Valider la série 1").click()
    expect(page.locator("#repos")).to_have_text("0:45")
    page.get_by_role("button", name="Ajouter 15 secondes au repos").click()
    expect(page.locator("#repos")).to_have_text("1:00")
    assert page.evaluate("document.documentElement.scrollWidth === innerWidth")
    page.get_by_role("button", name="Terminer et enregistrer").click()
    expect(page.get_by_text("480 kg", exact=True).first).to_be_visible()
    expect(page.get_by_text("Répétitions maximales · 12 rép.")).to_be_visible()
    page.locator("#progression-ex").select_option(label="Développé couché · Charge et répétitions")
    page.locator("#progression-indicateur").select_option("volume")
    expect(page.get_by_role("img", name="Évolution de volume par séance")).to_be_visible()
    page.get_by_role("button", name="Consulter").click()
    expect(page.get_by_text("Descente contrôlée")).to_be_visible()
    expect(page.get_by_text("60 kg × 8 · Travail · RPE 8,5")).to_be_visible()
    page.get_by_role("button", name="Modifier la séance").click()
    page.get_by_label("Charge de la série 1").fill("62")
    page.get_by_label("Titre").fill("=1+1")
    page.get_by_role("button", name="Enregistrer les modifications").click()
    expect(page.get_by_text("496 kg", exact=True).first).to_be_visible()
    page.get_by_role("button", name="Consulter").click()
    page.get_by_role("button", name="Refaire la séance").click()
    expect(page.get_by_label("Charge de la série 1")).to_have_value("62")
    expect(x.get_by_role("button", name="Valider la série 1")).to_have_attribute("aria-pressed","false")
    y.get_by_text("Réglages de l’exercice").click()
    y.get_by_label("Mode de suivi").select_option("duree")
    y.get_by_label("Durée en secondes de la série 1").fill("42")
    y.get_by_role("button", name="Valider la série 1").click()
    page.get_by_role("button", name="Terminer et enregistrer").click()
    expect(page.get_by_text("Durée maximale · 42 s")).to_be_visible()
    page.locator(".nav-plus > summary").click()
    page.get_by_role("link", name="Données").click()
    with page.expect_download() as capture:
        page.get_by_role("button", name="Exporter les séances en CSV").click()
    chemin = Path(temp) / "export.csv"
    capture.value.save_as(chemin)
    csv = chemin.read_text(encoding="utf-8-sig")
    assert '"\'=1+1"' in csv and '42' in csv and 'RPE' in csv
    assert not erreurs, erreurs
    print("Journal mobile : saisie charge/corps/durée, supersérie, repos, RPE, notes, statistiques, correction, duplication et CSV OK.")
