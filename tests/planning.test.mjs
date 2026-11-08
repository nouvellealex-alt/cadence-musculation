import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogue, modeles } from '../dist/exercices.js';
import { ajouterJours, creerPlanning, debutSemaine, developperProgramme, importerRoutine, jourLocal, programmes, verifierPlanning } from '../dist/planning.js';

const ids = new Set(catalogue.map(exercice=>exercice.id));
const creneau = {id:'p1',jour:'2026-02-28',nom:'Séance',exercices:[{id:'sq',series:3,reps:8,kg:42.5}]};
const planningSauve = {objectif:3,creneaux:[creneau],metadonnees:[{id:'r1',favori:true,dossier:'En salle'}]};

test('Le calendrier travaille sur les jours locaux, même autour des changements d’heure',()=>{
  assert.equal(jourLocal(new Date(2026,0,1,0,15)), '2026-01-01');
  assert.equal(ajouterJours('2026-03-28',2), '2026-03-30');
  assert.equal(ajouterJours('2026-10-25',1), '2026-10-26');
  assert.equal(ajouterJours('2024-02-28',1), '2024-02-29');
  assert.equal(debutSemaine('2026-03-01'), '2026-02-23');
});

test('Les quatre programmes couvrent les dates annoncées et utilisent le catalogue',()=>{
  for (const programme of programmes) {
    let n = 0;
    const creneaux = developperProgramme(programme,'2026-12-28',4,()=>String(++n));
    assert.equal(creneaux.length,programme.seances.length*4);
    assert.equal(new Set(creneaux.map(p=>p.jour)).size,creneaux.length);
    assert.equal(creneaux[0].jour,'2026-12-28');
    assert.equal(creneaux[programme.seances.length].jour,'2027-01-04');
    assert.equal(verifierPlanning({objectif:3,creneaux,metadonnees:[]},ids).creneaux.length,creneaux.length);
  }
  assert.throws(()=>developperProgramme(programmes[0],'2026-02-30',4));
  assert.throws(()=>developperProgramme(programmes[0],'2026-03-02',10));
});

test('Les anciennes sauvegardes restent valides, les créneaux incomplets sont refusés',()=>{
  assert.deepEqual(verifierPlanning(undefined,ids),{objectif:3,creneaux:[],metadonnees:[]});
  assert.equal(verifierPlanning(planningSauve,ids).creneaux[0].exercices[0].kg,42.5);
  assert.throws(()=>verifierPlanning({...planningSauve,objectif:9},ids));
  assert.throws(()=>verifierPlanning({...planningSauve,creneaux:[creneau,creneau]},ids));
  assert.throws(()=>verifierPlanning({...planningSauve,creneaux:[{...creneau,jour:'2026-02-30'}]},ids));
  assert.throws(()=>verifierPlanning({...planningSauve,creneaux:[{...creneau,exercices:[{id:'absent',series:3,reps:8}]}]},ids));
});

test('Une séance liée passe de prévue à en cours puis réalisée',()=>{
  const id='p1';
  const date=jourLocal();
  const etat = {routines:[],seances:[],planning:{...planningSauve,creneaux:[{...creneau,jour:date}]}};
  let demarrage;
  const plan=creerPlanning({etat:()=>etat,modeles,parId:id=>catalogue.find(x=>x.id===id),demarrer:(...args)=>{demarrage=args;}});
  assert.match(plan.rendre(),/planning-label">Prévue/);
  assert.equal(plan.action({dataset:{act:'planning-demarrer',id}}),true);
  assert.equal(demarrage[1],id);
  etat.actif={planId:id};
  assert.match(plan.rendre(),/planning-label">En cours/);
  assert.equal(plan.action({dataset:{act:'planning-retirer-ok',id}}),true);
  assert.equal(etat.planning.creneaux.length,1);
  etat.actif=null;
  etat.seances.push({id:'fait',debut:Date.now(),planId:id});
  assert.match(plan.rendre(),/planning-label done">Réalisée/);
  assert.doesNotMatch(plan.rendre(),/planning-label">Prévue/);
});

test('Un partage emporte les exercices personnels sans écraser ceux du destinataire',()=>{
  const x={id:'7f9e434f-dbd6-464c-82b9-94373ad4e050',nom:'Mon exercice',muscle:'Dos',materiel:'Poulie',conseil:'Contrôler le retour.',mesure:'charge'};
  const fichier={format:'cadence-routine-v1',routine:{nom:'Mon programme',exercices:[{id:x.id,series:3,reps:8,kg:35}]},exercicesPersonnels:[x]};
  const vide=importerRoutine(fichier,[],()=>undefined);
  assert.equal(vide.nouveaux[0].id,x.id);
  assert.equal(vide.routine.exercices[0].kg,35);
  const identique=importerRoutine(fichier,[x],()=>x);
  assert.equal(identique.nouveaux.length,0);
  const conflit={...x,nom:'Mouvement existant'};
  const remappe=importerRoutine(fichier,[conflit],()=>conflit,()=> 'copie');
  assert.equal(remappe.nouveaux[0].nom,x.nom);
  assert.equal(remappe.routine.exercices[0].id,'copie');
  assert.equal(conflit.nom,'Mouvement existant');
  assert.throws(()=>importerRoutine({...fichier,exercicesPersonnels:[x,x]},[],()=>undefined));
  assert.throws(()=>importerRoutine({...fichier,exercicesPersonnels:[{...x,mesure:'inconnue'}]},[],()=>undefined));
});

