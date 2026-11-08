import { mouvements, dessin } from './mouvements.js';
import { catalogue, modeles } from './exercices.js';
import { creerPlanning, jourLocal, ajouterJours } from './planning.js';
import { creerSemaine, reposTexte, lireImport, collageImport } from './semaine.js';
import { alternatives, poste, posteDisponible, postesPossibles } from './alternatives.js';
import { rendrePoids, ajouterPoids, supprimerPoids } from './poids.js';
import { photoValide, preparerPhoto, limitePhotos, sauvegardePhotos } from './machines.js';
import { ouvrir, ecrire, nouveau, verifier, uuid, chiffrer, dechiffrer, volume, records, tailleSauvegardeMax } from './donnees.js';
import { modes, mode, types, champsSerie, effort, groupesSuperset, initialiserSerie, decrireSerie, mesureProgression, indicateurs, volumeSerie, groupeMesure, reposApres, disques, csvSeances } from './journal.js';

const $ = (s, root=document) => root.querySelector(s);
const vue = $('#vue');
const dialogue = $('#dialogue');
const voies = {
  accueil:['Accueil','M3 11l9-8 9 8v10H3z M9 21v-7h6v7'],
  semaine:['Ma semaine','M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M9 15l2 2 4-4'],
  seance:['Séance','M3 12h18M6 6v12m12-12v12M3 9v6m18-6v6'],
  routines:['Routines','M4 5h16M4 12h16M4 19h16'],
  planning:['Planning','M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h3 M13 17h3'],
  exercices:['Exercices','M3 4h8v7H3z M13 4h8v7h-8z M3 13h8v7H3z M13 13h8v7h-8z'],
  stats:['Progression','M3 3v18h18M7 15l4-5 4 2 5-7'],
  poids:['Poids','M4 7h16v14H4z M8 12a4 4 0 0 1 8 0 M12 12l2-2'],
  donnees:['Données','M4 7h16v14H4z M3 3h18v4H3z M9 12h6']
};
const svg = (path) => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>';
const e = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const fr = new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2});
const date = new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium'});
const nombre = n => fr.format(n);
const bout = (label,act,attrs='',classe='') => '<button type="button" class="'+classe+'" data-act="'+act+'" '+attrs+'>'+label+'</button>';
const titre = (tag,nom,description) => '<header><div class="eyebrow">'+tag+'</div><h1>'+nom+'</h1><p class="muted">'+description+'</p></header>';
const vide = texte => '<p class="empty">'+texte+'</p>';
const tous = () => [...catalogue,...etat.persos];
const parId = id => tous().find(x=>x.id===id);
const choix = (a,v) => a.map(x=>'<option'+(x===v?' selected':'')+'>'+e(x)+'</option>').join('');
const temps = ms => {const s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const terminees = s => s.exercices.flatMap(x=>x.series).filter(x=>x.faite).length;
const chemin = () => Object.hasOwn(voies,location.hash.slice(1)) ? location.hash.slice(1) : etat?.semaine?.active?'semaine':'accueil';

let etat, revision, sauvegarde = Promise.resolve(), verrou = false, flash, periode = '30';
let progressionEx = '';
let progressionIndicateur = 'principal';
let filtre = {nom:'',muscle:'',materiel:'',lieu:'',categorie:'',collection:''};
let limiteCatalogue = 30;
let guideTous=false;
let editionPoids='';
let etatHorsLigne='Préparation du carnet hors ligne…';
let ecranActif=false;
let verrouEcran=null;
function message(t) {
  $('#message').textContent = t;
  clearTimeout(flash);
  flash = setTimeout(()=>{$('#message').textContent='';},5500);
}
function sauver() {
  const copie = structuredClone(etat);
  sauvegarde = sauvegarde.then(async()=>{
    if (!verrou) revision = await ecrire(copie,revision);
  }).catch(err=>{
    verrou = true;
    message(err.message);
  });
  return sauvegarde;
}
function aller(route) {
  if (chemin() === route) afficher();
  else location.hash=route;
}
function modal(nom, contenu) {
  if (dialogue.open) dialogue.close();
  dialogue.innerHTML='<div class="row spread"><h2 id="titre-dialogue">'+nom+'</h2>'+bout('Fermer','fermer')+'</div><hr class="line">'+contenu;
  dialogue.setAttribute('aria-labelledby','titre-dialogue');
  dialogue.showModal();
}
function choixPourSeance(index = null, station) {
  const remplace = index !== null;
  const indisponible=station!==undefined;
  const s=etat.actif;
  const actuel=remplace?s.exercices[index]:null;
  const bloques=new Set([...(s?.postesBloques??[]),station].filter(Boolean));
  modal(remplace?'Remplacer un exercice':'Ajouter un exercice','<label>Rechercher dans la bibliothèque<input type="search" id="cherche-ajout" placeholder="Nom, muscle ou matériel" autofocus></label><div id="resultats-ajout" class="stack section"></div>');
  const champ = $('#cherche-ajout');
  const rendre = () => {
    const trouve = chercherExercices(champ.value,{salle:s?.semaineJour!==undefined}).filter(x=>(!actuel||x.id!==actuel.id)&&(!indisponible||posteDisponible(x,bloques))).slice(0,40);
    const action = indisponible?'indisponible-ok':remplace?'remplacer-ex-ok':'ex-vers-seance';
    const libelle = remplace?'Choisir':'Ajouter';
    $('#resultats-ajout').innerHTML = trouve.map(x=>'<div class="row spread"><div><strong>'+e(x.nom)+'</strong><br><small>'+e(x.muscle)+'</small></div>'+bout(libelle,action,'data-id="'+e(x.id)+'" data-i="'+e(index)+'" data-poste="'+e(station)+'" aria-label="'+libelle+' '+e(x.nom)+'"')+'</div>').join('') || vide('Aucun exercice correspondant.');
  };
  champ.addEventListener('input',rendre);
  rendre();
}
function choixIndisponible(index, posteChoisi) {
  const s=etat.actif;
  const x=s.exercices[index];
  const ex=parId(x.id)??x;
  const postes=postesPossibles(ex);
  const station=postes.includes(posteChoisi)?posteChoisi:poste(ex);
  const proposes=alternatives(ex,tous(),[...(s.postesBloques??[]),station].filter(Boolean),s.semaineJour!==undefined);
  const attr='data-i="'+index+'" data-poste="'+e(station)+'"';
  const choisir=postes.length>1?'<details class="details"><summary>Un autre équipement est pris ?</summary><div class="row section">'+postes.filter(p=>p!==station).map(p=>bout(e(p),'indisponible-poste','data-i="'+index+'" data-poste="'+e(p)+'"')).join('')+'</div></details>':'';
  modal('Machine indisponible','<p class="muted">'+(station?'Poste à éviter pour cette séance · '+e(station):'Choisissez un mouvement compatible avec votre séance.')+'</p>'+
    choisir+'<div class="stack section">'+(proposes.map(({exercice,raison})=>'<article class="panel semaine-exercice"><div class="semaine-miniature">'+miniatureEx(exercice,mouvements[exercice.id])+'</div><div><h3>'+e(exercice.nom)+'</h3><p class="muted">'+e(exercice.equipement||exercice.materiel)+' · '+e(raison)+'</p></div>'+bout('Choisir','indisponible-ok','data-id="'+e(exercice.id)+'" '+attr+' aria-label="Choisir '+e(exercice.nom)+'"')+'</article>').join('')||vide('Aucune alternative suffisamment proche dans le catalogue.'))+'</div>'+
    '<div class="row">'+bout('Chercher un autre exercice','indisponible-chercher',attr)+bout('Fermer sans changer','fermer')+'</div>');
}
function choixEx(id='', requete='') {
  const matches=chercherExercices(requete);
  const choisi=parId(id);
  if(choisi && !matches.some(x=>x.id===id)) matches.unshift(choisi);
  return matches.map(x=>'<option value="'+e(x.id)+'" '+(id===x.id?'selected':'')+'>'+e(x.nom)+'</option>').join('');
}
function fiche(r) {
  return '<article class="panel"><h3>'+e(r.nom)+'</h3><p class="muted">'+r.exercices.map(x=>e(parId(x.id)?.nom)+' · '+x.series+' × '+x.reps).join('<br>')+'</p><div class="row">'+bout('Démarrer','routine','data-id="'+e(r.id)+'"','primary')+bout('Modifier','editer-routine','data-id="'+e(r.id)+'"')+bout('Dupliquer','dupliquer-routine','data-id="'+e(r.id)+'"')+(etat.routines.includes(r)?bout('Supprimer','supprimer-routine','data-id="'+e(r.id)+'"','danger'):'')+planning.boutonsRoutine(r)+'</div></article>';
}
function ligneSeance(s) {
  return '<article class="panel row spread"><div><h3>'+e(s.nom)+'</h3><small>'+date.format(s.debut)+' · '+terminees(s)+' séries · '+nombre(volume(s))+' kg</small></div>'+bout('Consulter','details','data-id="'+e(s.id)+'"')+'</article>';
}
function accueil() {
  const semaine = new Date();
  semaine.setHours(0,0,0,0);
  semaine.setDate(semaine.getDate()-(semaine.getDay()+6)%7);
  const jours=Array.from({length:7},(_,i)=>ajouterJours(jourLocal(semaine),i));
  const ss = etat.seances.filter(s=>jours.includes(jourLocal(new Date(s.debut))));
  const cible=etat.planning?.objectif??3;
  const comptes=new Map();
  for (const s of ss) {
    const jour=jourLocal(new Date(s.debut));
    comptes.set(jour,(comptes.get(jour)??0)+1);
  }
  const chiffres = [['Séances',ss.length],['Séries validées',ss.reduce((n,s)=>n+terminees(s),0)],['Volume soulevé',nombre(ss.reduce((n,s)=>n+volume(s),0))+' kg']];
  return '<section class="panel hero"><div class="eyebrow">CARNET DE MUSCULATION · SANS COMPTE</div><h1>Tableau de bord</h1><p>Notez vos séries, planifiez votre semaine et suivez votre progression.</p><div class="row">'+(etat.actif?bout('Reprendre la séance','ouvrir-seance','','primary'):bout('＋ Démarrer une séance','demarrer','','primary'))+'<a class="btn" href="#routines">Mes routines</a></div></section>'+
  '<section class="panel section semaine-cadence"><div class="row spread"><div><div class="eyebrow">OBJECTIF HEBDOMADAIRE</div><h2>'+ss.length+' / '+cible+' séances réalisées</h2></div><a class="btn" href="#planning">Ouvrir le planning</a></div><ol>'+jours.map((jour,i)=>{
    const fait=comptes.get(jour)??0;
    const estAujourdhui=jour===jourLocal();
    const nom=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][i];
    return '<li class="'+(fait?'fait':'')+'" '+(estAujourdhui?'aria-current="date"':'')+'><span>'+nom.slice(0,3)+'.</span><strong aria-label="'+nom+' · '+fait+' séance'+(fait===1?'':'s')+'">'+(fait||'–')+'</strong></li>';
  }).join('')+'</ol></section><div class="grid metrics">'+chiffres.map(([a,b])=>'<article class="panel metric"><small>'+a+'</small><strong>'+b+'</strong></article>').join('')+'</div><div class="grid two"><section><h2 class="section">Dernières séances</h2><div class="stack">'+(etat.seances.slice(0,4).map(ligneSeance).join('')||vide('Aucune séance enregistrée.'))+'</div></section><section><h2 class="section">Vos routines</h2><div class="stack">'+(etat.routines.length?etat.routines.slice(0,2):modeles.slice(0,1)).map(fiche).join('')+'</div></section></div>';
}
function precedent(exercice) {
  return etat.seances.flatMap(s=>s.exercices).find(x=>x.id===exercice.id && mode(x)===mode(exercice) && x.series.some(y=>y.faite));
}
function inputSerie(champ, valeur, attrs, libelle, requis=true) {
  const [, , , min, max, pas] = champ;
  if(champ[0]==='kg'&&attrs.includes('data-field="kg"')) {
    return '<input '+attrs+' aria-label="'+e(libelle)+'" type="text" inputmode="decimal" data-charge-decimale maxlength="10" pattern="[0-9]+([.,][0-9]+)?" value="'+e(valeur)+'" required>';
  }
  return '<input '+attrs+' aria-label="'+e(libelle)+'" type="number" inputmode="'+(pas===1?'numeric':'decimal')+'" min="'+min+'" max="'+max+'" step="'+pas+'" value="'+e(valeur)+'" '+(requis?'required':'')+'>';
}
function carteJournal(x,i) {
  const derniere = precedent(x);
  const seriesPrecedentes=derniere?.series.filter(y=>y.faite)??[];
  const champs = champsSerie(x);
  const numero = 'data-i="'+i+'"';
  const guide=etat.actif.semaineJour!==undefined;
  const parametres = '<details class="details exercice-options"><summary>Réglages de l’exercice</summary><div class="row filters section"><label>Mode de suivi<select data-mode-i="'+i+'" '+(x.series.some(y=>y.faite)?'disabled':'')+'>'+Object.entries(modes).map(([k,v])=>'<option value="'+k+'" '+(k===mode(x)?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Repos (s)<input '+numero+' data-field="repos" type="number" min="0" max="600" step="1" placeholder="'+etat.repos+' par défaut" value="'+e(x.repos)+'"></label><label>Supersérie<select '+numero+' data-field="superset"><option value="">Aucune</option>'+choix(groupesSuperset,x.superset)+'</select></label></div><label>Note de l’exercice<textarea '+numero+' data-field="note" maxlength="1000" rows="2">'+e(x.note)+'</textarea></label></details>';
  const gestion=bout('↑','monter-ex',numero+' aria-label="Monter '+e(x.nom)+'"'+(i===0?' disabled':''))+bout('↓','descendre-ex',numero+' aria-label="Descendre '+e(x.nom)+'"'+(i===etat.actif.exercices.length-1?' disabled':''))+bout('Remplacer','remplacer-ex',numero+' aria-label="Remplacer '+e(x.nom)+'"')+bout('Retirer','retirer-ex',numero+' aria-label="Retirer '+e(x.nom)+'"');
  const passer=guide?bout('Passer pour l’instant','guide-passer',numero):'';
  const actions='<div class="row">'+bout('Voir le mouvement','exercice','data-id="'+e(x.id)+'" data-context="seance"')+bout('Machine indisponible','indisponible',numero+' aria-label="Machine indisponible : '+e(x.nom)+'"')+(guide?'':gestion)+'</div>'+
    (guide?'<details class="details"><summary>Organiser cet exercice</summary><div class="row section">'+gestion+'</div></details>':'');
  const lignes = x.series.map((y,j)=>{
    const at = numero+' data-j="'+j+'"';
    const mesure = champs.map(champ=>inputSerie(champ,champ[0]==='kg'&&!y.faite&&y.kg===0?'':y[champ[0]],at+' data-field="'+champ[0]+'"',champ[2]+' de la série '+(j+1))).join('');
    const ajuster=guide&&mode(x)==='charge'?'<div class="row charge-ajustement" '+(y.faite?'hidden':'')+'>'+
      bout('−2,5 kg','ajuster-charge',at+' data-delta="-2.5" aria-label="Retirer 2,5 kg de la série '+(j+1)+'"')+
      bout('+2,5 kg','ajuster-charge',at+' data-delta="2.5" aria-label="Ajouter 2,5 kg à la série '+(j+1)+'"')+'</div>':'';
    const precedent=seriesPrecedentes[j];
    const copie = precedent?bout('Précédent · '+e(decrireSerie(x,precedent,nombre)),'reprendre-serie',at+' aria-label="Reprendre les valeurs de la série '+(j+1)+'"'+(y.faite?' hidden':''),'serie-precedente'):'';
    return '<div class="bloc-serie" '+at+'><div class="series journal-serie '+(y.faite?'done':'')+'" data-colonnes="'+champs.length+'"><span>'+(j+1)+'</span>'+mesure+
      bout('✓','valider',at+' aria-label="Valider la série '+(j+1)+'" aria-pressed="'+y.faite+'"','check')+'</div>'+ajuster+copie+
      '<details class="details serie-options"><summary>Options de la série '+(j+1)+(y.type==='Travail'?'':' · '+y.type)+'</summary><div class="row filters"><label>Type<select '+at+' data-field="type" aria-label="Type de la série '+(j+1)+'">'+choix(types,y.type)+'</select></label><label>Effort perçu (RPE)'+inputSerie(effort,y.rpe,at+' data-field="rpe"','RPE de la série '+(j+1),false)+'</label></div><div class="row">'+bout('↑','monter-serie',at+' aria-label="Monter la série '+(j+1)+'"'+(j===0?' disabled':''))+bout('↓','descendre-serie',at+' aria-label="Descendre la série '+(j+1)+'"'+(j===x.series.length-1?' disabled':''))+bout('Supprimer','retirer-serie',at+' aria-label="Supprimer la série '+(j+1)+'"')+'</div></details></div>';
  }).join('');
  const historique = !guide&&derniere ? ' · Précédent : '+seriesPrecedentes.slice(0,4).map(y=>decrireSerie(x,y,nombre)).join(' / ') : '';
  const repos=x.repos??etat.repos;
  const objectif=x.repsCible!==undefined?'<p class="journal-cible"><span class="tag">'+x.series.length+' × '+x.repsCible+(x.repsCible===x.repsMax?'':'–'+x.repsMax)+' rép.</span> <span class="tag">Repos '+e(reposTexte({repos,reposMax:Math.max(repos,x.reposMax)}))+'</span></p>':'';
  const materiel=parId(x.id)?.equipement??x.materiel;
  return '<article class="panel journal-exercice" '+numero+'><div class="row spread"><div><h2>'+e(x.nom)+'</h2><small>'+e(materiel)+historique+'</small></div>'+(x.superset?'<span class="tag">Supersérie '+x.superset+'</span>':'')+'</div>'+objectif+(guide&&x.note?'<p class="muted">'+e(x.note)+'</p>':'')+passer+(guide?'':actions+parametres)+
    '<div class="series journal-serie series-head" data-colonnes="'+champs.length+'"><span>N°</span>'+champs.map(champ=>'<span>'+champ[1]+'</span>').join('')+'<span>Validée</span></div>'+lignes+
    '<div class="row spread">'+bout('＋ Ajouter une série','ajouter-serie',numero)+(guide&&i<etat.actif.exercices.length-1?bout('Exercice suivant →','guide-choisir','data-i="'+(i+1)+'"'):'')+'</div>'+(guide?actions+parametres:'')+'</article>';
}
function seance() {
  const s = etat.actif;
  if (!s) return titre('ENTRAÎNEMENT','Séance','Commencez librement ou choisissez une routine.')+bout('＋ Démarrer une séance','demarrer','','primary')+' <a class="btn" href="#routines">Voir les routines</a>';
  const guide=s.semaineJour!==undefined;
  const champs='<label>Titre<input data-field="nom" maxlength="120" value="'+e(s.nom)+'"></label><label>Notes de séance<textarea data-field="notes" maxlength="3000" rows="2">'+e(s.notes)+'</textarea></label>';
  return titre('ENTRAÎNEMENT',guide?e(s.nom):'Séance en cours','Les modifications sont enregistrées sur cet appareil.')+
    '<div class="stack"><section class="panel stack '+(guide?'journal-guide':'')+'"><div class="row spread">'+(guide?'':'<span>Durée <span class="timer" id="chrono"></span></span>')+'<span>Repos <span class="timer" id="repos"></span></span><div class="row">'+bout('−15 s','repos-moins','aria-label="Retirer 15 secondes du repos"')+bout('+15 s','repos-plus','aria-label="Ajouter 15 secondes au repos"')+bout('Arrêter le repos','stop-repos')+'</div></div></section>'+
    (guide?'<section class="panel guide-navigation"><p id="guide-etape" aria-live="polite"></p><div class="row">'+bout('← Précédent','guide-avant')+bout('Suivant →','guide-apres')+bout('Choisir un exercice','guide-ouvrir-choix','','primary')+'</div></section>':'')+
    (!guide?'<section class="panel stack">'+champs+'</section>':'')+
    s.exercices.map(carteJournal).join('')+
    (guide?'<details class="details panel"><summary>Options de séance</summary><div class="stack section">'+champs+'<div class="row">'+bout('Tous les exercices','guide-tous','aria-pressed="false"')+('wakeLock' in navigator?bout('Écran allumé','guide-ecran','aria-pressed="'+ecranActif+'"'):'')+'</div></div></details>':'')+
    (!s.exercices.length?vide('Ajoutez votre premier exercice pour enregistrer une série.'):'')+
    '<div class="row">'+bout('＋ Ajouter un exercice','ajout-ex')+bout('Calculatrices de charge','calculer-charge')+bout('Terminer et enregistrer','terminer','','primary')+bout('Annuler la séance','annuler','','danger')+'</div></div>';
}
function routines() {
  const groupes=planning.groupesRoutines();
  return titre('PLANIFIER','Routines','Préparez les exercices, les séries et les répétitions de vos prochaines séances.')+'<div class="row">'+bout('＋ Créer une routine','nouvelle-routine','','primary')+planning.boutonImporter()+' <a class="btn" href="#planning">Voir le calendrier</a></div>'+
    '<h2 class="section">Mes routines</h2>'+(groupes.length?groupes.map(g=>'<section class="section"><h3>'+e(g.nom)+'</h3><div class="grid two">'+g.routines.map(fiche).join('')+'</div></section>').join(''):vide('Aucune routine personnelle.'))+
    '<h2 class="section">Modèles</h2><div class="grid two">'+modeles.filter(r=>!etat.semaine?.active||!['maison','barre-parc'].includes(r.id)).map(fiche).join('')+'</div>';
}
const normal = s => String(s??'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe');
const estFavori = id => (etat.favorisEx??[]).includes(id);
function chercherExercices(requete, criteres={}) {
  const mots = normal(requete).trim().split(/[^a-z0-9]+/).filter(Boolean);
  const recents = new Map();
  for (const s of etat.seances) for (const x of s.exercices) {
    if (!recents.has(x.id)) recents.set(x.id,recents.size);
  }
  return tous().filter(x=>{
    const index = normal([x.nom,x.muscle,x.materiel,x.equipement,x.lieu,x.categorie,x.zone,...(Array.isArray(x.synonymes)?x.synonymes:[])].join(' '));
    return mots.every(mot=>index.includes(mot)) &&
      ['muscle','materiel','lieu','categorie'].every(k=>!criteres[k]||criteres[k]===x[k]) &&
      (criteres.collection!=='favoris'||estFavori(x.id)) &&
      (criteres.collection!=='personnels'||etat.persos.includes(x)) &&
      (criteres.collection!=='machines'||x.machine===true) &&
      (criteres.collection!=='recents'||recents.has(x.id));
  }).sort((a,b)=>{
    if (criteres.collection==='recents') return recents.get(a.id)-recents.get(b.id);
    const nomA=normal(a.nom), nomB=normal(b.nom), premier=mots[0];
    return (premier?Number(nomB.startsWith(premier))-Number(nomA.startsWith(premier)):0) ||
      (criteres.salle?Number(b.lieu==='Salle')-Number(a.lieu==='Salle'):0) ||
      Number(estFavori(b.id))-Number(estFavori(a.id)) ||
      ((recents.get(a.id)??Infinity)-(recents.get(b.id)??Infinity)||0) ||
      a.nom.localeCompare(b.nom,'fr');
  });
}
function etoile(x) {
  const actif=estFavori(x.id);
  return bout(actif?'★':'☆','favori-ex','data-id="'+e(x.id)+'" aria-pressed="'+actif+'" aria-label="'+(actif?'Retirer des favoris : ':'Ajouter aux favoris : ')+e(x.nom)+'"','etoile');
}
const mediaEx = id => catalogue.find(x=>x.id===id)?.media;
const packMedias = [...new Set(catalogue.flatMap(x=>[
  ...(x.media?.images??[]).map(photo=>photo.src),
  ...(x.media?.video?[x.media.video.src]:[])
]))];
function miniatureEx(x,f) {
  if(x.machine===true&&photoValide(x.photo)) return '<img src="'+e(x.photo)+'" alt="" width="280" height="178" loading="lazy" decoding="async">';
  const photo=mediaEx(x.id)?.images?.[0];
  if (photo) return '<img src="'+e(photo.src)+'" alt="" width="280" height="178" loading="lazy" decoding="async">';
  return f?dessin(f,1,true):'';
}
function creditMedia(media) {
  return '<small class="muted"><a href="'+e(media.source)+'" target="_blank" rel="noreferrer">'+e(media.auteur)+'</a> · <a href="'+e(media.licenceUrl)+'" target="_blank" rel="noreferrer">'+e(media.licence)+'</a>'+(media.modifications?' · '+e(media.modifications):'')+'</small>';
}
function demonstration(x,f) {
  if(x.machine===true&&photoValide(x.photo)) return '<figure class="film"><img src="'+e(x.photo)+'" width="280" alt="'+e(x.nom)+'"><figcaption>Photo personnelle du poste</figcaption></figure>';
  const media=mediaEx(x.id);
  const images=media?.images??[];
  const photos=images.length?'<div class="positions">'+images.map((photo,i)=>'<figure><img src="'+e(photo.src)+'" alt="'+e(x.nom)+' · vue '+(i+1)+'" loading="lazy"><figcaption>'+creditMedia(photo)+'</figcaption></figure>').join('')+'</div>':'';
  const film=media?.video?'<figure class="film"><video controls playsinline preload="none" '+(images.length?'poster="'+e(images[0].src)+'"':'')+' src="'+e(media.video.src)+'" aria-label="Démonstration de '+e(x.nom)+'"></video><figcaption>'+creditMedia(media.video)+'</figcaption></figure>':'';
  if (film||photos) return film+photos;
  return f?'<div class="positions"><figure>'+dessin(f)+'<figcaption>Position initiale</figcaption></figure><figure>'+dessin(f,1)+'<figcaption>Position finale</figcaption></figure></div><p class="muted">Schémas Cadence · repères simplifiés</p>':'<p class="muted">Consignes écrites · démonstration en attente.</p>';
}
function cartes() {
  const items = chercherExercices(filtre.nom,filtre);
  const cards=items.slice(0,limiteCatalogue).map(x=>{
    const f=mouvements[x.id];
    const illustration=miniatureEx(x,f);
    return '<article class="panel exercise">'+(illustration?'<div class="miniature">'+illustration+'</div>':'<span class="icon">'+svg(voies.seance[1])+'</span>')+'<h3>'+e(x.nom)+'</h3><p class="muted">'+e(x.muscle)+' · '+e(x.materiel)+'</p><div class="row actions-ex">'+bout('Voir la fiche','exercice','data-id="'+e(x.id)+'"')+etoile(x)+'</div></article>';
  }).join('');
  return '<p class="muted compte-ex" role="status">'+items.length+' exercice'+(items.length===1?'':'s')+' · '+Math.min(items.length,limiteCatalogue)+' affiché'+(items.length===1?'':'s')+'</p>'+
    (cards||vide('Aucun exercice correspondant.'))+(items.length>limiteCatalogue?'<div class="compte-ex">'+bout('Afficher 30 exercices de plus','plus-ex')+'</div>':'');
}
function apercuEx(ex, contexte) {
  const f = mouvements[ex.id];
  const secondaires=Array.isArray(ex.secondaires)?ex.secondaires.join(', '):f?.secondaires;
  const perso = etat.persos.includes(ex);
  const derniere = etat.seances.flatMap(s=>s.exercices).find(x=>x.id===ex.id);
  const options = tous().filter(x=>x.id!==ex.id && x.muscle===ex.muscle).slice(0,3);
  modal(e(ex.nom),'<div class="stack"><div class="row"><span class="tag">'+e(ex.muscle)+'</span><span class="tag">'+e(ex.equipement||ex.materiel)+'</span>'+(ex.niveau?'<span class="tag">'+e(ex.niveau)+'</span>':'')+etoile(ex)+'</div>'+demonstration(ex,f)+
    (ex.zone?'<p><strong>Emplacement</strong> · '+e(ex.zone)+'</p>':'')+'<section><h3>Exécution</h3><p>'+e(ex.conseil||'Aucune consigne renseignée.')+'</p>'+((ex.vigilance||f?.erreur)?'<p><strong>Point d’attention</strong> · '+e(ex.vigilance||f.erreur)+'</p>':'')+(secondaires?'<p class="muted">Muscles secondaires · '+e(secondaires)+'</p>':'')+'</section>'+
    (derniere?'<section><h3>Dernières séries enregistrées</h3><p>'+derniere.series.filter(y=>y.faite).map(y=>decrireSerie(derniere,y,nombre)).join(' · ')+'</p></section>':'')+
    (options.length?'<section><h3>Autres exercices du même groupe</h3><div class="row">'+options.map(x=>bout(e(x.nom),'exercice','data-id="'+e(x.id)+'" data-context="'+e(contexte)+'"')).join('')+'</div></section>':'')+
    '<div class="row">'+(etat.actif&&contexte!=='seance'?bout('Ajouter à la séance','ex-vers-seance','data-id="'+e(ex.id)+'"','primary'):'')+(perso?bout('Modifier','editer-ex','data-id="'+e(ex.id)+'"'):'')+'</div></div>');
}
function exercices() {
  const options = k => [...new Set(tous().map(x=>x[k]).filter(v=>typeof v==='string'&&v))].sort((a,b)=>a.localeCompare(b,'fr'));
  const select = (cle,nom) => '<label>'+nom+'<select data-filter="'+cle+'"><option value="">Tout afficher</option>'+choix(options(cle),filtre[cle])+'</select></label>';
  const images=catalogue.filter(x=>miniatureEx(x,mouvements[x.id])).length;
  const films=catalogue.filter(x=>x.media?.video).length;
  return titre('BIBLIOTHÈQUE','Exercices',catalogue.length+' fiches · '+images+' illustrées · '+films+' vidéos. Recherchez un mouvement par nom, muscle ou matériel.')+
    '<section class="panel stack"><label>Rechercher<input id="recherche" type="search" placeholder="Ex. développé couché, dos, haltères" value="'+e(filtre.nom)+'"></label><div class="row filters">'+select('muscle','Muscles')+select('materiel','Matériel')+select('lieu','Lieu et appui')+select('categorie','Type')+'</div><div class="row spread"><label>Collection<select data-filter="collection"><option value="">Tout afficher</option><option value="favoris" '+(filtre.collection==='favoris'?'selected':'')+'>Mes favoris</option><option value="recents" '+(filtre.collection==='recents'?'selected':'')+'>Récemment utilisés</option><option value="personnels" '+(filtre.collection==='personnels'?'selected':'')+'>Mes exercices</option><option value="machines" '+(filtre.collection==='machines'?'selected':'')+'>Mes machines</option></select></label>'+bout('＋ Ma machine','creer-machine','','primary')+bout('＋ Exercice personnalisé','creer-ex')+'</div></section><div class="grid section" id="cartes">'+cartes()+'</div>';
}
function courbeEx(seances) {
  const exercices = new Map();
  for (const s of seances) for (const x of s.exercices) exercices.set(groupeMesure(x),x);
  if (!exercices.size) return '';
  const id = exercices.has(progressionEx) ? progressionEx : exercices.keys().next().value;
  const ex=exercices.get(id);
  const mesure=mode(ex);
  const metriques={principal:indicateurs[mesure]};
  if(['charge','lest','assistance'].includes(mesure)) metriques.reps=['Répétitions maximales','rép.'];
  if(mesure==='charge') {
    metriques.volume=['Volume','kg'];
    metriques.rm=['1RM estimé','kg'];
  }
  const indicateur=Object.hasOwn(metriques,progressionIndicateur)?progressionIndicateur:'principal';
  const [label,unite]=metriques[indicateur];
  const points = [...seances].sort((a,b)=>a.debut-b.debut).flatMap(s=>{
    const series = s.exercices.filter(x=>groupeMesure(x)===id).flatMap(x=>x.series).filter(y=>y.faite&&y.type!=='Échauffement');
    if(!series.length) return [];
    const valeurs={principal:mesureProgression(ex,series),reps:Math.max(...series.map(y=>y.reps)),volume:series.reduce((n,y)=>n+volumeSerie(ex,y),0)};
    if(indicateur==='rm') valeurs.rm=records([{exercices:[{...ex,series}]}])[0].rm;
    if(indicateur==='rm'&&!valeurs.rm) return [];
    return [{date:s.debut,valeur:valeurs[indicateur]}];
  }).slice(-20);
  const max = Math.max(1,...points.map(p=>p.valeur));
  const coords = points.map((p,i)=>[20+320*i/Math.max(1,points.length-1),115-95*p.valeur/max]);
  const trace = points.length ? '<svg class="courbe" viewBox="0 0 360 135" role="img" aria-label="Évolution de '+e(label.toLowerCase())+' par séance"><path d="M20 20V115H340" stroke="currentColor" opacity=".45" fill="none"/><polyline points="'+coords.join(' ')+'" stroke="currentColor" stroke-width="3" fill="none"/>'+coords.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="4" fill="currentColor"/>').join('')+'</svg>' : vide('Aucune série compatible sur cette période.');
  const options='<div class="row filters"><label>Exercice suivi<select id="progression-ex">'+[...exercices].map(([val,x])=>'<option value="'+e(val)+'" '+(val===id?'selected':'')+'>'+e(x.nom)+' · '+modes[mode(x)]+'</option>').join('')+'</select></label><label>Mesure<select id="progression-indicateur">'+Object.entries(metriques).map(([k,[v]])=>'<option value="'+k+'" '+(k===indicateur?'selected':'')+'>'+v+'</option>').join('')+'</select></label></div>';
  return '<section class="panel section"><h2>Progression par exercice</h2>'+options+'<p class="muted">Jusqu’à 20 séances, hors échauffement.</p>'+trace+
    (points.length?'<details class="details"><summary>Voir les valeurs</summary>'+points.map(p=>'<p>'+date.format(p.date)+' · '+nombre(p.valeur)+' '+unite+'</p>').join('')+'</details>':'')+'</section>';
}
function stats() {
  const seuil = new Date();
  seuil.setHours(0,0,0,0);
  seuil.setDate(seuil.getDate()-Number(periode)+1);
  const ss = periode==='tout'?etat.seances:etat.seances.filter(s=>s.debut>=seuil.getTime());
  const derniers = [...ss].reverse().slice(-14);
  const vmax = Math.max(1,...derniers.map(volume));
  const rs = records(ss);
  const muscles = new Map();
  for (const s of ss) for (const x of s.exercices) {
    const count = x.series.filter(y=>y.faite&&y.type!=='Échauffement').length;
    if (count) muscles.set(x.muscle,(muscles.get(x.muscle)??0)+count);
  }
  const groupes = [...muscles].sort((a,b)=>b[1]-a[1]);
  return titre('ANALYSER','Progression','Consultez vos séances terminées et vos meilleures séries.')+
    '<label>Période<select id="periode"><option value="7">7 jours</option><option value="30">30 jours</option><option value="90">90 jours</option><option value="tout">Tout l’historique</option></select></label>'+
    '<div class="grid metrics section">'+[['Séances',ss.length],['Volume total',nombre(ss.reduce((a,s)=>a+volume(s),0))+' kg'],['Durée totale',Math.round(ss.reduce((a,s)=>a+s.fin-s.debut,0)/60000)+' min']].map(([k,v])=>'<article class="panel metric"><small>'+k+'</small><strong>'+v+'</strong></article>').join('')+'</div>'+
    '<div class="grid two section"><section class="panel"><h2>Volume par séance</h2><p class="muted">Charge externe × répétitions des séries validées en mode Charge. Jusqu’à 14 séances.</p><div class="bars">'+(derniers.map(s=>'<div><div class="row spread"><small>'+date.format(s.debut)+' · '+e(s.nom)+'</small><strong>'+nombre(volume(s))+' kg</strong></div><div class="bar" aria-hidden="true"><b style="width:'+100*volume(s)/vmax+'%"></b></div></div>').join('')||vide('Aucune séance sur cette période.'))+'</div></section><section class="panel"><h2>Séries par groupe musculaire</h2><p class="muted">Groupe principal, hors échauffement.</p>'+ (groupes.map(([m,n])=>'<div class="row spread"><span>'+e(m)+'</span><strong>'+n+'</strong></div>').join('')||vide('Aucune série de travail.'))+'</section></div>'+
    courbeEx(ss)+'<h2 class="section">Records personnels</h2><p class="muted">Hors échauffement. Estimation d’Epley jusqu’à 12 répétitions en mode Charge, charge réelle à une répétition.</p><div class="grid two">'+(rs.map(x=>'<article class="panel"><h3>'+e(x.nom)+'</h3><small>'+indicateurs[x.mesure][0]+' · '+nombre(x.meilleur)+' '+indicateurs[x.mesure][1]+(x.rm?' · 1RM estimé '+nombre(x.rm)+' kg':'')+'</small></article>').join('')||vide('Aucun record sur cette période.'))+'</div><h2 class="section">Historique</h2><div class="stack">'+(ss.map(ligneSeance).join('')||vide('Aucune séance enregistrée sur cette période.'))+'</div>';
}
function accesDonnees() {
  const sauvegardeAncienne=Date.now()-(etat.derniereSauvegarde??0)>14*86400000;
  const rappel=sauvegardeAncienne&&(etat.seances.length||etat.poids?.length)?'<p class="muted">Pense à exporter une copie récente de ton carnet.</p>':'';
  return titre('PROFIL LOCAL','Données et préférences','Le carnet est conservé dans ce navigateur. Transférez-le avec un fichier de sauvegarde.')+
    '<div class="grid two"><section class="panel stack"><h2>Préférences</h2><label>Apparence<select id="theme">'+choix(['sombre','clair'],etat.theme)+'</select></label><label>Repos automatique en secondes (0 pour désactiver)<input id="reglage-repos" type="number" min="0" max="600" value="'+etat.repos+'"></label></section>'+
    '<section class="panel stack"><h2>Sauvegarder et récupérer</h2><p class="muted">Le fichier chiffré et son code sont tous deux nécessaires à la récupération. Conservez-les séparément.</p>'+rappel+
    (etat.persos.some(x=>x.photo)?'<label>Photos personnelles dans la sauvegarde<select id="photos-sauvegarde"><option value="non">Garder les photos sur cet appareil</option><option value="oui">Inclure les photos</option></select></label>':'')+
    '<div class="row">'+bout('Créer une sauvegarde chiffrée','export-chiffre','','primary')+bout('Exporter en JSON','export')+bout('Exporter les séances en CSV','export-csv')+bout('Restaurer un fichier','importer')+'</div></section></div>'+
    '<section class="panel section"><h2>Effacer le carnet</h2><p class="muted">Cette action efface les séances, les routines, les exercices personnels et le brouillon de cet appareil.</p>'+bout('Effacer mes données','effacer','','danger')+'</section>';
}
function donnees() {
  return accesDonnees()+'<section class="panel section stack"><h2>Cadence sur iPhone</h2><p class="muted">Ouvre Cadence depuis une icône sur l’écran d’accueil.</p><p id="etat-hors-ligne" class="muted" role="status">'+e(etatHorsLigne)+'</p><div class="row">'+bout('Installer sur iPhone','installer-iphone')+(navigator.storage?.persist?bout('Protéger le stockage local','stockage-persistant'):'')+'</div></section>'+
    '<section class="panel section stack sources-cadence"><h2>Démonstrations hors ligne</h2><p class="muted">Enregistrez les '+packMedias.length+' fichiers illustrés dans ce navigateur pour les consulter même sans réseau.</p><div class="row">'+bout('Télécharger les démonstrations','pack-hors-ligne')+'</div><p id="etat-pack" role="status"></p></section>'+
    '<section class="panel section sources-cadence"><h2>Un carnet ouvert</h2><p class="muted">Cadence est publié sous AGPL-3.0. Les crédits et licences des médias figurent sur chaque fiche.</p><a href="https://github.com/nouvellealex-alt/cadence-musculation" target="_blank" rel="noreferrer">Code source et installation</a></section>';
}
async function sauverImport() {
  await sauver();
  if(verrou) throw Error('Impossible d’enregistrer le fichier. Recharge Cadence et réessaie.');
}
const planning=creerPlanning({etat:()=>etat,modeles,parId,modal,fermer:()=>dialogue.close(),actualiser,afficher,demarrer,message,
  sauver:sauverImport,proposerSemaine:source=>semaine.proposerImport(source)});
const semaine=creerSemaine({etat:()=>etat,parId,tous,e,bout,modal,fermer:()=>dialogue.close(),actualiser,afficher,aller,demarrer,message,
  sauver:sauverImport,
  miniature:x=>miniatureEx(x,mouvements[x.id]),descriptionPrecedente:x=>{
    const dernier=precedent(x);
    return dernier?.series.filter(s=>s.faite).slice(0,3).map(s=>decrireSerie(dernier,s,nombre)).join(' · ')??'';
  }});
const vues = {accueil,semaine:semaine.rendre,seance,routines,planning:planning.rendre,exercices,stats,poids:()=>rendrePoids(etat,titre,bout,editionPoids),donnees};
const navPrincipale=['semaine','seance','exercices','stats'];
function afficher(focus=false) {
  const page=chemin();
  document.documentElement.dataset.theme=etat.theme;
  const lien=id=>{
    const [nom,trace]=voies[id];
    return '<a href="#'+id+'" '+(page===id?'aria-current="page"':'')+'>'+svg(trace)+nom+(id==='seance'&&etat.actif?'<span class="nav-en-cours" aria-hidden="true"></span>':'')+'</a>';
  };
  const autres=Object.keys(voies).filter(id=>!navPrincipale.includes(id));
  $('nav').innerHTML=navPrincipale.map(lien).join('')+'<details class="nav-plus"><summary>'+svg('M5 12h.01 M12 12h.01 M19 12h.01')+'Plus</summary><div class="nav-plus-liens">'+autres.map(lien).join('')+'</div></details>';
  vue.innerHTML=vues[page]();
  if (page==='semaine'&&/iPhone/i.test(navigator.userAgent)&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches) {
    vue.insertAdjacentHTML('beforeend','<div class="section">'+bout('Ajouter Cadence à mon iPhone','installer-iphone')+'</div>');
  }
  if ($('#periode')) $('#periode').value=periode;
  horloges();
  etapeGuide();
  if (focus) vue.focus();
}
function etapeGuide() {
  const texte=$('#guide-etape');
  if (!texte||!etat.actif) return;
  const exercices=etat.actif.exercices;
  const i=indexGuide(etat.actif);
  const total=exercices.reduce((n,ex)=>n+ex.series.length,0);
  texte.textContent=i<0?'Ajoutez un exercice pour commencer.':(i+1)+' / '+exercices.length+' · '+exercices[i].nom+' · '+terminees(etat.actif)+' / '+total+' séries validées';
  $('[data-act="guide-avant"]').disabled=i<=0;
  $('[data-act="guide-apres"]').disabled=i<0||i>=exercices.length-1;
  $('[data-act="guide-ouvrir-choix"]').disabled=i<0;
  $('[data-act="guide-tous"]').setAttribute('aria-pressed',String(guideTous));
  $('[data-act="guide-tous"]').textContent=guideTous?'Un exercice à la fois':'Tous les exercices';
  vue.querySelectorAll('.journal-exercice').forEach((el,n)=>{
    el.classList.toggle('guide-actif',i===n);
    el.hidden=!guideTous&&i!==n;
    const passer=$('[data-act="guide-passer"]',el);
    passer.hidden=!exercices.some((ex,index)=>index!==n&&ex.series.some(y=>!y.faite));
  });
}
function indexGuide(s) {
  if(!s.exercices.length) return -1;
  const prochain=s.exercices.findIndex(x=>x.series.some(y=>!y.faite));
  return Math.min(s.exercices.length-1,s.guideIndex??(prochain<0?s.exercices.length-1:prochain));
}
async function choisirEtape(s,i) {
  if(!s?.exercices[i]||s.semaineJour===undefined) return;
  s.guideIndex=i;
  await sauver();
  if(etat.actif!==s||chemin()!=='seance') return;
  etapeGuide();
  if(!guideTous) $('.guide-navigation')?.scrollIntoView({block:'start'});
}
function choisirExerciceGuide(s) {
  const selection=indexGuide(s);
  modal('Choisir un exercice','<p class="muted">Passe à un autre poste et reviens quand il se libère. L’ordre conseillé et les séries saisies sont conservés.</p><div class="stack choix-ordre">'+s.exercices.map((ex,i)=>{
    const faites=ex.series.filter(y=>y.faite).length;
    const statut=faites===ex.series.length?'Terminé':faites?faites+' / '+ex.series.length+' séries':'À faire';
    return bout('<span>'+(i+1)+'. '+e(ex.nom)+'</span><small>'+statut+(i===selection?' · En cours de consultation':'')+'</small>','guide-selection','data-i="'+i+'"'+(i===selection?' aria-current="step"':''));
  }).join('')+'</div>');
}
async function maintenirEcran() {
  if(!ecranActif||chemin()!=='seance'||!etat.actif||document.hidden) return;
  if(verrouEcran&&!verrouEcran.released) return;
  const obtenu=await navigator.wakeLock.request('screen');
  if(ecranActif&&chemin()==='seance'&&etat.actif) verrouEcran=obtenu;
  else await obtenu.release();
}
function libererEcran() {
  ecranActif=false;
  if(verrouEcran&&!verrouEcran.released) verrouEcran.release().catch(()=>{});
  verrouEcran=null;
}
function horloges() {
  if ($('#chrono') && etat.actif) $('#chrono').textContent=temps(Date.now()-etat.actif.debut);
  if ($('#repos') && etat.actif) $('#repos').textContent=temps(Math.ceil((etat.actif.reposFin-Date.now())/1000)*1000);
}
function actualiser() { sauver(); afficher(); }
function exerciceJournal(exercice, cible = {}) {
  const mesure = cible.mesure ?? mode(exercice);
  const {note, repos} = cible;
  const {id,nom,muscle,materiel,conseil} = exercice;
  const fourchette=cible.repsMax===undefined?{}:{repsCible:cible.reps,repsMax:cible.repsMax,reposMax:cible.reposMax};
  return {id,nom,muscle,materiel,conseil,mesure,note,repos,...fourchette,series:Array.from({length:cible.series ?? 1},()=>initialiserSerie(mesure,cible))};
}
function demarrer(r, planId = r?.planId, semaineJour, guideIndex) {
  if (etat.actif) { aller('seance'); message('Une séance est déjà en cours.'); return; }
  guideTous=false;
  etat.actif={id:uuid(),nom:r?.nom??'Séance libre',notes:'',debut:Date.now(),reposFin:0,
    planId,semaineJour,guideIndex,exercices:(r?.exercices??[]).map(x=>exerciceJournal(parId(x.id),x))};
  sauver();
  aller('seance');
}
function ligneRoutine(x={}) {
  const cible = (nom,texte,min,max,step=1) => '<label>'+texte+'<input type="number" name="'+nom+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+e(x[nom])+'"></label>';
  return '<div class="cible-routine"><label>Filtrer les exercices<input type="search" data-cherche-routine placeholder="Nom, muscle ou matériel"></label><div class="routine-entry"><label>Exercice<select name="ex" required>'+choixEx(x.id)+'</select></label><label>Séries<input name="series" type="number" min="1" max="20" value="'+(x.series??3)+'" required></label><label>Rép.<input name="reps" type="number" min="1" max="1000" value="'+(x.reps??8)+'" required></label>'+bout('×','retirer-ligne','aria-label="Retirer cet exercice"')+'</div>'+
    '<details class="details"><summary>Objectifs et repos</summary><div class="row filters"><label>Mode de suivi<select name="mesure"><option value="">Selon l’exercice</option>'+Object.entries(modes).map(([k,v])=>'<option value="'+k+'" '+(k===x.mesure?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+cible('kg','Charge, lest ou aide (kg)',0,2000,'any')+cible('repos','Repos (s)',0,600)+cible('secondes','Durée (s)',1,86400)+cible('metres','Distance (m)',1,1000000,'any')+'</div><label>Note<textarea name="note" rows="2" maxlength="1000">'+e(x.note)+'</textarea></label></details></div>';
}
function editionRoutine(r, dupliquer=false) {
  const existante = !dupliquer && etat.routines.includes(r);
  modal(existante?'Modifier la routine':'Créer une routine','<form class="stack" data-form="routine" data-id="'+(existante?e(r.id):'')+'"><label>Nom<input name="nom" maxlength="120" value="'+e(dupliquer?(r.nom+' (copie)').slice(0,120):r?.nom??'')+'" required></label><div id="lignes" class="stack">'+(r?.exercices??[{}]).map(ligneRoutine).join('')+'</div><div class="row">'+bout('＋ Ajouter un exercice','ajouter-ligne')+'<button class="primary">Enregistrer</button></div></form>');
  $('#lignes').addEventListener('input',ev=>{
    if(ev.target.dataset.chercheRoutine===undefined) return;
    const select=$('select[name="ex"]',ev.target.closest('.cible-routine'));
    const options=choixEx('',ev.target.value);
    select.innerHTML=options || '<option value="">Aucun exercice correspondant</option>';
  });
}
function confirmation(titre, texte, action, id='') {
  modal(titre,'<p>'+texte+'</p><div class="row">'+bout('Confirmer',action,'data-id="'+e(id)+'"','danger')+bout('Retour','fermer')+'</div>');
}
function editerSeance(item) {
  const champs = item.exercices.map((a,i)=>'<fieldset><legend>'+e(a.nom)+'</legend><label>Note de l’exercice<textarea name="note-'+i+'" maxlength="1000" rows="2">'+e(a.note)+'</textarea></label>'+a.series.map((y,j)=>{
    const cle = i+'-'+j;
    const mesure = [...champsSerie(a),effort].map(c=>'<label>'+c[1]+inputSerie(c,y[c[0]],'name="'+c[0]+'-'+cle+'"',c[2]+' de la série '+(j+1),c!==effort)+'</label>').join('');
    return '<h3>Série '+(j+1)+'</h3><div class="row filters">'+mesure+'<label>Type<select name="type-'+cle+'">'+choix(types,y.type)+'</select></label></div>';
  }).join('')+'</fieldset>').join('');
  const heure = new Date(item.debut);
  const locale = new Date(item.debut-heure.getTimezoneOffset()*60_000).toISOString().slice(0,16);
  modal('Modifier la séance','<form class="stack" data-form="editer-seance" data-id="'+e(item.id)+'"><label>Titre<input name="nom" maxlength="120" value="'+e(item.nom)+'" required></label><label>Date et heure<input type="datetime-local" name="date" value="'+locale+'" required></label><label>Notes<textarea name="notes" maxlength="3000">'+e(item.notes)+'</textarea></label>'+champs+'<button class="primary">Enregistrer les modifications</button></form>');
}
function telecharger(contenu, suffixe, extension, type) {
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(contenu instanceof Blob?contenu:new Blob([contenu],{type}));
  lien.download = 'cadence-'+new Date().toISOString().slice(0,10)+suffixe+'.'+extension;
  lien.click();
  setTimeout(()=>URL.revokeObjectURL(lien.href),1000);
}
function fichier(contenu, suffixe) {
  const blob=new Blob([JSON.stringify(contenu)],{type:'application/json'});
  if(blob.size>tailleSauvegardeMax) throw Error('Ce carnet dépasse la taille maximale de sauvegarde. Essaie sans les photos.');
  telecharger(blob,suffixe,'json','application/json');
}
function calculerCharge() {
  const cible=etat.actif.exercices.find(x=>mode(x)==='charge')?.series[0].kg || 60;
  modal('Disques et échauffement','<div id="calcul-charge" class="stack"><div class="row filters"><label>Charge totale visée (kg)<input id="charge-cible" type="number" min="0" max="2000" step="any" value="'+cible+'" required></label><label>Poids de la barre (kg)<input id="barre-charge" type="number" min="0" max="100" step="any" value="20" required></label></div><div id="calcul-resultat" aria-live="polite"></div></div>');
  const rendre = () => {
    const poids=$('#charge-cible');
    const barre=$('#barre-charge');
    const zone=$('#calcul-resultat');
    if(!poids.validity.valid||!barre.validity.valid) { zone.textContent='Saisissez des charges valides.'; return; }
    const kg=poids.valueAsNumber;
    const base=barre.valueAsNumber;
    if(kg<base) { zone.textContent='La charge visée est inférieure au poids de la barre.'; return; }
    const resultat=disques(kg,base);
    const liste=resultat.disques.map(d=>d.quantite+' × '+nombre(d.kg)+' kg').join(' + ');
    const exemples=[40,60,80].map(p=>'<li>'+p+' % · '+nombre(disques(Math.max(base,kg*p/100),base).chargeReelle)+' kg avec les disques disponibles</li>').join('');
    zone.innerHTML='<h3>Disques par côté</h3><p>'+(liste||'Barre seule')+' · '+nombre(resultat.chargeReelle)+' kg au total</p>'+
      (Math.abs(resultat.chargeReelle-kg)>0.000001?'<p class="muted">Arrondi à la charge réalisable inférieure.</p>':'')+
      '<h3>Repères d’échauffement</h3><p class="muted">Exemples de paliers calculés sur la charge visée. Vérifiez les disques disponibles et choisissez les paliers adaptés à votre séance.</p><ul>'+exemples+'</ul>';
  };
  $('#calcul-charge').addEventListener('input',rendre);
  rendre();
}
function lireChamp(el) {
  const {field,i,j} = el.dataset;
  if (!etat.actif || !field) return;
  const charge=el.hasAttribute('data-charge-decimale')?Number(el.value.replace(',','.')):undefined;
  if(charge!==undefined) el.setCustomValidity(charge>2000?'La charge doit être au maximum de 2 000 kg.':'');
  if (!el.validity.valid) {
    el.setAttribute('aria-invalid','true');
    return;
  }
  el.removeAttribute('aria-invalid');
  const exercice = etat.actif.exercices[Number(i)];
  const cible = i===undefined ? etat.actif : j===undefined ? exercice : exercice.series[Number(j)];
  if (el.value==='' && ['repos','rpe','superset'].includes(field)) delete cible[field];
  else cible[field]=charge??(el.type==='number'?Number(el.value):el.value);
  sauver();
}
function actualiserJournal(selecteur) {
  const options = [...vue.querySelectorAll('.exercice-options[open], .serie-options[open]')].map(el=>{
    const {i,j} = el.closest('[data-i]').dataset;
    return j===undefined ? '.journal-exercice[data-i="'+i+'"] .exercice-options' :
      '.bloc-serie[data-i="'+i+'"][data-j="'+j+'"] .serie-options';
  });
  actualiser();
  for (const option of options) {
    const details = $(option,vue);
    if(details) details.open=true;
  }
  if (selecteur) $(selecteur,vue)?.focus({preventScroll:true});
}
vue.addEventListener('input',ev=>{
  if (!etat || verrou) return;
  const el=ev.target;
  if (el.id==='recherche') {filtre.nom=el.value;limiteCatalogue=30;$('#cartes').innerHTML=cartes();}
  lireChamp(el);
});
vue.addEventListener('focusin',ev=>{
  const champ=ev.target;
  if(!champ.matches?.('.journal-serie [data-charge-decimale]')||!champ.value) return;
  requestAnimationFrame(()=>{if(document.activeElement===champ) champ.select();});
});
vue.addEventListener('change',ev=>{
  if (!etat || verrou) return;
  const el=ev.target;
  if (el.dataset.modeI!==undefined) {
    const index=Number(el.dataset.modeI);
    const exercice=etat.actif.exercices[index];
    if (!Object.hasOwn(modes,el.value) || exercice.series.some(s=>s.faite)) return;
    exercice.mesure=el.value;
    exercice.series=exercice.series.map(s=>({...initialiserSerie(el.value,{reps:s.reps,secondes:s.secondes,metres:s.metres,rpe:s.rpe}),type:s.type}));
    actualiserJournal('[data-mode-i="'+index+'"]');
  }
  if (el.dataset.field==='superset') {
    lireChamp(el);
    actualiserJournal('select[data-field="superset"][data-i="'+el.dataset.i+'"]');
  }
  if (el.dataset.filter) {filtre[el.dataset.filter]=el.value;limiteCatalogue=30;$('#cartes').innerHTML=cartes();}
  if (el.id==='progression-ex') {progressionEx=el.value;afficher();$('#progression-ex').focus();}
  if (el.id==='progression-indicateur') {progressionIndicateur=el.value;afficher();$('#progression-indicateur').focus();}
  if (el.id==='periode') {periode=el.value;afficher();$('#periode').focus();}
  if (el.id==='theme') {etat.theme=el.value;actualiser();$('#theme').focus();}
  if (el.id==='reglage-repos' && el.value!=='' && el.validity.valid) {etat.repos=Number(el.value);sauver();}
});
let restauration;
document.addEventListener('click',async ev=>{
  const menu=$('.nav-plus[open]');
  if(menu&&(!menu.contains(ev.target)||ev.target.closest('.nav-plus-liens a'))) menu.open=false;
  const b=ev.target.closest('button[data-act]');
  if (!b || !etat) return;
  const {act,id,i,j}=b.dataset;
  if (act==='fermer') {dialogue.close();return;}
  if (verrou && !['export','export-csv','export-chiffre'].includes(act)) {message('Rechargez la page pour reprendre les modifications.');return;}
  const s=etat.actif;
  const x=s?.exercices[Number(i)];
  try {
    if (semaine.action(b)||planning.action(b)) return;
    switch(act) {
      case 'stockage-persistant':
        message(await navigator.storage.persist()?'Le navigateur a accordé le stockage persistant.':'Le navigateur conserve ses règles de stockage. Garde une sauvegarde du carnet.');
        break;
      case 'installer-iphone':
        modal('Installer Cadence sur iPhone','<ol class="installation-iphone"><li>Ouvre Cadence dans <strong>Safari</strong>.</li><li>Dans le menu de Safari, touche <strong>Partager</strong>, puis <strong>Sur l’écran d’accueil</strong>.</li><li>Active <strong>Ouvrir comme app web</strong> si Safari propose ce réglage, puis touche <strong>Ajouter</strong>.</li><li>Ouvre Cadence depuis son icône une première fois avec du réseau.</li></ol><p class="muted">Pour récupérer un carnet existant, exporte-le depuis Données, puis restaure-le dans Cadence ouvert depuis son icône. Si tu veux seulement ton programme, importe ton fichier depuis Ma semaine.</p>');
        break;
      case 'guide-avant': choisirEtape(s,indexGuide(s)-1);break;
      case 'guide-apres': choisirEtape(s,indexGuide(s)+1);break;
      case 'guide-choisir': choisirEtape(s,Number(i));break;
      case 'guide-passer': {
        const depart=Number(i);
        const suivants=s.exercices.slice(depart+1).findIndex(ex=>ex.series.some(y=>!y.faite));
        const suivant=suivants>=0?depart+1+suivants:s.exercices.slice(0,depart).findIndex(ex=>ex.series.some(y=>!y.faite));
        if(suivant>=0) {
          guideTous=false;
          choisirEtape(s,suivant);
          $('[data-act="guide-ouvrir-choix"]')?.focus({preventScroll:true});
          message('Tu peux revenir à cet exercice avec « Choisir un exercice ».');
        }
        break;
      }
      case 'guide-ouvrir-choix': choisirExerciceGuide(s);break;
      case 'guide-selection':
        guideTous=false;
        dialogue.close();
        choisirEtape(s,Number(i));
        $('[data-act="guide-ouvrir-choix"]')?.focus({preventScroll:true});
        break;
      case 'guide-tous': guideTous=!guideTous;etapeGuide();break;
      case 'guide-ecran':
        if(ecranActif) libererEcran();
        else {
          ecranActif=true;
          try {await maintenirEcran();}
          catch {libererEcran();throw Error('Ce navigateur ne peut pas garder l’écran allumé.');}
        }
        b.setAttribute('aria-pressed',String(ecranActif));
        message(ecranActif?'L’écran reste allumé pendant cette séance.':'L’écran peut se mettre en veille.');
        break;
      case 'pack-hors-ligne': {
        if (!('caches' in window)) throw Error('Le stockage hors ligne est indisponible dans ce navigateur.');
        b.disabled=true;
        try {
          const cache=await caches.open('cadence-medias-1');
          let acquis=0;
          const statut=$('#etat-pack');
          for (const fichier of packMedias) {
            const requete=new URL(fichier,location.href).href;
            if (!await cache.match(requete)) await cache.add(requete);
            statut.textContent=++acquis+' sur '+packMedias.length+' médias disponibles hors ligne.';
          }
          message('Démonstrations prêtes hors ligne.');
        } finally {b.disabled=false;}
        break;
      }
      case 'plus-ex':
        limiteCatalogue+=30;
        $('#cartes').innerHTML=cartes();
        $('#cartes article:nth-of-type('+(limiteCatalogue-29)+') button')?.focus();
        break;
      case 'favori-ex': {
        const liste=etat.favorisEx??[];
        etat.favorisEx=estFavori(id)?liste.filter(x=>x!==id):[...liste,id];
        sauver();
        if ($('#cartes')) $('#cartes').innerHTML=cartes();
        if (b.isConnected) {b.outerHTML=etoile(parId(id));}
        const zone=dialogue.open?dialogue:vue;
        [...zone.querySelectorAll('[data-act="favori-ex"]')].find(x=>x.dataset.id===id)?.focus();
        break;
      }
      case 'ouvrir-seance': aller('seance'); break;
      case 'demarrer': demarrer(); break;
      case 'routine': demarrer([...etat.routines,...modeles].find(r=>r.id===id)); break;
      case 'nouvelle-routine': editionRoutine(); break;
      case 'dupliquer-routine': editionRoutine([...etat.routines,...modeles].find(r=>r.id===id),true);break;
      case 'editer-routine': editionRoutine([...etat.routines,...modeles].find(r=>r.id===id)); break;
      case 'ajouter-ligne': if ($('#lignes').children.length<60) $('#lignes').insertAdjacentHTML('beforeend',ligneRoutine()); break;
      case 'retirer-ligne': if ($('#lignes').children.length>1) b.closest('.cible-routine').remove(); break;
      case 'supprimer-routine': confirmation('Supprimer la routine ?','La routine sera retirée de votre carnet.','supprimer-routine-ok',id); break;
      case 'supprimer-routine-ok': etat.routines=etat.routines.filter(r=>r.id!==id);dialogue.close();actualiser();break;
      case 'ajout-ex':
        if(s.exercices.length>=60) throw Error('Limite de 60 exercices par séance.');
        choixPourSeance();break;
      case 'exercice': apercuEx(parId(id),b.dataset.context||'');break;
      case 'monter-ex':
      case 'descendre-ex': {
        const index=Number(i);
        const suivant=index+(act==='monter-ex'?-1:1);
        if(s.exercices[suivant]) {
          [s.exercices[suivant],s.exercices[index]]=[x,s.exercices[suivant]];
          if(s.semaineJour!==undefined) s.guideIndex=suivant;
          actualiserJournal('.journal-exercice[data-i="'+suivant+'"] [data-act="exercice"]');
        }
        break;
      }
      case 'remplacer-ex': choixPourSeance(Number(i));break;
      case 'indisponible': choixIndisponible(Number(i));break;
      case 'indisponible-poste': choixIndisponible(Number(i),b.dataset.poste);break;
      case 'indisponible-chercher': choixPourSeance(Number(i),b.dataset.poste);break;
      case 'indisponible-ok': {
        const station=b.dataset.poste||'';
        const scindee=x.superset&&x.series.some(y=>y.faite);
        remplacerEx(Number(i),id,station);
        message(scindee?'Exercice remplacé. Les séries restantes sont sorties de la supersérie.':'Exercice remplacé pour cette séance.');
        break;
      }
      case 'remplacer-ex-ok':
        if (x.id===id) { dialogue.close(); break; }
        if (x.series.some(y=>y.faite)) {
          modal('Confirmer le remplacement','<p>Les validations seront retirées pour éviter d’attribuer ces séries au mauvais exercice.</p>'+bout('Remplacer cet exercice','remplacer-ex-confirme','data-id="'+e(id)+'" data-i="'+i+'"','primary'));
        } else remplacerEx(Number(i),id);
        break;
      case 'remplacer-ex-confirme': remplacerEx(Number(i),id);break;
      case 'creer-ex':
      case 'creer-machine':
      case 'editer-ex': {
        const ex=act==='editer-ex'?parId(id):{};
        const machine=act==='creer-machine'||ex.machine===true;
        const options=machine?'<label>Étage ou zone<input name="zone" value="'+e(ex.zone)+'" maxlength="80"></label><label>Photo privée du poste<input name="photo" type="file" accept="image/*"></label>'+
          (ex.photo?'<label>Photo actuelle<select name="photo-actuelle"><option value="garder">Conserver</option><option value="retirer">Retirer</option></select></label>':'')+'<p class="muted">La photo reste locale. Elle est exclue des fichiers de routine.</p><p data-import-etat role="alert"></p>':'';
        modal(ex.id?(machine?'Modifier la machine':'Modifier l’exercice'):(machine?'Nouvelle machine':'Exercice personnalisé'),'<form class="stack" data-form="exercice" data-machine="'+machine+'" data-id="'+e(ex.id)+'"><label>Nom<input name="nom" value="'+e(ex.nom)+'" required maxlength="120"></label><label>Groupe musculaire<input name="muscle" value="'+e(ex.muscle)+'" required maxlength="120"></label><label>Matériel<input name="materiel" value="'+e(ex.materiel||(machine?'Machine':''))+'" required maxlength="120"></label>'+options+'<label>Consigne<textarea name="conseil" maxlength="1000">'+e(ex.conseil)+'</textarea></label><button class="primary">Enregistrer</button></form>');break;
      }
      case 'ex-vers-seance': ajouterEx(id);break;
      case 'retirer-ex': if (x.series.some(y=>y.faite)) confirmation('Retirer cet exercice ?','Ses séries validées seront retirées de la séance.','retirer-ex-ok',i);else {s.exercices.splice(Number(i),1);actualiser();}break;
      case 'retirer-ex-ok': s.exercices.splice(Number(id),1);dialogue.close();actualiser();break;
      case 'ajouter-serie':
        if (x.series.length>=100) throw Error('Limite de 100 séries par exercice.');
        x.series.push(initialiserSerie(mode(x),x.series.at(-1)));
        actualiserJournal('.bloc-serie[data-i="'+i+'"][data-j="'+(x.series.length-1)+'"] input');break;
      case 'monter-serie':
      case 'descendre-serie': {
        const index=Number(j);
        const suivant=index+(act==='monter-serie'?-1:1);
        if(x.series[suivant]) {
          [x.series[suivant],x.series[index]]=[x.series[index],x.series[suivant]];
          actualiserJournal('.bloc-serie[data-i="'+i+'"][data-j="'+suivant+'"] input');
        }
        break;
      }
      case 'reprendre-serie': {
        if(x.series[Number(j)].faite) break;
        const precedentes=precedent(x)?.series.filter(y=>y.faite) ?? [];
        const modele=precedentes[Number(j)] ?? precedentes.at(-1);
        if(modele) {
          const y=x.series[Number(j)];
          for(const [champ] of champsSerie(x)) y[champ]=modele[champ];
          actualiserJournal('.bloc-serie[data-i="'+i+'"][data-j="'+j+'"] input');
        }
        break;
      }
      case 'retirer-serie':
        if (x.series.length===1) throw Error('Gardez une série ou retirez l’exercice.');
        x.series.splice(Number(j),1);actualiserJournal('[data-act="ajouter-serie"][data-i="'+i+'"]');break;
      case 'ajuster-charge': {
        const charge=$('input[data-field="kg"]',b.closest('.bloc-serie'));
        if(!charge||x.series[Number(j)].faite) break;
        const valeur=Number(charge.value.replace(',','.'));
        if(!Number.isFinite(valeur)) throw Error('Saisis une charge valide avant de l’ajuster.');
        charge.value=String(Math.max(0,Math.min(2000,Math.round((valeur+Number(b.dataset.delta))*1000)/1000)));
        lireChamp(charge);
        break;
      }
      case 'valider':
      case 'valider-zero': {
        const bouton=act==='valider'?b:$('[data-act="valider"][data-i="'+i+'"][data-j="'+j+'"]',vue);
        if(!bouton||bouton.disabled) break;
        const ligne=bouton.closest('.series');
        if ([...bouton.closest('.bloc-serie').querySelectorAll('input')].some(el=>!el.validity.valid)) throw Error('Vérifiez les valeurs de cette série.');
        const y=x.series[Number(j)];
        if(act==='valider'&&!y.faite&&mode(x)==='charge'&&y.kg===0) {
          modal('Valider à 0 kg ?', '<p>La charge enregistrée pour cette série sera de 0 kg.</p>'+bout('Valider à 0 kg','valider-zero','data-i="'+i+'" data-j="'+j+'"','primary'));
          break;
        }
        if(act==='valider-zero') dialogue.close();
        const ancien={faite:y.faite,jeton:y.reposJeton,fin:s.reposFin,origine:s.reposJeton,guide:s.guideIndex};
        bouton.disabled=true;
        if(s.semaineJour!==undefined&&s.guideIndex===undefined) s.guideIndex=Number(i);
        y.faite=!y.faite;
        if(y.faite) {
          const duree=reposApres(s.exercices,x,Number(j),etat.repos);
          s.reposFin=Date.now()+duree*1000;
          s.reposJeton=y.reposJeton=duree?uuid():undefined;
        } else if(y.reposJeton&&y.reposJeton===s.reposJeton) {
          s.reposFin=0;
          s.reposJeton=undefined;
        }
        await sauver();
        bouton.disabled=false;
        if(verrou) {
          y.faite=ancien.faite;y.reposJeton=ancien.jeton;s.reposFin=ancien.fin;s.reposJeton=ancien.origine;s.guideIndex=ancien.guide;
          break;
        }
        if(!bouton.isConnected) break;
        $('[data-mode-i="'+i+'"]').disabled=x.series.some(y=>y.faite);
        bouton.setAttribute('aria-pressed',String(y.faite));
        const raccourci=$('[data-act="reprendre-serie"]',bouton.closest('.bloc-serie'));
        if(raccourci) raccourci.hidden=y.faite;
        const ajustement=$('.charge-ajustement',bouton.closest('.bloc-serie'));
        if(ajustement) ajustement.hidden=y.faite;
        ligne.classList.toggle('done',y.faite);
        horloges();etapeGuide();break;
      }
      case 'repos-moins':
      case 'repos-plus': {
        const maintenant=Date.now();
        const delta=act==='repos-plus'?15000:-15000;
        if(s.reposFin<=maintenant) s.reposJeton=undefined;
        s.reposFin=maintenant+Math.min(600000,Math.max(0,Math.max(0,s.reposFin-maintenant)+delta));
        sauver();horloges();break;
      }
      case 'calculer-charge': calculerCharge();break;
      case 'stop-repos': s.reposFin=0;s.reposJeton=undefined;sauver();horloges();break;
      case 'annuler': confirmation('Annuler cette séance ?','Le brouillon et ses séries seront effacés.','annuler-ok');break;
      case 'annuler-ok': etat.actif=null;dialogue.close();sauver();aller('accueil');break;
      case 'guide-restantes': {
        dialogue.close();
        guideTous=false;
        choisirEtape(s,s.exercices.findIndex(ex=>ex.series.some(y=>!y.faite)));
        break;
      }
      case 'terminer':
      case 'terminer-partielle': {
        if (!terminees(s)) throw Error('Validez au moins une série pour terminer.');
        if ([...vue.querySelectorAll('.bloc-serie:has(.done) input')].some(el=>!el.validity.valid)) throw Error('Corrigez les valeurs des séries validées.');
        if(etat.seances.length>=20000) throw Error('Limite de 20 000 séances atteinte.');
        const restantes=s.exercices.reduce((n,ex)=>n+ex.series.filter(y=>!y.faite).length,0);
        if(act==='terminer'&&s.semaineJour!==undefined&&restantes) {
          modal('Terminer cette séance ?', '<p>Il reste '+restantes+' '+(restantes===1?'série non validée.':'séries non validées.')+' Seules les séries validées seront enregistrées.</p><div class="row">'+bout('Revenir aux séries restantes','guide-restantes','','primary')+bout('Enregistrer la séance partielle','terminer-partielle')+'</div>');
          break;
        }
        if(dialogue.open) dialogue.close();
        etat.seances.unshift({...s,partielle:restantes>0,nom:s.nom.trim()||'Séance libre',fin:Math.max(Date.now(),s.debut),exercices:s.exercices.filter(a=>a.series.some(y=>y.faite)).map(a=>({...a,series:a.series.filter(y=>y.faite)}))});
        etat.actif=null;await sauver();aller('stats');if(!verrou) message('Séance enregistrée.');break;
      }
      case 'details': {
        const item=etat.seances.find(a=>a.id===id);
        modal(e(item.nom),'<p class="muted">'+date.format(item.debut)+' · '+temps(item.fin-item.debut)+' · '+nombre(volume(item))+' kg</p><p>'+e(item.notes)+'</p>'+
          item.exercices.map(a=>'<h3>'+e(a.nom)+'</h3><p>'+a.series.map(y=>decrireSerie(a,y,nombre)+' · '+e(y.type)+(y.rpe?' · RPE '+nombre(y.rpe):'')).join('<br>')+'</p>'+(a.note?'<p>'+e(a.note)+'</p>':'')).join('')+
          '<div class="row">'+bout('Modifier la séance','editer-seance','data-id="'+e(id)+'"')+bout('Refaire la séance','refaire-seance','data-id="'+e(id)+'"')+bout('Créer une routine','routine-depuis-seance','data-id="'+e(id)+'"')+bout('Supprimer la séance','supprimer-seance','data-id="'+e(id)+'"','danger')+'</div>');break;
      }
      case 'refaire-seance': {
        if (s) throw Error('Terminez la séance en cours avant d’en commencer une autre.');
        const item=etat.seances.find(a=>a.id===id);
        etat.actif={id:uuid(),nom:item.nom,notes:item.notes,debut:Date.now(),reposFin:0,exercices:item.exercices.map(a=>({...a,series:a.series.map(y=>({...y,faite:false}))}))};
        dialogue.close();sauver();aller('seance');break;
      }
      case 'routine-depuis-seance': {
        const item=etat.seances.find(a=>a.id===id);
        const exercices=item.exercices.filter(a=>parId(a.id)).map(a=>{
          const {kg,reps,secondes,metres}=a.series[0];
          return {id:a.id,series:Math.min(20,a.series.length),kg,reps,secondes,metres,mesure:mode(a),note:a.note,repos:a.repos};
        });
        if (!exercices.length) throw Error('Aucun exercice de cette séance n’est disponible dans la bibliothèque.');
        editionRoutine({nom:item.nom,exercices});break;
      }
      case 'editer-seance': editerSeance(etat.seances.find(a=>a.id===id));break;
      case 'supprimer-seance': confirmation('Supprimer la séance ?','Les statistiques seront recalculées.','supprimer-seance-ok',id);break;
      case 'supprimer-seance-ok': etat.seances=etat.seances.filter(a=>a.id!==id);dialogue.close();actualiser();break;
      case 'poids-ajouter':
        if(!ajouterPoids(etat,$('#poids-date').value,$('#poids-kg').value,editionPoids)) throw Error('Choisis une date valide et saisis un poids entre 20 et 400 kg.');
        editionPoids='';actualiser();message('Pesée enregistrée.');break;
      case 'poids-editer': editionPoids=id;afficher();$('#poids-kg')?.focus();break;
      case 'poids-annuler': editionPoids='';afficher();break;
      case 'poids-suppr': confirmation('Supprimer cette pesée ?','Cette valeur sera retirée de la courbe et de l’historique.','poids-suppr-ok',id);break;
      case 'poids-suppr-ok': supprimerPoids(etat,id);editionPoids='';dialogue.close();actualiser();break;
      case 'export': {
        const exporte=sauvegardePhotos({...etat,derniereSauvegarde:Date.now()},$('#photos-sauvegarde')?.value==='oui');
        fichier(exporte,'');etat.derniereSauvegarde=exporte.derniereSauvegarde;sauver();message('Sauvegarde JSON téléchargée.');break;
      }
      case 'export-csv': telecharger(csvSeances(etat.seances),'-seances','csv','text/csv;charset=utf-8');message('Séances exportées en CSV.');break;
      case 'export-chiffre': {
        b.disabled=true;
        try {
          const exporte=sauvegardePhotos({...etat,derniereSauvegarde:Date.now()},$('#photos-sauvegarde')?.value==='oui');
          const protection=await chiffrer(exporte);
          modal('Votre code de récupération','<p>Copiez ce code et conservez-le séparément du fichier. Le code sera retiré de l’écran à la fermeture.</p><p class="recovery-code">'+e(protection.code)+'</p>'+bout('Télécharger le fichier chiffré','telecharger-chiffre','','primary'));
          $('#dialogue [data-act="telecharger-chiffre"]').addEventListener('click',()=>{
            fichier(protection.fichier,'-chiffre');etat.derniereSauvegarde=exporte.derniereSauvegarde;sauver();
          });
        } finally {b.disabled=false;}
        break;
      }
      case 'importer':
        modal('Restaurer un fichier','<form class="stack" data-form="import"><label>Fichier de sauvegarde<input name="fichier" type="file" accept=".json,application/json"></label>'+collageImport+'<label>Code (pour un fichier chiffré)<input name="code" type="password" autocomplete="off" maxlength="100"></label><button class="primary">Vérifier le fichier</button></form>');break;
      case 'restaurer-ok': if(restauration){etat=restauration;restauration=null;dialogue.close();await sauver();afficher();if(!verrou)message('Carnet restauré.');}break;
      case 'effacer': confirmation('Effacer toutes les données ?','Vous pourrez restaurer le carnet si vous avez conservé une sauvegarde.','effacer-ok');break;
      case 'effacer-ok': etat=nouveau();dialogue.close();actualiser();break;
    }
  } catch(err) { message(err.message); }
});
function ajouterEx(id) {
  const s=etat.actif;
  if(!s||s.exercices.length>=60) throw Error('Cette séance ne peut pas recevoir un autre exercice.');
  s.exercices.push(exerciceJournal(parId(id)));
  if(s.semaineJour!==undefined) s.guideIndex=s.exercices.length-1;
  dialogue.close();sauver();
  aller('seance');
  requestAnimationFrame(()=>{
    const derniere = $('.journal-exercice[data-i="'+(s.exercices.length-1)+'"] input[required]',vue);
    derniere?.focus();
  });
}
function remplacerEx(index,id,station) {
  const exercices=etat.actif.exercices;
  const ancien=exercices[index];
  const preserver=station!==undefined;
  const validees=ancien.series.filter(y=>y.faite);
  if(preserver&&validees.length===ancien.series.length) throw Error('Toutes les séries de cet exercice sont déjà validées.');
  if(preserver&&validees.length&&exercices.length>=60) throw Error('La séance ne peut pas contenir un exercice de plus.');
  const restant=preserver?ancien.series.length-validees.length:ancien.series.length;
  const repetitions=ancien.repsCible??ancien.series.find(y=>!y.faite)?.reps??8;
  const cible={series:restant,repos:ancien.repos,reps:repetitions,repsMax:ancien.repsMax,reposMax:ancien.reposMax};
  const nouveau=exerciceJournal(parId(id),cible);
  if(ancien.superset) nouveau.superset=ancien.superset;
  if(preserver&&validees.length) {
    delete ancien.superset;
    delete nouveau.superset;
    ancien.series=validees;
    exercices.splice(index+1,0,nouveau);
    index++;
  } else exercices[index]=nouveau;
  if(station) etat.actif.postesBloques=[...new Set([...(etat.actif.postesBloques??[]),station])];
  if(etat.actif.semaineJour!==undefined) etat.actif.guideIndex=index;
  dialogue.close();actualiserJournal('.journal-exercice[data-i="'+index+'"] input[required]');
}
dialogue.addEventListener('close',()=>{if(!dialogue.open){dialogue.innerHTML='';restauration=null;}});
dialogue.addEventListener('submit',async ev=>{
  ev.preventDefault();
  const form=ev.target;
  if(verrou) {
    const statut=$('[data-import-etat]',form);
    const texte='Le carnet a changé dans un autre onglet. Recharge Cadence avant de réessayer.';
    if(statut) statut.textContent=texte;
    else message(texte);
    return;
  }
  if(!form.reportValidity())return;
  try {
    if (await semaine.formulaire(form)||await planning.formulaire(form)) return;
    const data=form.dataset.form==='import'?null:new FormData(form);
    const val=k=>String(data?.get(k)??'').trim();
    if(form.dataset.form==='editer-seance') {
      const item=etat.seances.find(x=>x.id===form.dataset.id);
      if(!val('nom'))throw Error('Saisissez un titre.');
      const debut=new Date(val('date')).getTime();
      const fin=debut+item.fin-item.debut;
      if(!Number.isFinite(debut)||debut<0||fin>8640000000000000)throw Error('Saisissez une date valide.');
      item.nom=val('nom');
      item.notes=val('notes');
      item.debut=debut;
      item.fin=fin;
      item.exercices.forEach((a,i)=>{
        a.note=val('note-'+i);
        a.series.forEach((y,j)=>{
          for(const [champ] of champsSerie(a)) y[champ]=Number(data.get(champ+'-'+i+'-'+j));
          const rpe=val('rpe-'+i+'-'+j);
          if(rpe) y.rpe=Number(rpe); else delete y.rpe;
          y.type=val('type-'+i+'-'+j);
        });
      });
      etat.seances.sort((a,b)=>b.debut-a.debut);
    }
    if(form.dataset.form==='routine') {
      if(!val('nom'))throw Error('Saisissez un nom de routine.');
      const exercices=[...form.querySelectorAll('.cible-routine')].map(ligne=>{
        const champ=nom=>$('[name="'+nom+'"]',ligne).value;
        const exercice={id:champ('ex'),series:Number(champ('series')),reps:Number(champ('reps'))};
        for(const cle of ['kg','repos','secondes','metres']) if(champ(cle)!=='') exercice[cle]=Number(champ(cle));
        for(const cle of ['mesure','note']) if(champ(cle).trim()) exercice[cle]=champ(cle).trim();
        return exercice;
      });
      const r={id:form.dataset.id||uuid(),nom:val('nom'),exercices};
      if(!form.dataset.id&&etat.routines.length>=1000)throw Error('Limite de 1 000 routines atteinte.');
      etat.routines=[r,...etat.routines.filter(a=>a.id!==r.id)];
    }
    if(form.dataset.form==='exercice') {
      if(['nom','muscle','materiel'].some(k=>!val(k)))throw Error('Remplissez le nom, le groupe musculaire et le matériel.');
      const x={id:form.dataset.id||uuid(),nom:val('nom'),muscle:val('muscle'),materiel:val('materiel'),conseil:val('conseil')};
      if(!form.dataset.id&&etat.persos.length>=1000)throw Error('Limite de 1 000 exercices personnels atteinte.');
      const machine=form.dataset.machine==='true';
      if(machine) {
        const submit=form.querySelector('button');
        submit.disabled=true;
        try {
          const ancienne=parId(x.id);
          const photo=data.get('photo');
          x.machine=true;x.zone=val('zone');x.lieu='Salle';
          if(photo?.size) x.photo=await preparerPhoto(photo);
          else if(val('photo-actuelle')!=='retirer'&&ancienne?.photo) x.photo=ancienne.photo;
        } finally {submit.disabled=false;}
        if(!form.isConnected) return;
      }
      const fiches=[...etat.persos.filter(a=>a.id!==x.id),x];
      if(!limitePhotos(fiches)) throw Error('Le carnet a atteint sa limite de photos. Retire une photo existante pour continuer.');
      const anciennes=etat.persos;
      etat.persos=fiches;
      if(machine) {
        try {await sauverImport();}
        catch(erreur) {etat.persos=anciennes;throw erreur;}
      }
      filtre={nom:'',muscle:'',materiel:'',lieu:'',categorie:'',collection:machine?'machines':'personnels'};
      limiteCatalogue=30;
    }
    if(form.dataset.form==='import') {
      const submit=form.querySelector('button');
      submit.disabled=true;
      try {
        form.querySelector('[data-import-etat]').textContent='Lecture du fichier…';
        const parsed=await lireImport(form,tailleSauvegardeMax);
        if(parsed?.format==='cadence-semaine-v1') throw Error('C’est une semaine type. Ouvre Ma semaine → Importer ma semaine.');
        const verifie=verifier(parsed?.format==='cadence-chiffre-v1'?await dechiffrer(parsed,form.elements.code.value.trim()):parsed);
        if(!form.isConnected)return;
        restauration=verifie;
        confirmation('Remplacer le carnet actuel ?','La sauvegarde contient '+restauration.seances.length+' séance(s) et '+restauration.routines.length+' routine(s). Le carnet actuel sera remplacé.','restaurer-ok');
      } finally {submit.disabled=false;}
      return;
    }
    dialogue.close();actualiser();message('Modifications enregistrées.');
  } catch(err) {
    const statut=$('[data-import-etat]',form);
    if(statut) statut.textContent=err.message;
    else message(err.message);
  }
});

try {
  etat=await ouvrir();
  revision=etat.revision??0;
  afficher();
  addEventListener('hashchange',()=>{
    if(dialogue.open) dialogue.close();
    if(chemin()!=='seance') libererEcran();
    afficher(true);
  });
  document.addEventListener('visibilitychange',()=>maintenirEcran().catch(()=>{
    libererEcran();
    $('[data-act="guide-ecran"]')?.setAttribute('aria-pressed','false');
  }));
  setInterval(horloges,1000);
  const indiquerHorsLigne=texte=>{
    etatHorsLigne=texte;
    const statut=$('#etat-hors-ligne');
    if(statut) statut.textContent=texte;
  };
  if(navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready)
      .then(()=>indiquerHorsLigne('Carnet prêt hors ligne. Les vidéos se téléchargent séparément.'))
      .catch(()=>indiquerHorsLigne('Préparation hors ligne indisponible. Réessaie en ouvrant Cadence avec du réseau.'));
  } else indiquerHorsLigne('Le mode hors ligne est indisponible dans ce navigateur.');
} catch (erreur) {
  console.error('Démarrage de Cadence indisponible',erreur);
  vue.innerHTML=titre('STOCKAGE LOCAL','Carnet indisponible','Le navigateur a bloqué l’ouverture du stockage local. Rechargez après avoir autorisé le stockage pour ce site.');
}

