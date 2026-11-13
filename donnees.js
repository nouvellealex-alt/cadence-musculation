import { catalogue } from './exercices.js';
import { mesureValide, mode, types, groupesSuperset, verifierCibleRoutine, volumeSerie, groupeMesure, mesureProgression } from './journal.js';
import { verifierPlanning } from './planning.js';
import { verifierSemaine } from './semaine.js';
import { verifierPoids } from './poids.js';
import { ficheMachineValide, limitePhotos } from './machines.js';
const schema = 1;
let db;

export const uuid = () => crypto.randomUUID();
export const serie = (reps = 8, kg = 0) => ({kg,reps,type:'Travail',faite:false});
export const nouveau = () => ({schema,profil:uuid(),theme:'sombre',repos:90,actif:null,seances:[],routines:[],persos:[],poids:[]});

export async function ouvrir() {
  const request = indexedDB.open('cadence-musculation', 1);
  db = await new Promise((resolve,reject)=>{
    request.onupgradeneeded = () => request.result.createObjectStore('carnet');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error('Base ouverte dans une ancienne version.'));
  });
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('carnet','readwrite');
    const table = tx.objectStore('carnet');
    const request = table.get('etat');
    let etat;
    request.onsuccess = () => {
      etat = request.result;
      if (!etat) { etat = nouveau(); table.put(etat,'etat'); }
    };
    tx.oncomplete = () => resolve(etat);
    tx.onabort = () => reject(tx.error);
  });
}

export function ecrire(etat, revision) {
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('carnet','readwrite');
    const table = tx.objectStore('carnet');
    const request = table.get('etat');
    let conflit = false;
    request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== revision) {
        conflit = true;
        tx.abort();
      } else table.put({...etat,revision:revision+1},'etat');
    };
    tx.oncomplete = () => resolve(revision+1);
    tx.onabort = () => reject(Error(conflit ? 'Le carnet a changé dans un autre onglet. Rechargez cette page.' : 'Écriture impossible.'));
  });
}

const texte = (s,max=120) => typeof s === 'string' && s.length <= max;
const nom = s => texte(s) && s.trim().length > 0;
const nombre = (n,min,max) => Number.isFinite(n) && n >= min && n <= max;
const entier = (n,min,max) => Number.isInteger(n) && nombre(n,min,max);
const liste = (a,max,test) => Array.isArray(a) && a.length <= max && a.every(test);
const uniques = a => new Set(a.map(x=>x.id)).size === a.length;
const date = t => entier(t,0,8640000000000000);

export function verifier(a) {
  const s = (x, mesure) => x && nombre(x.kg,0,2000) && entier(x.reps,1,1000) && typeof x.faite === 'boolean' && types.includes(x.type) &&
    (x.rpe === undefined || (nombre(x.rpe,1,10) && Number.isInteger(x.rpe*2))) &&
    (x.secondes === undefined && !['duree','distance'].includes(mesure) || entier(x.secondes,1,86400)) &&
    (x.metres === undefined && mesure !== 'distance' || nombre(x.metres,1,1000000));
  const ex = e => e && nom(e.id) && nom(e.nom) && nom(e.muscle) && nom(e.materiel) && texte(e.conseil,1000) &&
    (e.mesure === undefined || mesureValide(e.mesure));
  const m = x => ex(x) && liste(x.series,100,y=>s(y,mode(x))) && x.series.length > 0 &&
    (x.repsCible === undefined || (entier(x.repsCible,1,1000) && entier(x.repsMax,x.repsCible,1000) && entier(x.reposMax,0,600))) &&
    (x.note === undefined || texte(x.note,1000)) &&
    (x.repos === undefined || entier(x.repos,0,600)) &&
    (x.superset === undefined || groupesSuperset.includes(x.superset));
  const seance = x => x && nom(x.id) && texte(x.nom) && texte(x.notes,3000) && date(x.debut) &&
    (x.semaineJour === undefined || entier(x.semaineJour,0,6)) &&
    (x.guideIndex === undefined || entier(x.guideIndex,0,59)) &&
    (x.reposJeton === undefined || nom(x.reposJeton)) &&
    (x.postesBloques === undefined || liste(x.postesBloques,100,nom)) &&
    (x.planId === undefined || nom(x.planId)) && liste(x.exercices,60,m);
  const ids = new Set(catalogue.map(x=>x.id));
  const routine = x => x && nom(x.id) && nom(x.nom) && liste(x.exercices,60,e=>verifierCibleRoutine(e,ids)) && x.exercices.length > 0;
  const invalide = () => { throw Error('Cette sauvegarde est incomplète ou incompatible.'); };
  if (!a || a.schema !== schema || !nom(a.profil) || !['clair','sombre'].includes(a.theme) || !entier(a.repos,0,600) || !liste(a.persos,1000,x=>ex(x)&&ficheMachineValide(x)) || !uniques(a.persos) || !limitePhotos(a.persos)) invalide();
  for (const e of a.persos) {
    if (ids.has(e.id)) invalide();
    ids.add(e.id);
  }
  if (!liste(a.routines,1000,routine) || !uniques(a.routines) || !liste(a.seances,20000,x=>seance(x) && date(x.fin) && x.fin >= x.debut && nom(x.nom) && x.exercices.some(e=>e.series.some(y=>y.faite))) || !uniques(a.seances) || (a.actif !== null && !(seance(a.actif) && date(a.actif.reposFin)))) invalide();
  const favorisEx = a.favorisEx === undefined ? [] : a.favorisEx;
  if (!liste(favorisEx,ids.size,id=>ids.has(id)) || new Set(favorisEx).size !== favorisEx.length) invalide();
  const planning = verifierPlanning(a.planning,ids);
  const semaine = verifierSemaine(a.semaine,ids);
  const {profil,theme,repos,actif,seances,routines,persos} = a;
  const poids=verifierPoids(a.poids);
  const derniereSauvegarde=date(a.derniereSauvegarde)?a.derniereSauvegarde:undefined;
  return {schema,profil,theme,repos,actif,seances,routines,persos,favorisEx,planning,semaine,poids,derniereSauvegarde};
}

