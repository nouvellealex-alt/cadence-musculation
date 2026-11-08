"""Parcours de planning en Chromium. Lancer le serveur Cadence avant ce test."""
from datetime import date, timedelta
import os

from playwright.sync_api import expect, sync_playwright


def test_planning(page):
    page.get_by_role("link", name="Planning", exact=True).click()
    expect(page.get_by_role("heading", name="Planning", exact=True)).to_be_visible()
    page.get_by_role("button", name="Ajuster", exact=True).click()
    page.get_by_label("Séances par semaine").fill("4")
    page.get_by_role("button", name="Enregistrer", exact=True).click()
    expect(page.get_by_text("0 / 4", exact=True)).to_be_visible()

    programme = page.locator(".planning-programme").filter(has_text="Premiers repères en salle")
    programme.get_by_role("button", name="Voir le programme").click()
    page.get_by_label("Durée en semaines").fill("2")
    page.get_by_role("button", name="Planifier le programme").click()
    entree = page.locator(".planning-entree").filter(has_text="Salle · corps entier A")
    expect(entree.get_by_text("Prévue", exact=True)).to_be_visible()
    entree.get_by_role("button", name="Déplacer").click()
    jour = page.get_by_label("Nouvelle date")
    aujourd_hui = jour.input_value()
    demain = (date.fromisoformat(aujourd_hui) + timedelta(days=1)).isoformat()
    jour.fill(demain)
    page.get_by_role("button", name="Déplacer", exact=True).last.click()
    expect(page.locator('.planning-date[aria-pressed="true"]')).to_have_attribute("data-jour", demain)
    entree.get_by_role("button", name="Déplacer").click()
    jour.fill(aujourd_hui)
    page.get_by_role("button", name="Déplacer", exact=True).last.click()

    entree.get_by_role("button", name="Démarrer", exact=True).click()
    expect(page.get_by_label("Titre", exact=True)).to_have_value("Salle · corps entier A")
    page.get_by_role("link", name="Planning", exact=True).click()
    expect(entree.get_by_text("En cours", exact=True)).to_be_visible()
    entree.get_by_role("button", name="Reprendre", exact=True).click()
    page.get_by_label("Charge de la série 1", exact=True).first.fill("45")
    page.get_by_role("button", name="Valider la série 1", exact=True).first.click()
    page.get_by_role("button", name="Terminer et enregistrer", exact=True).click()
    page.get_by_role("link", name="Planning", exact=True).click()
    expect(entree.get_by_text("Réalisée", exact=True)).to_be_visible()
    expect(page.get_by_text("1 / 4", exact=True)).to_be_visible()
    page.reload()
    expect(entree.get_by_text("Réalisée", exact=True)).to_be_visible()

    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


def test_partage(page):
    page.get_by_role("link", name="Routines", exact=True).click()
    carte = page.locator("article").filter(has=page.get_by_role("heading", name="Corps entier", exact=True))
    with page.expect_download() as fichier:
        carte.get_by_role("button", name="Exporter", exact=True).click()
    page.get_by_role("button", name="Importer une routine", exact=True).click()
    page.get_by_label("Fichier de routine Cadence").set_input_files(fichier.value.path())
    page.get_by_role("button", name="Importer", exact=True).click()
    expect(page.get_by_role("heading", name="Sans dossier", exact=True)).to_be_visible()
    perso = carte.filter(has=page.get_by_role("button", name="Routine favorite"))
    perso.get_by_role("button", name="Classer", exact=True).click()
    page.get_by_label("Dossier", exact=True).fill("Mes favoris")
    page.get_by_role("button", name="Enregistrer", exact=True).click()
    expect(page.get_by_role("heading", name="Mes favoris", exact=True)).to_be_visible()
    favori = perso.get_by_role("button", name="Routine favorite")
    favori.click()
    expect(favori).to_have_attribute("aria-pressed", "true")
    page.wait_for_function("""id => new Promise((resolve, reject) => {
      const ouverture = indexedDB.open('cadence-musculation');
      ouverture.onerror = () => reject(ouverture.error);
      ouverture.onsuccess = () => {
        const db = ouverture.result;
        const lecture = db.transaction('carnet').objectStore('carnet').get('etat');
        lecture.onsuccess = () => {
          db.close();
          resolve(lecture.result?.planning?.metadonnees?.some(x => x.id === id && x.favori));
        };
        lecture.onerror = () => reject(lecture.error);
      };
    })""", arg=favori.get_attribute("data-id"))
    page.reload()
    expect(favori).to_have_attribute("aria-pressed", "true")


def test_partage_personnel(page, navigateur, url):
    page.get_by_role("link", name="Exercices", exact=True).click()
    page.get_by_role("button", name="Exercice personnalisé").click()
    page.get_by_label("Nom", exact=True).fill("Tirage personnel")
    page.get_by_label("Groupe musculaire", exact=True).fill("Dos")
    page.get_by_label("Matériel", exact=True).fill("Poulie")
    page.get_by_label("Consigne", exact=True).fill("Contrôler le retour.")
    page.get_by_role("button", name="Enregistrer", exact=True).click()
    page.get_by_role("link", name="Routines", exact=True).click()
    page.get_by_role("button", name="Créer une routine").click()
    page.get_by_label("Nom", exact=True).fill("Partage personnel")
    page.locator("select[name=ex]").select_option(label="Tirage personnel")
    page.get_by_role("button", name="Enregistrer", exact=True).click()
    carte = page.locator("article").filter(has=page.get_by_role("heading", name="Partage personnel", exact=True))
    with page.expect_download() as fichier:
        carte.get_by_role("button", name="Exporter", exact=True).click()
    autre = navigateur.new_page()
    autre.goto(url + "#routines")
    autre.get_by_role("button", name="Importer une routine", exact=True).click()
    autre.get_by_label("Fichier de routine Cadence").set_input_files(fichier.value.path())
    autre.get_by_role("button", name="Importer", exact=True).click()
    carte = autre.locator("article").filter(has=autre.get_by_role("heading", name="Partage personnel", exact=True))
    expect(carte.get_by_text("Tirage personnel", exact=False)).to_be_visible()
    carte.get_by_role("button", name="Démarrer", exact=True).click()
    expect(autre.get_by_role("heading", name="Tirage personnel", exact=True)).to_be_visible()
    autre.close()


def main():
    url = os.environ.get("CADENCE_URL", "http://127.0.0.1:8764/")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(viewport={"width": 360, "height": 800}, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.set_default_timeout(7000)
        erreurs = []
        page.on("pageerror", lambda error: erreurs.append(str(error)))
        page.goto(url)
        test_planning(page)
        test_partage(page)
        test_partage_personnel(page, browser, url)
        assert not erreurs, erreurs
        print("Planning, séance liée, sauvegarde, partage, dossiers et favoris vérifiés à 360 px.")


if __name__ == "__main__":
    main()

