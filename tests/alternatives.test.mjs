import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogue } from '../dist/exercices.js';
import { alternatives, poste, posteDisponible } from '../dist/alternatives.js';

const trouver = id => catalogue.find(exercice=>exercice.id===id);

test('une poulie prise laisse une alternative au sol pour le crunch',()=>{
  const crunch = {id:'cr-poulie',nom:'Crunch à la poulie',muscle:'Abdominaux',materiel:'Poulie',equipement:'Poulie haute et corde'};
  const options = alternatives(crunch,[...catalogue,crunch],[poste(crunch)]);
  assert.ok(options.some(({exercice})=>exercice.id==='cr'));
  assert.equal(options[0]?.exercice.id,'cr-machine');
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
  const options = alternatives(exercice,catalogue,[poste(exercice)]);
  assert.ok(options.some(x=>x.exercice.id==='flexion-jambes-assis'));
  assert.ok(options.some(x=>x.exercice.id==='flexion-jambes-debout'));
  assert.ok(options.every(x=>poste(x.exercice)!==poste(exercice)));
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

test('en salle, le geste passe avant le type de lieu',()=>{
  const tirage=trouver('tir-neutre');
  const options=alternatives(tirage,catalogue,[poste(tirage)],true);
  const premierHorizontal=options.findIndex(x=>x.raison.includes('variante différente'));
  assert.ok(options.some(x=>x.exercice.id==='tra'));
  if(premierHorizontal!==-1) assert.ok(options.slice(premierHorizontal).every(x=>!x.raison.includes('même geste')));
});

test('une donnée de matériel héritée mal formée ne casse pas les substitutions',()=>{
  const ex={id:'perso',nom:'Poussée personnelle',muscle:'Pectoraux',materiel:'Barre',equipement:123};
  assert.equal(poste(ex),'Barre');
  assert.doesNotThrow(()=>alternatives(ex,catalogue,['Barre']));
});


test('la rotation à la poulie reste une variante de rotation et exclut les crunchs',()=>{
  const exercice=trouver('rotation-assise');
  const options=alternatives(exercice,catalogue,[poste(exercice)]);
  assert.deepEqual(new Set(options.map(x=>x.exercice.id)),new Set(['rotation-poulie','rotation-medicinal']));
  assert.ok(options.every(x=>x.raison.includes('variante différente')));
});

test('l’adduction et l’abduction ne se remplacent pas',()=>{
  for(const [machine,poulie,sol] of [['adducteurs-machine','adducteurs-poulie','adduction-cote'],['abducteurs-machine','abducteurs-poulie','abduction-cote']]) {
    const exercice=trouver(machine);
    const options=alternatives(exercice,catalogue,[poste(exercice)]);
    assert.ok(options.some(x=>x.exercice.id===poulie));
    assert.ok(options.some(x=>x.exercice.id===sol));
    assert.ok(options.every(x=>x.exercice.muscle===exercice.muscle));
  }
});

test('flexion et extension du poignet ne sont pas des substitutions',()=>{
  assert.deepEqual(alternatives(trouver('poignets-flexion'),catalogue),[]);
  assert.deepEqual(alternatives(trouver('poignets-extension'),catalogue),[]);
});

test('une presse occupée exclut aussi les mollets à la presse',()=>{
  const pre=trouver('pre');
  const mol=trouver('mollets-presse');
  assert.equal(poste(pre),poste(mol));
  assert.ok(alternatives(mol,catalogue,[poste(pre)]).some(x=>x.exercice.id==='mol'));
});

test('le rowing aux haltères dispose d’un tirage à la machine sans banc',()=>{
  const options=alternatives(trouver('rowing-poitrine'),catalogue,['Bancs','Poulies','Rack et barre','Barre']);
  assert.equal(options[0]?.exercice.id,'rowing-machine-poitrine');
  assert.match(options[0].raison,/Tirage horizontal/);
});


test('les nouveaux développés inclinés proposent des variantes qui conservent l’angle de poussée',()=>{
  const incline=trouver('incline-machine');
  const options=alternatives(incline,catalogue,[poste(incline)]);
  for(const id of ['di','di-smith','incline-barre']) {
    const variante=options.find(x=>x.exercice.id===id);
    assert.ok(variante,id);
    assert.match(variante.raison,/même geste/);
  }
  assert.ok(options.filter(x=>x.raison.includes('même geste')).every(x=>x.exercice.id!=='pompes-declinees'));
});

test('un pupitre occupé exclut les deux flexions avec poids libres et laisse la machine',()=>{
  const pupitre=new Set(['Pupitre à biceps']);
  assert.ok(!posteDisponible(trouver('flexion-pupitre-ez'),pupitre));
  assert.ok(!posteDisponible(trouver('flexion-pupitre-halteres'),pupitre));
  const options=alternatives(trouver('flexion-pupitre-ez'),catalogue,pupitre);
  assert.equal(options[0]?.exercice.id,'flexion-biceps-machine');
});

test('les machines partagées restent exclues quelle que soit la variante',()=>{
  const couples=[['pre','presse-unilaterale'],['tra-assistees','dips-assistes'],['ext','extension-jambes-unilaterale'],['course-tapis','marche-inclinee-tapis']];
  for(const [id,autre] of couples) {
    const bloquer=poste(trouver(id));
    assert.ok(bloquer,id);
    assert.ok(!posteDisponible(trouver(autre),new Set([bloquer])),autre);
  }
});

test('la mobilité et le cardio ne remplacent pas une séance de musculation',()=>{
  for(const id of ['rameur','chat-vache','corde-sauts','course-tapis']) {
    const exercice=trouver(id);
    assert.ok(alternatives(exercice,catalogue).every(x=>x.exercice.categorie===exercice.categorie));
  }
  assert.ok(alternatives(trouver('rameur'),catalogue).every(x=>x.exercice.id!=='rowing-poulie'));
});
