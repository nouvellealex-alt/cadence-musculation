"""Vérifie l’import de routines et de semaines depuis le même écran."""
import json
import os
from playwright.sync_api import expect, sync_playwright

url = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/")
cible = dict(id="dc",series=3,reps=8,repsMax=12,repos=90,reposMax=120)
routine = {"format":"cadence-routine-v1","routine":{"nom":"Routine de contrôle","exercices":[cible]}}
semaine = {"format":"cadence-semaine-v1","semaine":{"objectif":"Test","active":True,"jours":[{"nom":"Repos","exercices":[]} for _ in range(7)]}}
semaine["semaine"]["jours"][0]={"nom":"Semaine de contrôle","exercices":[cible]}

with sync_playwright() as p:
    browser=p.webkit.launch()
    page=browser.new_context(**{**p.devices["iPhone 13"],"viewport":{"width":402,"height":874}}).new_page()
    page.goto(url+"/#routines")
    page.get_by_role("button",name="Importer une routine").click()
    page.get_by_role("button",name="Importer",exact=True).click()
    expect(page.get_by_role("alert")).to_contain_text("Choisis un fichier")
    def choisir(contenu):
        page.get_by_label("Fichier de routine Cadence").set_input_files({
            "name":"cadence.json","mimeType":"application/octet-stream","buffer":json.dumps(contenu).encode()
        })
        page.get_by_role("button",name="Importer",exact=True).click()
    choisir(routine)
    expect(page.get_by_role("heading",name="Routine de contrôle")).to_be_visible()
    page.get_by_role("button",name="Importer une routine").click()
    choisir(semaine)
    expect(page.get_by_role("dialog",name="Importer dans Ma semaine")).to_be_visible()
    page.get_by_role("button",name="Importer dans Ma semaine",exact=True).click()
    page.get_by_role("button",name="Lundi",exact=True).click()
    expect(page.get_by_role("heading",name="Semaine de contrôle")).to_be_visible()
    page.reload()
    page.get_by_role("button",name="Lundi",exact=True).click()
    expect(page.get_by_role("heading",name="Semaine de contrôle")).to_be_visible()
    page.goto(url+"/#routines")
    expect(page.get_by_role("heading",name="Routine de contrôle")).to_be_visible()
    print("WebKit mobile : erreur visible, routine et semaine importées, toutes deux conservées.")
