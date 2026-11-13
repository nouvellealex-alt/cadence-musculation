"""Décode tous les médias du catalogue via HTTP et vérifie le repli en fiche."""
import os
from playwright.sync_api import expect, sync_playwright

url = os.environ.get("CADENCE_TEST_URL", "http://127.0.0.1:8764/").rstrip("/") + "/"

with sync_playwright() as p:
    navigateur = p.chromium.launch()
    page = navigateur.new_page()
    page.goto(url)
    resultat = page.evaluate("""async () => {
      const {catalogue} = await import('./exercices.js');
      const images = new Set();
      const films = new Set();
      for (const {media} of catalogue) {
        for (const {src} of media?.images ?? []) images.add(src);
        if (media?.video) {
          images.add(media.video.poster);
          films.add(media.video.src);
        }
      }
      for (const src of images) {
        const image = new Image();
        image.src = src;
        await image.decode().catch(() => { throw Error('Image illisible : ' + src); });
      }
      for (const src of films) await new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const delai = setTimeout(() => reject(Error('Décodage trop long : ' + src)), 8000);
        const terminer = erreur => {
          clearTimeout(delai);
          video.removeAttribute('src');
          video.load();
          erreur ? reject(Error('Vidéo illisible : ' + src)) : resolve();
        };
        video.addEventListener('loadeddata', () => terminer(!video.videoWidth), {once:true});
        video.addEventListener('error', () => terminer(true), {once:true});
        video.preload = 'auto';
        video.src = src;
      });
      return {images:images.size, films:films.size, exercices:catalogue.length};
    }""")
    print(f"Chromium : {resultat['images']} images décodées et {resultat['films']} premières images vidéo lues via HTTP.")
    page.goto(url + "#exercices")
    recherche = page.get_by_label("Rechercher")
    assert resultat["exercices"] >= 200
    expect(page.locator("#cartes .compte-ex").first).to_contain_text(f"{resultat['exercices']} exercices")
    expect(page.locator("#cartes article")).to_have_count(30)
    page.get_by_role("button", name="Afficher 30 exercices de plus").click()
    expect(page.locator("#cartes article")).to_have_count(60)
    filtre_media = page.locator('select[data-filter="media"]')
    filtre_media.select_option("video")
    expect(page.locator("#cartes .compte-ex").first).to_contain_text(f"{resultat['films']} exercices")
    recherche.fill("developpe couche a la barre")
    expect(page.locator("#cartes article").first.locator('[data-act="exercice"]')).to_have_attribute("data-id", "dc")
    page.locator('#cartes [data-id="dc"][data-act="exercice"]').click()
    video = page.get_by_role("dialog").locator("video")
    assert video.evaluate("video => video.loop && video.playsInline && video.controls && !video.autoplay")
    page.locator('[data-vitesse-video]').select_option("0.5")
    assert video.evaluate("video => video.playbackRate") == 0.5
    page.get_by_role("button", name="Fermer", exact=True).click()
    filtre_media.select_option("")
    recherche.fill("extension des jambes")
    carte = page.locator("#cartes article").filter(has=page.get_by_role("heading", name="Extension des jambes", exact=True))
    expect(carte.locator(".miniature")).to_have_count(0)
    carte.get_by_role("button", name="Voir la fiche").click()
    fiche = page.get_by_role("dialog", name="Extension des jambes")
    expect(fiche.get_by_text("Aucune démonstration vérifiée", exact=False)).to_be_visible()
    expect(fiche.locator(".positions")).to_have_count(0)
    expect(fiche.get_by_role("heading", name="Exécution")).to_be_visible()
    fiche.get_by_role("button", name="Fermer", exact=True).click()
    recherche.fill("pompes classiques")
    page.locator('#cartes [data-id="pom"][data-act="exercice"]').click()
    expect(page.get_by_role("dialog", name="Pompes").locator(".positions svg")).to_have_count(2)
    navigateur.close()

    navigateur = p.webkit.launch()
    contexte = navigateur.new_context(**{**p.devices["iPhone 13"], "viewport": {"width": 402, "height": 874}})
    page = contexte.new_page()
    page.goto(url + "#exercices")
    page.wait_for_function("navigator.serviceWorker.ready.then(() => true)")
    page.reload()
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    filtres = page.locator(".filtres-exercices")
    assert not filtres.evaluate("el => el.open")
    filtres.get_by_text("Filtres", exact=True).click()
    expect(filtres.locator('select[data-filter="media"]')).to_be_visible()
    filtres.get_by_text("Filtres", exact=True).click()
    contexte.set_offline(True)
    page.get_by_label("Rechercher").fill("developpe couche a la barre")
    page.locator('#cartes [data-id="dc"][data-act="exercice"]').click()
    fiche = page.get_by_role("dialog", name="Développé couché")
    expect(fiche.get_by_text("Un média est indisponible.", exact=False)).to_be_visible()
    expect(fiche.get_by_role("heading", name="Exécution")).to_be_visible()
    expect(fiche.get_by_text("Allongez-vous, pieds stables au sol.", exact=False)).to_be_visible()
    contexte.set_offline(False)
    fiche.get_by_role("button", name="Fermer", exact=True).click()
    page.locator('#cartes [data-id="dc"][data-act="exercice"]').click()
    fiche.get_by_role("button", name="Garder ce mouvement hors ligne").click()
    expect(fiche.get_by_role("button", name="Disponible hors ligne")).to_be_disabled()
    taille = page.evaluate("caches.open('cadence-medias-1').then(cache => cache.keys()).then(keys => keys.length)")
    assert taille == 4, taille
    contexte.set_offline(True)
    page.reload()
    page.get_by_label("Rechercher").fill("developpe couche a la barre")
    page.locator('#cartes [data-id="dc"][data-act="exercice"]').click()
    expect(fiche.get_by_role("button", name="Disponible hors ligne")).to_be_disabled()
    fiche.locator("video").evaluate("el => { el.preload = 'metadata'; el.load(); }")
    page.wait_for_function("document.querySelector('dialog video')?.readyState >= 1")
    print("WebKit mobile : repli sans vidéo, téléchargement d’une seule fiche et lecture hors ligne après rechargement.")
    navigateur.close()
