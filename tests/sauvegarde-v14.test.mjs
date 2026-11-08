import test from 'node:test';
import assert from 'node:assert/strict';
import { nouveau, verifier, chiffrer, dechiffrer } from '../dist/donnees.js';
import { sauvegardePhotos } from '../dist/machines.js';

test('le poids et les machines survivent au chiffrement avec ou sans les photos',async()=>{
  const photo='data:image/jpeg;base64,abcd';
  const source={...nouveau(),poids:[{date:'2026-10-29',kg:73.5}],persos:[
    {id:'machine-test',nom:'Presse',muscle:'Quadriceps',materiel:'Machine',conseil:'',machine:true,zone:'Étage 2',photo}
  ]};
  for(const inclure of [false,true]) {
    const {code,fichier}=await chiffrer(sauvegardePhotos(source,inclure));
    const restaure=verifier(await dechiffrer(fichier,code));
    assert.deepEqual(restaure.poids,source.poids);
    assert.equal(restaure.persos[0].zone,'Étage 2');
    assert.equal(restaure.persos[0].photo,inclure?photo:undefined);
    await assert.rejects(dechiffrer(fichier,'0'.repeat(64)));
  }
});

test('une photo injectée dans un exercice de séance est retirée des exports sans photos',()=>{
  const source={...nouveau(),actif:{exercices:[{photo:'personnelle'}]},seances:[{exercices:[{photo:'personnelle'}]}]};
  const resultat=sauvegardePhotos(source,false);
  assert.equal(resultat.actif.exercices[0].photo,undefined);
  assert.equal(resultat.seances[0].exercices[0].photo,undefined);
  assert.equal(source.actif.exercices[0].photo,'personnelle');
});
