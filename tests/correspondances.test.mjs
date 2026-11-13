import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogue } from '../dist/exercices.js';
import { correspondancesImport, formulaireCorrespondances } from '../dist/correspondances.js';

test('identifiant canonique et synonyme exact conservent les cibles et la note',()=>{
  const cibles=[
    {id:'dc',series:3,reps:8},
    {id:'ancien',nom:'DEVELOPPE COUCHE A LA BARRE',series:2,reps:10,repos:120,note:'Pause'}
  ];
  const importation=correspondancesImport(cibles,catalogue);
  assert.deepEqual(importation.demandes,[]);
  assert.deepEqual(importation.appliquer(),[cibles[0],{...cibles[1],id:'dc'}]);
  assert.equal(cibles[1].id,'ancien');
  assert.equal(correspondancesImport([{id:'developpe-couche'}],catalogue).appliquer()[0].id,'dc');
});

test('synonyme ambigu exige un choix partagé par les occurrences de la même référence',()=>{
  const variantes=[{id:'x',nom:'Variante A',materiel:'Barre',synonymes:['Variante']},{id:'y',nom:'Variante B',materiel:'Haltères',synonymes:['Variante']}];
  const cibles=[{id:'ref',nom:'Variante',series:3},{id:'ref',nom:'variante',series:2}];
  const importation=correspondancesImport(cibles,variantes);
  assert.equal(importation.demandes.length,1);
  assert.deepEqual(importation.demandes[0].suggestions.map(x=>x.id),['x','y']);
  assert.throws(()=>importation.appliquer(),/Choisissez un exercice/);
  assert.throws(()=>importation.appliquer(()=>'<invalide>'),/Choisissez un exercice/);
  assert.deepEqual(importation.appliquer(()=> 'y').map(x=>[x.id,x.series]),[['y',3],['y',2]]);
  assert.equal(correspondancesImport([{nom:'Variante',materiel:'Haltères'}],variantes).appliquer()[0].id,'y');
});

test('un identifiant contredit par la variante et une référence inconnue exigent une sélection',()=>{
  const importation=correspondancesImport([{id:'dc',nom:'Développé incliné à la Smith'},{id:'ancien-exercice'}],catalogue);
  assert.deepEqual(importation.demandes.map(x=>x.suggestions.map(y=>y.id)),[['dc','di-smith'],[]]);
  assert.deepEqual(importation.appliquer(i=>i?'tir':'di-smith').map(x=>x.id),['di-smith','tir']);
  assert.match(formulaireCorrespondances(importation.demandes,x=>String(x)), /<option value="">Choisir la bonne variante<\/option>/);
});

test('les définitions personnelles embarquées gardent leur identifiant pour le traitement des collisions',()=>{
  const resultat=correspondancesImport([{id:'dc',nom:'Un exercice personnel'}],catalogue,new Set(['dc']));
  assert.deepEqual(resultat.demandes,[]);
  assert.equal(resultat.appliquer()[0].id,'dc');
  assert.throws(()=>correspondancesImport([null],catalogue),/ni identifiant ni nom/);
});
