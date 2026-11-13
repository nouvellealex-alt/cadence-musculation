import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { catalogue, modeles } from '../dist/exercices.js';
import { mouvements, dessin } from '../dist/mouvements.js';
import { medias } from '../dist/medias.js';
import { modes } from '../dist/journal.js';

test('le catalogue de 202 fiches conserve les identifiants historiques et les modèles', () => {
  const ids = new Set(catalogue.map(e => e.id));
  assert.equal(catalogue.length, 202);
  assert.equal(ids.size, catalogue.length);
  const historiques = 'dc di pom ec sq pre fen ext st rou curlj hip mol tra tir row rowh mil lat inv cur mar tri dip cr gen'.split(' ');
  for (const id of historiques) assert.ok(ids.has(id), id);
  for (const modele of modeles) {
    assert.ok(modele.exercices.length);
    for (const exercice of modele.exercices) assert.ok(ids.has(exercice.id), exercice.id);
  }
  assert.equal(catalogue.filter(e => e.lieu === 'Salle').length, 148);
  assert.equal(catalogue.filter(e => e.lieu !== 'Salle').length, 54);
});

test('la démonstration de l’extension assise utilise sa propre fiche et précise le dossier',()=>{
  const ex=catalogue.find(x=>x.id==='tri-haut-halteres-assis');
  assert.match(ex.equipement,/banc à dossier/);
  assert.equal(ex.media?.video.id,57);
  assert.equal(ex.media?.video.licence,'CC BY-SA 4.0');
  assert.notEqual(catalogue.find(x=>x.id==='tri-haut-halteres').media?.video?.id,57);
});

test('chaque fiche décrit un mouvement et annonce son mode de suivi',()=>{
  const champs=['nom','muscle','materiel','equipement','conseil','vigilance'];
  const lieux=['Salle','Sans matériel','Avec appui ou banc','Avec barre ou anneaux'];
  const categories=['Musculation','Cardio','Mobilité'];
  const niveaux=['Débutant','Intermédiaire','Avancé'];
  const noms = new Set();
  for (const exercice of catalogue) {
    const { id, nom, lieu, categorie, mesure, niveau, synonymes, secondaires } = exercice;
    assert.match(id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const champ of champs) {
      assert.equal(typeof exercice[champ],'string',id+' · '+champ);
      assert.ok(exercice[champ].trim(),id+' · '+champ);
    }
    assert.ok(lieux.includes(lieu),id);
    assert.ok(categories.includes(categorie),id);
    assert.ok(niveaux.includes(niveau),id);
    assert.ok(Object.hasOwn(modes,mesure),id);
    assert.ok(Array.isArray(synonymes) && synonymes.every(x=>typeof x==='string' && x.trim()),id);
    assert.ok(Array.isArray(secondaires) && secondaires.every(x=>typeof x==='string' && x.trim()),id);
    const cle=nom.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('fr').replace(/[^a-z0-9]/g,'');
    assert.ok(!noms.has(cle),nom);
    noms.add(cle);
  }
});

// Ces chemins peuvent encore être demandés par un catalogue déjà en cache.
const anciensMedias = new Set([
  'cheville-avancee-617.webp', 'goblet-328.webp', 'pre-apercu.webp',
  'rou-halteres-apercu.webp', 'row-84.webp', 'row-90.webp'
]);

test('toutes les fiches associent leurs visuels aux fichiers et attributions attendus', async () => {
  const assets = new Set();
  const credits = await readFile(new URL('../CREDITS-MEDIAS.md', import.meta.url),'utf8');
  const dossier = new URL('../dist/medias/', import.meta.url);
  const dossiers = new Set(await readdir(dossier));

  async function verifierFichier(src, id, format, suffixe) {
    assert.match(src,/^\.\/medias\/[a-z0-9-]+\.(webp|mp4)$/);
    const fichier = src.slice('./medias/'.length);
    assert.ok(fichier.startsWith(id+'-') && fichier.endsWith('.'+format),fichier);
    if (suffixe) assert.equal(fichier,id+suffixe);
    assert.ok(!assets.has(fichier) && !anciensMedias.has(fichier),fichier);
    assert.ok(credits.includes(' | '+'`'+fichier+'`'+' | '),fichier);
    const contenu = await readFile(new URL(fichier,dossier));
    if (format==='mp4') assert.equal(contenu.toString('ascii',4,8),'ftyp',fichier);
    else assert.equal(contenu.toString('ascii',0,4)+contenu.toString('ascii',8,12),'RIFFWEBP',fichier);
    assets.add(fichier);
  }

  const exercices = new Set(catalogue.map(exercice=>exercice.id));
  assert.ok(Object.keys(medias).every(id=>exercices.has(id)));
  assert.ok(Object.keys(mouvements).every(id=>exercices.has(id)));
  for (const exercice of catalogue) {
    const { id, media } = exercice;
    const mouvement = mouvements[id];
    if (media) assert.ok(media.images?.length || media.video,id);
    if (mouvement) {
      const debut=dessin(mouvement,0,true), fin=dessin(mouvement,1,true);
      assert.ok(debut.startsWith('<svg') && fin.startsWith('<svg'),id);
      assert.notEqual(debut,fin,id);
      assert.doesNotMatch(debut+fin,/undefined|NaN/,id);
    }
    if (!media) continue;
    for (const item of [...media.images,...(media.video?[media.video]:[])]) {
      assert.match(item.source,/^https:\/\/wger\.de\/media\//);
      assert.match(item.attribution,/^https:\/\/wger\.de\/api\/v2\/(exerciseimage|video)\/\d+\/$/);
      assert.match(item.licenceUrl,/^https:\/\/creativecommons\.org\/licenses\/by-sa\/[34]\.0\/$/);
      assert.ok(item.auteur && item.modifications);
      assert.ok(item.attribution.endsWith('/'+item.id+'/'),item.src);
      const estVideo=item===media.video;
      await verifierFichier(item.src,id,estVideo?'mp4':'webp');
      if (estVideo) {
        assert.ok(Number.isFinite(item.posterInstant) && item.posterInstant>=0,id);
        await verifierFichier(item.poster,id,'webp','-video-apercu.webp');
      }
    }
  }
  assert.deepEqual(new Set([...assets,...anciensMedias]),dossiers);
});

test('les nouveaux exercices en salle ont deux positions distinctes',()=>{
  const ids='rotation-assise rotation-poulie cr-machine lombaires-machine lombaires-banc adducteurs-machine abducteurs-machine adducteurs-poulie abducteurs-poulie mollets-assis mollets-presse poignets-flexion poignets-extension rowing-machine-poitrine developpe-epaules-machine papillon-machine hip-machine'.split(' ');
  for(const id of ids) {
    const ex=catalogue.find(x=>x.id===id);
    assert.ok(ex?.equipement&&ex?.conseil&&ex?.vigilance,id);
    const mouvement=mouvements[id];
    assert.ok(mouvement,id);
    const a=dessin(mouvement,0,true), b=dessin(mouvement,1,true);
    assert.ok(a.startsWith('<svg')&&b.startsWith('<svg'),id);
    assert.notEqual(a,b,id);
    assert.doesNotMatch(a+b,/undefined|NaN/,id);
  }
});
