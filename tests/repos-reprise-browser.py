"""Contrôle le repos après suspension et relance hors ligne avec WebKit."""
import os
from datetime import datetime, timedelta, timezone
from tempfile import TemporaryDirectory

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/#seance"

with TemporaryDirectory() as profil, sync_playwright() as playwright:
    appareil = dict(playwright.devices["iPhone 13"])
    del appareil["default_browser_type"]
    contexte = playwright.webkit.launch_persistent_context(profil, **appareil)
    page = contexte.pages[0]
    erreurs = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    depart = datetime(2026, 11, 13, 13, tzinfo=timezone.utc)
    page.clock.set_fixed_time(depart)
    page.goto(URL)
    page.get_by_role("button", name="Démarrer une séance").click()
    page.get_by_role("button", name="Ajouter un exercice").click()
    page.get_by_label("Rechercher dans la bibliothèque").fill("développé couché")
    page.get_by_role("button", name="Ajouter Développé couché", exact=True).click()

    libelle = page.locator("#repos-libelle")
    minuteur = page.locator("#repos")
    valider = page.get_by_role("button", name="Valider la série 1", exact=True)
    arreter = page.get_by_role("button", name="Arrêter le repos")
    ajouter_temps = page.get_by_role("button", name="Ajouter 15 secondes au repos")
    retirer_temps = page.get_by_role("button", name="Retirer 15 secondes du repos")
    expect(libelle).to_have_text("Repos")
    expect(arreter).to_be_disabled()
    expect(retirer_temps).to_be_disabled()
    page.get_by_label("Charge de la série 1", exact=True).fill("17,5")
    valider.click()
    expect(valider).to_have_attribute("aria-pressed", "true")
    expect(minuteur).to_have_text("1:30")
    expect(arreter).to_be_enabled()

    page.clock.set_fixed_time(depart + timedelta(seconds=45))
    temps_apres_retour = page.evaluate("""() => {
        document.dispatchEvent(new Event('visibilitychange'));
        return document.querySelector('#repos').textContent;
    }""")
    assert temps_apres_retour == "0:45"
    page.wait_for_function("navigator.serviceWorker.ready.then(() => true)")
    page.reload()
    page.wait_for_function("Boolean(navigator.serviceWorker.controller)")
    contexte.set_offline(True)
    page.close()
    page = contexte.new_page()
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.clock.set_fixed_time(depart + timedelta(seconds=100))
    page.goto(URL)
    libelle = page.locator("#repos-libelle")
    minuteur = page.locator("#repos")
    expect(libelle).to_have_text("Repos terminé")
    expect(minuteur).to_have_text("0:00")
    expect(page.get_by_role("button", name="Valider la série 1", exact=True)).to_have_attribute("aria-pressed", "true")

    page.get_by_role("button", name="Ajouter 15 secondes au repos").click()
    expect(libelle).to_have_text("Repos")
    expect(minuteur).to_have_text("0:15")
    page.get_by_role("button", name="Retirer 15 secondes du repos").click()
    expect(libelle).to_have_text("Repos")
    expect(minuteur).to_have_text("0:00")
    page.get_by_role("button", name="Ajouter 15 secondes au repos").click()
    page.clock.set_fixed_time(depart + timedelta(seconds=116))
    etat = page.evaluate("""() => {
        window.dispatchEvent(new Event('pageshow'));
        return document.querySelector('#repos-libelle').textContent;
    }""")
    assert etat == "Repos terminé"

    page.get_by_role("button", name="Valider la série 1", exact=True).click()
    expect(page.locator(".done")).to_have_count(0)
    page.get_by_role("button", name="Valider la série 1", exact=True).click()
    expect(page.locator(".done")).to_have_count(1)
    expect(minuteur).to_have_text("1:30")
    page.get_by_role("button", name="Retirer Développé couché", exact=True).click()
    page.get_by_role("button", name="Confirmer", exact=True).click()
    expect(page.locator(".journal-exercice")).to_have_count(0)
    expect(libelle).to_have_text("Repos")
    expect(minuteur).to_have_text("0:00")
    assert not erreurs, erreurs
    contexte.close()
    print("WebKit : repos à 45 s au retour, fin après réouverture hors ligne et ajustement manuel.")
