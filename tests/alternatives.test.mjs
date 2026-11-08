import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogue } from '../dist/exercices.js';
import { alternatives, poste } from '../dist/alternatives.js';

const trouver = id => catalogue.find(exercice=>exercice.id===id);

test('une poulie prise laisse une alternative au sol pour le crunch',()=>{
  const crunch = {id:'cr-poulie',nom:'Crunch à la poulie',muscle:'Abdominaux',materiel:'Poulie',equipement:'Poulie haute et corde'};
  const options = alternatives(crunch,[...catalogue,crunch],[poste(crunch)]);
  const exercice = options[0]?.exercice;
  assert.equal(exercice?.id,'cr');
  assert.ok(options.every(({exercice})=>exercice.mesure!=='duree'));
});

test('les tirages verticaux compatibles passent avant les tirages horizontaux',()=>{
  const tirage = trouver('tir');
  const options = alternatives(tirage,catalogue,new Set([poste(tirage)]));
  assert.ok(options.length > 0 && options.length <= 4);
  assert.ok(options.every(({exercice})=>poste(exercice)!=='Poulies' && exercice.id!=='tir'));
  assert.ok(['tra','tra-assistees','tractions-supination'].includes(options[0].exercice.id));
});

test('une machine de jambes occupée ne bloque pas toutes les machines',()=>{
  const exercice = trouver('curlj');
  const option = alternatives(exercice,catalogue,[poste(exercice)])[0];
  assert.equal(option.exercice.id,'flexion-jambes-assis');
  assert.notEqual(poste(option.exercice),poste(exercice));
});

test('les dépendances de matériel comptent aussi dans les exclusions',()=>{
  const options = alternatives(trouver('di'),catalogue,['Bancs']);
  assert.ok(options.some(({exercice})=>exercice.id==='pom'));
  assert.ok(options.every(({exercice})=>!/banc/i.test(exercice.equipement)));
});

test('les recherches par muscle écartent un exercice d’une autre catégorie',()=>{
  const exercice = {id:'perso',nom:'Mouvement personnel',muscle:'Mollets',categorie:'Musculation'};
  const options = alternatives(exercice,catalogue);
  assert.ok(options.every(({exercice:candidat})=>candidat.categorie==='Musculation'));
});
