"""Recette WebKit : machine privée, archive explicite, 30 séries et reprise hors ligne."""
import base64
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from playwright.sync_api import expect, sync_playwright

url=os.environ.get("CADENCE_TEST_URL","http://127.0.0.1:8764/").rstrip("/")+"/"
with TemporaryDirectory() as profil, sync_playwright() as p:
    appareil={**p.devices["iPhone 13"],"viewport":{"width":402,"height":874}}
    del appareil["default_browser_type"]
    contexte=p.webkit.launch_persistent_context(profil, **appareil, accept_downloads=True)
    page=contexte.pages[0]
    erreurs=[]
    page.on("pageerror",lambda erreur:erreurs.append(str(erreur)))
    page.goto(url+"#exercices")
    page.get_by_role("button",name="Ma machine").click()
    page.get_by_label("Nom",exact=True).fill("Machine de test")
    page.get_by_label("Groupe musculaire").fill("Pectoraux")
    page.get_by_label("Étage ou zone").fill("Étage 2")
    image=page.evaluate("""()=>{const c=document.createElement('canvas');c.width=c.height=8;return c.toDataURL().split(',')[1]}""")
    page.get_by_label("Photo privée du poste").set_input_files({"name":"poste.png","mimeType":"image/png","buffer":base64.b64decode(image)})
    page.get_by_role("button",name="Enregistrer",exact=True).click()
    expect(page.get_by_role("heading",name="Machine de test")).to_be_visible()
    page.get_by_role("button",name="Voir la fiche").click()
    expect(page.get_by_role("img",name="Machine de test")).to_be_visible()
    expect(page.get_by_text("Étage 2",exact=False)).to_be_visible()
    page.goto(url+"#donnees")
    def exporter():
        with page.expect_download() as dl:
            page.get_by_role("button",name="Exporter en JSON").click()
        return json.loads(Path(dl.value.path()).read_text(encoding="utf-8"))
    prive=exporter()
    assert prive["persos"][0]["machine"] and "photo" not in prive["persos"][0]
    page.get_by_label("Photos personnelles dans la sauvegarde").select_option("oui")
    archive=exporter()
    assert archive["persos"][0]["photo"].startswith("data:image/jpeg;base64,")
    page.goto(url+"#semaine")
    page.get_by_role("button",name="Importer ma semaine").click()
    def cible(id):
        return dict(id=id,series=10,reps=8,repsMax=12,repos=90,reposMax=120)
    programme={"format":"cadence-semaine-v1","semaine":{"objectif":"Test","active":True,"jours":[
        {"nom":"Séance de contrôle","exercices":[cible(id) for id in ["dc",archive["persos"][0]["id"],"tir"]]}
        for _ in range(7)]}}
    page.get_by_label("Fichier de semaine Cadence").set_input_files({"name":"test.json","mimeType":"application/json","buffer":json.dumps(programme).encode()})
    page.get_by_role("button",name="Importer la semaine",exact=True).click()
    page.get_by_role("button",name="Démarrer la séance").click()
    bloc=page.locator(".journal-exercice:visible")
    for exercice in range(3):
        expect(bloc).to_have_attribute("data-i",str(exercice))
        for rang in range(1,11):
            charge=bloc.get_by_label(f"Charge de la série {rang}",exact=True)
            charge.fill("17,5")
            if exercice==0 and rang==1:
                bloc.get_by_role("button",name="Ajouter 2,5 kg à la série 1",exact=True).click()
                expect(charge).to_have_value("20")
            valider=bloc.get_by_role("button",name=f"Valider la série {rang}",exact=True)
            valider.click()
            expect(valider).to_have_attribute("aria-pressed","true")
        if exercice<2:
            page.get_by_role("button",name="Suivant →",exact=True).click()
    page.wait_for_function("navigator.serviceWorker.ready.then(() => true)")
    contexte.set_offline(True)
    page.close()
    reprise=contexte.new_page()
    reprise.goto(url+"#seance")
    expect(reprise.locator(".journal-exercice .done")).to_have_count(30)
    expect(reprise.locator(".journal-exercice:visible")).to_contain_text("Tirage vertical")
    assert not erreurs, erreurs
    contexte.close()
    print("WebKit : machine privée, export opt-in, 30 séries retrouvées après fermeture hors ligne.")
