const version = 'cadence-20';
const pack = 'cadence-medias-1';
const files = ['./', './index.html', './style.css', './journal.css', './planning.css', './app.js', './donnees.js', './exercices.js', './mouvements.js', './medias.js', './journal.js', './planning.js', './semaine.js', './correspondances.js', './alternatives.js', './poids.js', './machines.js', './marque.svg', './icone-180.png', './icone-192.png', './icone-512.png', './app.webmanifest'];
self.addEventListener('install', event => {
  const requests = files.map(file => new Request(new URL(file,self.registration.scope),{cache:'reload'}));
  event.waitUntil(caches.open(version).then(cache => cache.addAll(requests)));
});
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => /^cadence-\d+$/.test(key) && key !== version).map(key => caches.delete(key))))));

self.addEventListener('message', event => {
  const port = event.ports[0];
  if (event.data !== 'etat-hors-ligne' || !port) return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(version);
      const presentes = new Set((await cache.keys()).map(request => request.url));
      port.postMessage(files.every(file => presentes.has(new URL(file,self.registration.scope).href)));
    } catch {
      port.postMessage(false);
    }
  })());
});

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
  if (!Number.isSafeInteger(debut)||!Number.isSafeInteger(fin)||debut > fin || debut >= blob.size) return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+blob.size}});
  return new Response(blob.slice(debut,fin+1),{status:206,headers:{'Content-Type':blob.type,'Content-Length':String(fin-debut+1),'Content-Range':'bytes '+debut+'-'+fin+'/'+blob.size,'Accept-Ranges':'bytes'}});
}

async function application(request) {
  const cache = await caches.open(version);
  // Les onglets ouverts continuent à utiliser le même lot jusqu'à la relève du worker.
  const url=new URL(request.url);
  url.hash='';
  return await cache.match(url.href,{ignoreSearch:request.mode==='navigate'}) || fetch(request);
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.href.startsWith(new URL('medias/',self.registration.scope).href)) {
    event.respondWith(media(event.request));
    return;
  }
  event.respondWith(application(event.request));
});
