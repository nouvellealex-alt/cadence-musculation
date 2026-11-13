"""Vérifie le conflit de restauration entre deux onglets sur un même carnet."""
import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/"
candidat = {
    "schema": 1, "profil": "carnet-importe", "theme": "sombre", "repos": 50,
    "actif": None, "seances": [], "routines": [], "persos": []
}
fichier = {"name": "candidat.json", "mimeType": "application/json",
           "buffer": json.dumps(candidat).encode()}

def verifier_fichier(page):
    page.get_by_role("button", name="Restaurer un fichier").click()
    page.get_by_label("Fichier de sauvegarde").set_input_files(fichier)
    page.get_by_role("button", name="Vérifier le fichier").click()
    return page.get_by_role("dialog", name="Remplacer le carnet actuel ?")

with sync_playwright() as p:
    browser = p.webkit.launch()
    contexte = browser.new_context(**p.devices["iPhone 13"], accept_downloads=True)
    premier, second = contexte.new_page(), contexte.new_page()
    for page in (premier, second):
        page.goto(URL + "#donnees")
        expect(page.get_by_label("Apparence")).to_have_value("sombre")

    second.get_by_label("Apparence").select_option("clair")
    second.wait_for_function("""() => new Promise(resolve => {
      const ouverture=indexedDB.open('cadence-musculation', 1);
      ouverture.onsuccess=()=>{
        const db=ouverture.result;
        const lecture=db.transaction('carnet').objectStore('carnet').get('etat');
        lecture.onsuccess=()=>{db.close();resolve(lecture.result.theme==='clair');};
      };
    })""")

    dialogue = verifier_fichier(premier)
    dialogue.get_by_role("button", name="Confirmer", exact=True).click()
    expect(dialogue.get_by_role("alert")).to_contain_text("Impossible de restaurer le carnet")
    dialogue.get_by_role("button", name="Fermer", exact=True).click()
    expect(premier.locator("#reglage-repos")).to_have_value("90")
    with premier.expect_download() as telechargement:
        premier.get_by_role("button", name="Exporter en JSON").click()
    copie = json.loads(Path(telechargement.value.path()).read_text(encoding="utf-8"))
    assert copie["profil"] != candidat["profil"]
    assert copie["repos"] == 90
    expect(premier.locator("#message")).to_contain_text("Téléchargement du JSON lancé")

    premier.reload()
    expect(premier.get_by_label("Apparence")).to_have_value("clair")
    dialogue = verifier_fichier(premier)
    dialogue.get_by_role("button", name="Confirmer", exact=True).click()
    expect(premier.locator("#message")).to_have_text("Carnet restauré.")
    expect(premier.locator("#reglage-repos")).to_have_value("50")
    premier.reload()
    expect(premier.locator("#reglage-repos")).to_have_value("50")
    print("Restauration atomique : conflit conservé, export fidèle, import réussi et persistant.")
