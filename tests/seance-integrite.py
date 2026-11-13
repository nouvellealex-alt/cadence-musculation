"""Vérifie l’intégrité d’une séance lors d’une suppression ou d’une erreur."""
import json
import os

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/#seance"


def demarrer_seance(page):
    page.goto(URL)
    page.get_by_role("button", name="Démarrer une séance").click()
    page.get_by_role("button", name="Ajouter un exercice").click()
    page.get_by_label("Rechercher dans la bibliothèque").fill("développé couché")
    page.get_by_role("button", name="Ajouter Développé couché", exact=True).click()
    page.get_by_label("Charge de la série 1", exact=True).fill("17,5")
    page.get_by_role("button", name="Valider la série 1", exact=True).click()
    expect(page.locator(".done")).to_have_count(1)


with sync_playwright() as playwright:
    navigateur = playwright.webkit.launch()
    contexte = navigateur.new_context(**playwright.devices["iPhone 13"])
    page = contexte.new_page()
    demarrer_seance(page)
    page.get_by_role("button", name="Ajouter une série").click()
    page.get_by_text("Options de la série 1", exact=True).click()
    supprimer = page.get_by_role("button", name="Supprimer la série 1", exact=True)
    supprimer.click()
    dialogue = page.get_by_role("dialog")
    expect(dialogue).to_contain_text("est validée")
    expect(page.locator(".done")).to_have_count(1)
    dialogue.get_by_role("button", name="Conserver la série", exact=True).click()
    expect(page.locator(".done")).to_have_count(1)
    expect(page.locator("#repos")).not_to_have_text("0:00")
    supprimer.click()
    dialogue.get_by_role("button", name="Supprimer la série", exact=True).click()
    expect(page.locator(".done")).to_have_count(0)
    expect(page.locator(".bloc-serie")).to_have_count(1)
    expect(page.locator("#repos")).to_have_text("0:00")
    page.reload()
    expect(page.locator(".done")).to_have_count(0)
    expect(page.locator(".bloc-serie")).to_have_count(1)
    contexte.close()

    contexte = navigateur.new_context(**playwright.devices["iPhone 13"])
    page = contexte.new_page()
    demarrer_seance(page)
    autre = contexte.new_page()
    autre.goto(URL)
    autre.get_by_label("Titre", exact=True).fill("Séance modifiée dans un autre onglet")
    autre.wait_for_function("""() => new Promise(resolve => {
      const ouverture = indexedDB.open('cadence-musculation', 1);
      ouverture.onsuccess = () => {
        const db = ouverture.result;
        const lecture = db.transaction('carnet').objectStore('carnet').get('etat');
        lecture.onsuccess = () => {
          resolve(lecture.result.actif.nom === 'Séance modifiée dans un autre onglet');
          db.close();
        };
      };
    })""")
    page.get_by_role("button", name="Terminer et enregistrer").click()
    expect(page.locator("#message")).to_contain_text("Le carnet a changé dans un autre onglet")
    expect(page.get_by_role("heading", name="Séance en cours", exact=True)).to_be_visible()
    expect(page.locator(".done")).to_have_count(1)
    page.reload()
    expect(page.get_by_label("Titre", exact=True)).to_have_value("Séance modifiée dans un autre onglet")
    expect(page.locator(".done")).to_have_count(1)
    page.get_by_role("link", name="Progression", exact=True).click()
    expect(page.get_by_text("Aucune séance enregistrée sur cette période.")).to_be_visible()
    contexte.close()

    contexte = navigateur.new_context(**playwright.devices["iPhone 13"])
    page = contexte.new_page()
    page.goto(URL.replace("#seance", "#semaine"))
    jour = {"nom": "Séance guidée de test", "exercices": [
        {"id": identifiant, "series": 1, "reps": 8, "repsMax": 12, "repos": 90, "reposMax": 120}
        for identifiant in ["dc", "cur"]
    ]}
    semaine = {"format": "cadence-semaine-v1", "semaine": {
        "objectif": "Contrôler la correction d’une série", "active": True, "jours": [jour] * 7
    }}
    page.get_by_role("button", name="Importer ma semaine").click()
    page.get_by_label("Fichier de semaine Cadence").set_input_files({
        "name": "semaine-test.json", "mimeType": "application/json",
        "buffer": json.dumps(semaine).encode()
    })
    page.get_by_role("button", name="Importer la semaine", exact=True).click()
    page.get_by_role("button", name="Démarrer la séance", exact=True).click()
    visible = page.locator(".journal-exercice:visible")
    charge = visible.get_by_label("Charge de la série 1", exact=True)
    valider = visible.get_by_role("button", name="Valider la série 1", exact=True)
    charge.fill("17,5")
    valider.click()
    expect(visible.locator(".done")).to_have_count(1)
    charge.fill("")
    page.get_by_role("button", name="Suivant", exact=False).first.click()
    expect(visible.get_by_role("heading", name="Flexion des biceps")).to_be_visible()
    charge.fill("12,5")
    valider.click()
    expect(visible.locator(".done")).to_have_count(1)
    terminer = page.get_by_role("button", name="Terminer et enregistrer")
    terminer.click()
    expect(visible.get_by_role("heading", name="Développé couché", exact=True)).to_be_visible()
    expect(charge).to_be_focused()
    expect(charge).to_have_attribute("aria-invalid", "true")
    charge.fill("18,5")
    terminer.click()
    expect(page.locator(".metric").filter(has_text="Volume total")).to_contain_text("248 kg")
    print("WebKit : suppression confirmée, conflit sans fausse réussite et retour au champ invalide.")
