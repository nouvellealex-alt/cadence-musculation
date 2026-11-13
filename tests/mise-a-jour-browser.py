"""Le catalogue et son registre restent du même lot pendant une mise à jour."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from shutil import copytree
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import sync_playwright


class Serveur(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        try:
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass


def versions(page):
    return page.evaluate("""async () => Promise.all(['exercices.js', 'medias.js'].map(async fichier => {
      const texte = await (await fetch(fichier, {cache:'no-store'})).text();
      return texte.includes('// Version de test 2') ? 2 : 1;
    }))""")


def tester(adresse, site):
    worker = site / "sw.js"
    ancien = worker.read_text(encoding="utf-8") + "\nself.addEventListener('message', e => { if (e.data === 'version') e.ports[0]?.postMessage(version); });\n"
    worker.write_text(ancien, encoding="utf-8")
    with sync_playwright() as p:
        navigateur = p.chromium.launch()
        contexte = navigateur.new_context()
        page = contexte.new_page()
        page.goto(adresse)
        page.wait_for_function("navigator.serviceWorker.ready.then(() => true)")
        page.reload()
        page.wait_for_function("navigator.serviceWorker.controller !== null")
        assert versions(page) == [1, 1]

        numero = ancien.split("const version = 'cadence-", 1)[1].split("'", 1)[0]
        for fichier in ("exercices.js", "medias.js"):
            with (site / fichier).open("a", encoding="utf-8") as f:
                f.write("\n// Version de test 2\n")
        worker.write_text(ancien.replace(f"'cadence-{numero}'", f"'cadence-{int(numero) + 1}'", 1), encoding="utf-8")
        page.evaluate("navigator.serviceWorker.getRegistration().then(worker => worker.update())")
        page.wait_for_function("navigator.serviceWorker.getRegistration().then(worker => worker.waiting?.state === 'installed')")
        page.wait_for_function("""async version => {
          const reponse = await caches.match(new URL('exercices.js', location.href), {cacheName:'cadence-' + version});
          return (await reponse?.text())?.includes('// Version de test 2');
        }""", arg=int(numero) + 1, timeout=5000)
        page.reload()
        assert versions(page) == [1, 1]
        # Une page de contrôle hors de la portée du worker ne retarde pas son activation.
        sonde = contexte.new_page()
        sonde.goto(adresse + "../sonde.html")
        page.close()
        sonde.wait_for_function("""async ({adresse, cible}) => {
          const worker = await navigator.serviceWorker.getRegistration(adresse);
          if (worker?.active?.state !== 'activated' || worker.waiting) return false;
          const canal = new MessageChannel();
          const version = new Promise(resolve => { canal.port1.onmessage = e => resolve(e.data); });
          worker.active.postMessage('version', [canal.port2]);
          return await version === cible;
        }""", arg={"adresse": adresse, "cible": f"cadence-{int(numero) + 1}"}, timeout=5000)

        nouvelle_page = contexte.new_page()
        navigation = nouvelle_page.goto(adresse)
        assert navigation.from_service_worker
        nouvelles_versions = versions(nouvelle_page)
        assert nouvelles_versions == [2, 2], nouvelles_versions
        contexte.set_offline(True)
        nouvelle_page.reload()
        assert versions(nouvelle_page) == [2, 2]
        navigateur.close()


with TemporaryDirectory() as dossier:
    racine = Path(dossier)
    site = copytree(Path(__file__).resolve().parents[1] / "dist", racine / "cadence")
    (racine / "sonde.html").write_text("<!doctype html><title>Sonde</title>", encoding="utf-8")
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(Serveur, directory=racine)) as serveur:
        Thread(target=serveur.serve_forever, daemon=True).start()
        try:
            tester(f"http://127.0.0.1:{serveur.server_port}/cadence/", site)
            print("Catalogue et registre cohérents avant et après l’activation, en ligne et hors ligne.")
        finally:
            serveur.shutdown()