const encoder = new TextEncoder();
export const tailleSauvegardeMax = 96_000_000;
const codesHex=Array.from({length:256},(_,n)=>n.toString(16).padStart(2,'0'));
function hex(bytes) {
  const blocs=[];
  for(let i=0;i<bytes.length;i+=8192) {
    const bloc=[];
    for(let j=i;j<Math.min(i+8192,bytes.length);j++) bloc.push(codesHex[bytes[j]]);
    blocs.push(bloc.join(''));
  }
  return blocs.join('');
}
function dehex(h) {
  const valeur=c=>c<=57?c-48:c-87;
  const bytes=new Uint8Array(h.length/2);
  for(let i=0;i<bytes.length;i++) bytes[i]=valeur(h.charCodeAt(2*i))*16+valeur(h.charCodeAt(2*i+1));
  return bytes;
}
const contexte = encoder.encode('Cadence sauvegarde v1');
export async function chiffrer(etat) {
  const contenu=encoder.encode(JSON.stringify(etat));
  if(2*contenu.length+256>tailleSauvegardeMax) throw Error('Ce carnet dépasse la taille de la sauvegarde chiffrée. Essaie l’export JSON sans photos.');
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cle = await crypto.subtle.importKey('raw',secret,'AES-GCM',false,['encrypt']);
  const octets = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:contexte},cle,contenu);
  return {code:hex(secret).match(/.{8}/g).join('-'),fichier:{format:'cadence-chiffre-v1',iv:hex(iv),contenu:hex(new Uint8Array(octets))}};
}
export async function dechiffrer(fichier, code) {
  const secret = code.replace(/[-\s]/g,'').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(secret) || !/^[a-f0-9]{24}$/.test(fichier.iv) || typeof fichier.contenu !== 'string' || fichier.contenu.length < 32 || fichier.contenu.length % 2 !== 0 || /[^a-f0-9]/.test(fichier.contenu)) throw Error('Code ou fichier chiffré invalide.');
  try {
    const cle = await crypto.subtle.importKey('raw',dehex(secret),'AES-GCM',false,['decrypt']);
    const octets = await crypto.subtle.decrypt({name:'AES-GCM',iv:dehex(fichier.iv),additionalData:contexte},cle,dehex(fichier.contenu));
    return JSON.parse(new TextDecoder().decode(octets));
  } catch { throw Error('Code incorrect ou fichier altéré.'); }
}

export const volume = s => s.exercices.reduce((total,e)=>total+e.series.reduce((v,x)=>v+volumeSerie(e,x),0),0);
export function records(seances) {
  const resultat = new Map();
  for (const seance of seances) for (const e of seance.exercices) for (const s of e.series) {
    if (!s.faite || s.type === 'Échauffement') continue;
    const cle = groupeMesure(e);
    const mesure = mode(e);
    const valeur = mesureProgression(e,[s]);
    const r = resultat.get(cle) ?? {id:e.id,nom:e.nom,mesure,meilleur:valeur,reps:0,rm:0};
    r.meilleur = mesure === 'assistance' ? Math.min(r.meilleur,valeur) : Math.max(r.meilleur,valeur);
    r.reps = Math.max(r.reps,s.reps);
    if (mesure === 'charge' && s.reps <= 12) r.rm = Math.max(r.rm,s.reps === 1 ? s.kg : s.kg*(1+s.reps/30));
    resultat.set(cle,r);
  }
  return [...resultat.values()].sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
}
