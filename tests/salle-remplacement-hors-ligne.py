"""Vérifie une séance guidée et son historique hors ligne sur WebKit."""
import json
import os

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/"


def exercice(identifiant):
    return {
        "id": identifiant, "series": 2, "reps": 8, "repsMax": 12,
        "repos": 90, "reposMax": 120
    }


jour = {"nom": "Séance de contrôle hors ligne", "exercices": [
    exercice(identifiant) for identifiant in ["pre", "tir", "lat", "dc", "cur"]
]}
semaine = {
    "format": "cadence-semaine-v1",
    "semaine": {"objectif": "Contrôle WebKit", "active": True, "jours": [jour] * 7}
}

with sync_playwright() as playwright:
    navigateur = playwright.webkit.launch()
    iphone = playwright.devices.get("iPhone 17 Pro") or {**playwright.devices["iPhone 13"], "viewport": {"width": 402, "height": 874}}
    contexte = navigateur.new_context(**iphone)
    page = contexte.new_page()
    page.set_default_timeout(12000)
    erreurs = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.goto(URL + "#donnees")
    expect(page.locator("#etat-hors-ligne")).to_contain_text("Carnet prêt hors ligne", timeout=30000)
    page.reload()
    page.wait_for_function("Boolean(navigator.serviceWorker.controller)")
    page.get_by_role("button", name="Télécharger les démonstrations").click()
    expect(page.locator("#message")).to_have_text("Démonstrations prêtes hors ligne.", timeout=60000)

    page.goto(URL + "#routines")
    page.get_by_role("button", name="Importer une routine").click()
    routine = {"format": "cadence-routine-v1", "routine": {**jour, "nom": "Routine de contrôle"}}
    page.get_by_label("Fichier de routine Cadence").set_input_files({
        "name": "routine-test.json", "mimeType": "application/json", "buffer": json.dumps(routine).encode()
    })
    page.get_by_role("button", name="Importer", exact=True).click()
    carte = page.locator("article").filter(has=page.get_by_role("heading", name="Routine de contrôle"))
    expect(carte).to_contain_text("Développé couché · 2 × 8")

    page.goto(URL + "#exercices")
    page.get_by_label("Rechercher").fill("developpe couche a la barre")
    page.locator('#cartes [data-id="dc"][data-act="exercice"]').click()
    fiche = page.get_by_role("dialog")
    expect(fiche).to_contain_text("Barre droite, banc plat et supports")
    media_original = fiche.locator("video").get_attribute("src")
    vignette_originale = fiche.locator("video").get_attribute("poster")
    fiche.get_by_role("button", name="Fermer", exact=True).click()

    page.goto(URL + "#semaine")
    page.get_by_role("button", name="Importer ma semaine").click()
    page.get_by_label("Fichier de semaine Cadence").set_input_files({
        "name": "semaine-test.json", "mimeType": "application/json",
        "buffer": json.dumps(semaine).encode()
    })
    page.get_by_role("button", name="Importer la semaine", exact=True).click()
    page.goto(URL + "#donnees")
    page.get_by_role("button", name="Retirer les médias téléchargés").click()
    expect(page.locator("#etat-pack")).to_contain_text("0 sur")
    page.get_by_role("button", name="Télécharger les médias de ma semaine").click()
    expect(page.locator("#message")).to_have_text("Médias disponibles de ta semaine téléchargés.", timeout=60000)
    chemins = page.evaluate("caches.open('cadence-medias-1').then(c => c.keys()).then(keys => keys.map(k => k.url))")
    assert any(url.endswith('/dc-21.mp4') for url in chemins)
    assert not any(url.endswith('/dc-halteres-17.mp4') for url in chemins)
    page.get_by_role("button", name="Télécharger les démonstrations", exact=True).click()
    expect(page.locator("#message")).to_have_text("Démonstrations prêtes hors ligne.", timeout=60000)
    page.goto(URL + "#semaine")
    page.get_by_role("button", name="Choisir par quoi commencer").click()
    page.get_by_role("button", name="4. Développé couché").click()
    mouvement = page.locator(".journal-exercice:visible")
    expect(mouvement.get_by_role("heading", name="Développé couché", exact=True)).to_be_visible()
    mouvement.get_by_role("button", name="Voir le mouvement").click()
    expect(fiche).to_contain_text("Barre droite, banc plat et supports")
    expect(fiche.locator("video")).to_have_attribute("src", media_original)
    expect(fiche.locator("video")).to_have_attribute("poster", vignette_originale)
    fiche.get_by_role("button", name="Fermer", exact=True).click()
    mouvement.get_by_role("button", name="Passer pour l’instant").click()
    expect(mouvement.get_by_role("heading", name="Flexion des biceps")).to_be_visible()
    page.get_by_role("button", name="Précédent").click()
    expect(mouvement.get_by_role("heading", name="Développé couché", exact=True)).to_be_visible()
    expect(page.locator(".journal-exercice .done")).to_have_count(0)

    contexte.set_offline(True)
    page.reload()
    expect(mouvement.get_by_role("heading", name="Développé couché", exact=True)).to_be_visible()
    mouvement.get_by_role("button", name="Lire la vidéo").click()
    page.wait_for_function("document.querySelector('dialog video')?.currentTime > 0")
    fiche.get_by_role("button", name="Fermer", exact=True).click()
    assert page.evaluate("""async () => {
      const lire = plage => fetch('./medias/dc-21.mp4', {headers:{Range:plage}});
      const debut = await lire('bytes=0-9');
      const fin = await lire('bytes=-10');
      const vide = await lire('bytes=-0');
      return debut.status === 206 && fin.status === 206 && vide.status === 416 &&
        (await debut.arrayBuffer()).byteLength === 10 && (await fin.arrayBuffer()).byteLength === 10;
    }""")
    mouvement.get_by_label("Charge de la série 1", exact=True).fill("17,5")
    mouvement.get_by_role("button", name="Valider la série 1", exact=True).click()
    expect(mouvement.locator(".done")).to_have_count(1)
    mouvement.get_by_role("button", name="Passer pour l’instant").click()
    expect(mouvement.get_by_role("heading", name="Flexion des biceps")).to_be_visible()
    mouvement.get_by_label("Charge de la série 1", exact=True).fill("12,5")
    mouvement.get_by_role("button", name="Valider la série 1", exact=True).click()
    expect(mouvement.locator(".done")).to_have_count(1)
    page.get_by_role("button", name="Choisir un exercice", exact=True).click()
    expect(page.get_by_role("button", name="4. Développé couché")).to_contain_text("1 / 2 séries")
    expect(page.get_by_role("button", name="5. Flexion des biceps")).to_contain_text("1 / 2 séries")
    page.get_by_role("button", name="4. Développé couché").click()
    expect(mouvement.get_by_label("Charge de la série 1", exact=True)).to_have_value("17,5")

    mouvement.get_by_role("button", name="Machine indisponible").click()
    page.get_by_role("button", name="Choisir Développé couché aux haltères", exact=True).click()
    expect(mouvement.get_by_role("heading", name="Développé couché aux haltères")).to_be_visible()
    expect(mouvement.locator(".bloc-serie")).to_have_count(1)
    expect(mouvement.get_by_label("Charge de la série 1", exact=True)).to_have_value("")
    expect(page.locator('.journal-exercice[data-i="3"] .done')).to_have_count(1)
    mouvement.get_by_role("button", name="Voir le mouvement").click()
    expect(fiche.get_by_role("heading", name="Développé couché aux haltères")).to_be_visible()
    video = fiche.locator("video")
    expect(video).to_be_visible()
    expect(video).not_to_have_attribute("src", media_original)
    expect(video).not_to_have_attribute("poster", vignette_originale)
    video.evaluate("element => { element.preload = 'metadata'; element.load(); }")
    page.wait_for_function("document.querySelector('dialog video')?.readyState >= 1")
    fiche.get_by_role("button", name="Fermer", exact=True).click()
    mouvement.get_by_label("Charge de la série 1", exact=True).fill("20")
    mouvement.get_by_role("button", name="Valider la série 1", exact=True).click()
    expect(mouvement.locator(".done")).to_have_count(1)

    page.reload()
    expect(mouvement.get_by_role("heading", name="Développé couché aux haltères")).to_be_visible()
    expect(page.locator(".journal-exercice .done")).to_have_count(3)
    page.get_by_role("button", name="Terminer et enregistrer").click()
    page.get_by_role("button", name="Enregistrer la séance partielle").click()
    expect(page.get_by_role("heading", name="Progression", exact=True)).to_be_visible()
    expect(page.locator(".metric").filter(has_text="Volume total")).to_contain_text("400 kg")
    exercices_suivis = page.locator("#progression-ex option")
    expect(exercices_suivis).to_contain_text([
        "Développé couché · Charge", "Développé couché aux haltères · Charge", "Flexion des biceps · Charge"
    ])
    page.get_by_role("button", name="Consulter").click()
    for nom, valeur in [("Développé couché", "17,5 kg × 8"), ("Flexion des biceps", "12,5 kg × 8"),
                        ("Développé couché aux haltères", "20 kg × 8")]:
        series = fiche.get_by_role("heading", name=nom, exact=True).locator("xpath=following-sibling::p[1]")
        expect(series).to_contain_text(valeur)
    fiche.get_by_role("button", name="Modifier la séance").click()
    premier = fiche.get_by_role("group", name="Développé couché", exact=True)
    premier.get_by_label("Charge de la série 1", exact=True).fill("18,5")
    fiche.get_by_role("button", name="Enregistrer les modifications").click()
    expect(page.locator(".metric").filter(has_text="Volume total")).to_contain_text("408 kg")

    page.get_by_role("link", name="Séance", exact=True).click()
    page.get_by_role("button", name="Démarrer une séance").click()
    page.get_by_role("button", name="Ajouter un exercice").click()
    page.get_by_label("Rechercher dans la bibliothèque").fill("développé couché")
    page.get_by_role("button", name="Ajouter Développé couché", exact=True).click()
    premier = page.locator(".journal-exercice").first
    premier.get_by_label("Charge de la série 1", exact=True).fill("17,5")
    premier.get_by_role("button", name="Valider la série 1", exact=True).click()
    expect(premier.locator(".done")).to_have_count(1)
    premier.get_by_role("button", name="Ajouter une série").click()
    premier.get_by_role("button", name="Remplacer Développé couché", exact=True).click()
    page.get_by_label("Rechercher dans la bibliothèque").fill("développé couché aux haltères")
    page.get_by_role("button", name="Choisir Développé couché aux haltères", exact=True).click()
    second = page.locator(".journal-exercice").nth(1)
    expect(second.get_by_role("heading", name="Développé couché aux haltères")).to_be_visible()
    expect(second.get_by_label("Charge de la série 1", exact=True)).to_have_value("")
    expect(premier.locator(".done")).to_have_count(1)
    assert not erreurs, erreurs
    print("WebKit hors ligne : 17,5 kg, passage 4-5-4, remplacements, vidéo, historique et recalcul.")
