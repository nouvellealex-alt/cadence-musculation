"""Vérifie le repli sur le cache lorsque le serveur tarde à envoyer le HTML."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Event, Thread
from time import monotonic, sleep
from urllib.parse import urlsplit
from playwright.sync_api import expect, sync_playwright

lent=Event()
class Serveur(SimpleHTTPRequestHandler):
    def log_message(self,*_):
        pass

    def do_GET(self):
        if lent.is_set() and urlsplit(self.path).path=="/":
            sleep(6)
        try:
            super().do_GET()
        except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):
            pass

source=Path(__file__).resolve().parents[1]/"dist"
with ThreadingHTTPServer(("127.0.0.1",0),partial(Serveur,directory=str(source))) as serveur:
    Thread(target=serveur.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            navigateur=p.chromium.launch()
            page=navigateur.new_page()
            adresse=f"http://127.0.0.1:{serveur.server_port}/"
            page.goto(adresse)
            page.wait_for_function("navigator.serviceWorker.ready.then(() => true)")
            page.reload()
            page.wait_for_function("navigator.serviceWorker.controller !== null")
            lent.set()
            depart=monotonic()
            page.goto(adresse+"?reseau=lent",timeout=5000)
            expect(page.get_by_role("heading",name="Tableau de bord")).to_be_visible()
            duree=monotonic()-depart
            assert duree<5,duree
            print(f"Cache utilisable en {duree:.2f} s malgré 6 s de délai côté serveur.")
            lent.clear()
            page.goto(adresse+"#donnees")
            expect(page.locator("#etat-hors-ligne")).to_contain_text("Carnet prêt hors ligne")
            assert page.evaluate("caches.keys().then(keys => caches.delete(keys.find(key => /^cadence-[0-9]+$/.test(key))))")
            page.reload()
            expect(page.locator("#etat-hors-ligne")).to_contain_text("Le carnet hors ligne est incomplet")
            print("Cache vidé : Cadence signale que le carnet hors ligne est incomplet.")
    finally:
        serveur.shutdown()
