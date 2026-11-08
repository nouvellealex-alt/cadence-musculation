const version = 'cadence-7';
const pack = 'cadence-medias-1';
const files = ['./', './index.html', './style.css', './journal.css', './planning.css', './app.js', './donnees.js', './exercices.js', './mouvements.js', './medias.js', './journal.js', './planning.js', './semaine.js', './alternatives.js', './marque.svg', './app.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(version).then(cache => cache.addAll(files))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => /^cadence-\d+$/.test(key) && key !== version).map(key => caches.delete(key))))));

async function media(request) {
  const cache = await caches.open(pack);
  const saved = await cache.match(request.url);
  if (!saved) return fetch(request);
  const range = request.headers.get('range');
  if (!range) return saved;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return fetch(request);
  const blob = await saved.blob();
  const debut = match[1] ? Number(match[1]) : Math.max(0,blob.size-Number(match[2]));
  const fin = match[1] && match[2] ? Math.min(blob.size-1,Number(match[2])) : blob.size-1;
  if (debut > fin || debut >= blob.size) return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+blob.size}});
  return new Response(blob.slice(debut,fin+1),{status:206,headers:{'Content-Type':blob.type,'Content-Length':String(fin-debut+1),'Content-Range':'bytes '+debut+'-'+fin+'/'+blob.size,'Accept-Ranges':'bytes'}});
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.href.startsWith(new URL('medias/',self.registration.scope).href)) {
    event.respondWith(media(event.request));
    return;
  }
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(version);
    return await cache.match(event.request) || (event.request.mode === 'navigate' ? await cache.match('./') : Response.error());
  }));
});
