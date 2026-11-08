import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import { catalogue, modeles } from '../dist/exercices.js';
import { mouvements, dessin } from '../dist/mouvements.js';

test('les identifiants historiques et modèles sont utilisables dans un catalogue équilibré', () => {
  const ids = new Set(catalogue.map(e => e.id));
  assert.equal(ids.size, catalogue.length);
  const historiques = 'dc di pom ec sq pre fen ext st rou curlj hip mol tra tir row rowh mil lat inv cur mar tri dip cr gen'.split(' ');
  for (const id of historiques) assert.ok(ids.has(id), id);
  for (const modele of modeles) {
    assert.ok(modele.exercices.length);
    for (const exercice of modele.exercices) assert.ok(ids.has(exercice.id), exercice.id);
  }
  assert.ok(catalogue.filter(e => e.lieu === 'Salle').length >= 15);
  assert.ok(catalogue.filter(e => e.lieu !== 'Salle').length >= 15);
});

test('chaque exercice dispose d’un visuel et chaque fichier tiers a une attribution', async () => {
  const assets = new Set();
  const dossiers = new Set(await readdir(new URL('../dist/medias/', import.meta.url)));
  for (const ex of catalogue) {
    const { media } = ex;
    assert.ok(media?.images?.length || media?.video || mouvements[ex.id], ex.id);
    if (mouvements[ex.id]) {
      assert.ok(dessin(mouvements[ex.id]).startsWith('<svg'));
      assert.ok(dessin(mouvements[ex.id],1).startsWith('<svg'));
    }
    if (!media) continue;
    for (const item of [...media.images,...(media.video?[media.video]:[])]) {
      assert.match(item.src,/^\.\/medias\/[a-z0-9-]+\.(webp|mp4)$/);
      assert.match(item.source,/^https:\/\/wger\.de\/media\//);
      assert.match(item.attribution,/^https:\/\/wger\.de\/api\/v2\/(exerciseimage|video)\/\d+\/$/);
      assert.match(item.licenceUrl,/^https:\/\/creativecommons\.org\/licenses\/by-sa\/[34]\.0\/$/);
      assert.ok(item.auteur && item.modifications);
      const path = new URL(item.src, new URL('../dist/', import.meta.url));
      assert.ok((await stat(path)).size>0);
      assets.add(item.src.split('/').at(-1));
    }
  }
  assert.deepEqual(assets,dossiers);
});

