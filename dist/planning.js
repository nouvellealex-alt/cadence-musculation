import { modes, verifierCibleRoutine } from './journal.js';
import { lireImport, collageImport } from './semaine.js';

const fr = new Intl.DateTimeFormat('fr-FR', {dateStyle:'full'});
const moisFr = new Intl.DateTimeFormat('fr-FR', {month:'long', year:'numeric'});
const joursCourts = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];
const objectifDefaut = 3;
const maxCreneaux = 1500;
const maxMetadonnees = 1000;
const nomValide = (value, max=120) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const entier = (n,min,max) => Number.isInteger(n) && n >= min && n <= max;
const e = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const bouton = (label, action, attrs='', classe='') => '<button type="button" class="'+classe+'" data-act="'+action+'" '+attrs+'>'+label+'</button>';

export function jourLocal(date = new Date()) {
  const n = value => String(value).padStart(2, '0');
  return String(date.getFullYear()).padStart(4, '0')+'-'+n(date.getMonth()+1)+'-'+n(date.getDate());
}

function dateLocale(jour) {
  const [a,m,j] = jour.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(a,m-1,j);
  date.setHours(12,0,0,0);
  return date;
}

function jourValide(jour) {
  return typeof jour === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(jour) && Number(jour.slice(0,4)) >= 1970 && jourLocal(dateLocale(jour)) === jour;
}

export function ajouterJours(jour, n) {
  const date = dateLocale(jour);
  date.setDate(date.getDate()+n);
  return jourLocal(date);
}

export function debutSemaine(jour) {
  return ajouterJours(jour,-((dateLocale(jour).getDay()+6)%7));
}

function repertoireVide() {
  return {objectif:objectifDefaut,creneaux:[],metadonnees:[]};
}

function verifierRoutine(r, ids) {
  const erreur = () => { throw Error('Cette routine contient une fiche absente ou des objectifs invalides.'); };
  if (!r || !nomValide(r.nom) || !Array.isArray(r.exercices) || !r.exercices.length || r.exercices.length > 60) erreur();
  const exercices = r.exercices.map(x=>{
    if (!verifierCibleRoutine(x,ids)) erreur();
    const {id,series,reps,kg,repos,note,mesure,secondes,metres} = x;
    return {id,series,reps,kg,repos,note,mesure,secondes,metres};
  });
  return {nom:r.nom.trim(),exercices};
}

function exercicePartage(x) {
  if (!x || ![x.id,x.nom,x.muscle,x.materiel].every(v=>nomValide(v)) ||
    typeof x.conseil!=='string' || x.conseil.length>1000 ||
    (x.mesure!==undefined && !Object.hasOwn(modes,x.mesure))) {
    throw Error('Le fichier contient une définition d’exercice personnel invalide.');
  }
  const {id,nom,muscle,materiel,conseil,mesure}=x;
  return {id,nom,muscle,materiel,conseil,mesure};
}

export function importerRoutine(contenu, persos, parId, identifiant=()=>crypto.randomUUID()) {
  if (contenu?.format!=='cadence-routine-v1' || !Array.isArray(contenu.routine?.exercices) || contenu.routine.exercices.length>60) {
    throw Error('Ce fichier n’est pas une routine Cadence.');
  }
  const definitions=contenu.exercicesPersonnels??[];
  if (!Array.isArray(definitions) || definitions.length>60) throw Error('Le fichier contient trop de définitions personnelles.');
  const references=new Set(contenu.routine.exercices.filter(Boolean).map(x=>x.id));
  const aliases=new Map();
  const nouveaux=[];
  for (const brut of definitions) {
    const definition=exercicePartage(brut);
    if (!references.has(definition.id) || aliases.has(definition.id)) throw Error('Le fichier contient des définitions personnelles incohérentes.');
    const local=persos.find(x=>x.id===definition.id);
    if (local && JSON.stringify(exercicePartage(local))===JSON.stringify(definition)) {
      aliases.set(definition.id,local.id);
    } else {
      const gardeId=/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(definition.id) && !parId(definition.id);
      const id=gardeId ? definition.id : identifiant();
      aliases.set(definition.id,id);
      nouveaux.push({...definition,id});
    }
  }
  if (persos.length+nouveaux.length>1000) throw Error('L’import dépasserait la limite de 1 000 exercices personnels.');
  const ids=new Set([...references].filter(id=>parId(id)||aliases.has(id)));
  const r=verifierRoutine(contenu.routine,ids);
  r.exercices=r.exercices.map(x=>({...x,id:aliases.get(x.id)??x.id}));
  return {routine:r,nouveaux};
}

export function verifierPlanning(value, ids) {
  if (value === undefined) return repertoireVide();
  const erreur = () => { throw Error('Le planning de cette sauvegarde est incompatible.'); };
  if (!value || !entier(value.objectif,1,7) || !Array.isArray(value.creneaux) || value.creneaux.length > maxCreneaux || !Array.isArray(value.metadonnees) || value.metadonnees.length > maxMetadonnees) erreur();
  const creneaux = value.creneaux.map(p=>{
    if (!p || !nomValide(p.id) || !jourValide(p.jour) || (p.programme!==undefined && !nomValide(p.programme))) erreur();
    return {id:p.id,jour:p.jour,programme:p.programme,...verifierRoutine(p,ids)};
  });
  const metadonnees = value.metadonnees.map(m=>{
    if (!m || !nomValide(m.id) || typeof m.favori !== 'boolean' || typeof m.dossier !== 'string' || m.dossier.length > 60) erreur();
    return {id:m.id,favori:m.favori,dossier:m.dossier.trim()};
  });
  for (const liste of [creneaux,metadonnees]) {
    if (new Set(liste.map(x=>x.id)).size!==liste.length) erreur();
  }
  return {objectif:value.objectif,creneaux,metadonnees};
}

const seanceModele = (nom, offset, cibles) => ({nom,offset,exercices:cibles.map(([id,series,reps])=>({id,series,reps}))});

export const programmes = [
  {
    id:'progression-salle', nom:'Premiers repères en salle', public:'Débutant · barre et machines', description:'Deux séances corps entier espacées. Retrouvez les mêmes mouvements chaque semaine pour comparer vos séries.',
    seances:[
      seanceModele('Salle · corps entier A',0,[['sq',3,8],['dc',3,8],['row',3,10]]),
      seanceModele('Salle · corps entier B',3,[['pre',3,10],['di',3,10],['tir',3,10],['cur',2,12]])
    ]
  },{
    id:'partage-haut-bas', nom:'Haut et bas du corps', public:'Intermédiaire · salle équipée', description:'Trois séances par semaine. Deux séances haut du corps encadrent une séance jambes et hanches.',
    seances:[
      seanceModele('Haut du corps A',0,[['dc',3,8],['row',3,10],['lat',2,12],['tri',2,12]]),
      seanceModele('Jambes et hanches',2,[['sq',3,8],['rou',3,10],['mol',2,15]]),
      seanceModele('Haut du corps B',4,[['di',3,10],['tir',3,10],['lat',2,12],['cur',2,12]])
    ]
  },{
    id:'chez-soi', nom:'À la maison sans matériel', public:'Débutant · au sol', description:'Deux séances au poids du corps par semaine, accessibles sans banc ni barre de traction.',
    seances:[
      seanceModele('Maison · corps entier A',0,[['pom',3,6],['fen',3,8],['cr',2,12]]),
      seanceModele('Maison · corps entier B',3,[['fen',3,10],['pom',3,8],['cr',2,15]])
    ]
  },{
    id:'paire-halteres', nom:'Avec une paire d’haltères', public:'Intermédiaire · haltères et banc', description:'Deux séances avec des mouvements de poussée, de tirage et des fentes au poids du corps.',
    seances:[
      seanceModele('Haltères · poussée et jambes',0,[['di',3,10],['fen',3,10],['lat',2,12]]),
      seanceModele('Haltères · tirage et tronc',3,[['rowh',3,10],['cur',2,12],['cr',2,15]])
    ]
  }
];

export function developperProgramme(programme, debut, semaines, identifiant=()=>crypto.randomUUID()) {
  if (!jourValide(debut) || !entier(semaines,2,8)) throw Error('Choisissez une date et une durée comprise entre 2 et 8 semaines.');
  return Array.from({length:semaines},(_,semaine)=>programme.seances.map(({offset,nom,exercices})=>({
    id:identifiant(),
    jour:ajouterJours(debut,semaine*7+offset),
    nom,
    programme:programme.nom,
    exercices:exercices.map(x=>({...x}))
  }))).flat();
}

export function creerPlanning({etat,modeles,parId,modal,fermer,actualiser,afficher=actualiser,demarrer,message,proposerSemaine,sauver}) {
  let dateActive = jourLocal();
  const planning = () => etat().planning ??= repertoireVide();
  const routines = () => [...etat().routines,...modeles];
  const routine = id => routines().find(r=>r.id===id);
  const attr = id => 'data-id="'+e(id)+'"';
  const dico = exercices => new Set(exercices.map(x=>x.id).filter(id=>parId(id)));
  const meta = id => planning().metadonnees.find(x=>x.id===id) ?? {id,favori:false,dossier:''};
  const etatPlan = id => planning().creneaux.find(x=>x.id===id);
  const fait = id => etat().seances.find(x=>x.planId===id);
  const actif = id => etat().actif?.planId === id;
  const nomRoutine = () => routines().map(r=>'<option value="'+e(r.id)+'">'+e(r.nom)+'</option>').join('');

  function modifierMeta(id, valeurs) {
    const entrees = planning().metadonnees.filter(x=>x.id!==id && etat().routines.some(r=>r.id===x.id));
    const prochaine = {...meta(id),...valeurs};
    planning().metadonnees = prochaine.dossier || prochaine.favori ? [...entrees,prochaine] : entrees;
  }

  function afficherDate(jour, focus) {
    if (!jourValide(jour)) return;
    dateActive=jour;
    afficher();
    if (focus) document.querySelector(focus)?.focus();
  }

  function controleMois(delta, selecteur) {
    const date=dateLocale(dateActive);
    date.setDate(1);
    date.setMonth(date.getMonth()+delta);
    afficherDate(jourLocal(date),selecteur);
  }

  function indexer() {
    const jours = new Map();
    const obtenir = j => {
      if (!jours.has(j)) jours.set(j,{prevus:[],realises:[]});
      return jours.get(j);
    };
    const faits=new Map(etat().seances.filter(x=>x.planId).map(x=>[x.planId,x]));
    for (const x of etat().seances) obtenir(jourLocal(new Date(x.debut))).realises.push(x);
    for (const p of planning().creneaux) obtenir(p.jour).prevus.push({p,seance:faits.get(p.id)});
    return jours;
  }

  function carteJour(jour, donnees) {
    const {prevus=[],realises=[]} = donnees ?? {};
    const entrees = prevus.map(({p,seance})=>{
      const groupe = p.programme ? '<small>'+e(p.programme)+'</small>' : '';
      const enCours=actif(p.id);
      const statut = seance ? '<span class="planning-label done">Réalisée</span>' : '<span class="planning-label">'+(enCours?'En cours':'Prévue')+'</span>';
      const controles = seance ? bouton('Consulter','details',attr(seance.id)) : enCours ? bouton('Reprendre','ouvrir-seance','','primary') :
        bouton('Démarrer','planning-demarrer',attr(p.id),'primary')+
        bouton('Déplacer','planning-deplacer',attr(p.id))+
        bouton('Retirer','planning-retirer',attr(p.id));
      return '<article class="planning-entree"><div>'+statut+'<h3>'+e(p.nom)+'</h3>'+groupe+'</div><div class="row">'+controles+'</div></article>';
    });
    const lies = new Set(prevus.map(({seance})=>seance?.id).filter(Boolean));
    for (const s of realises) {
      if (!lies.has(s.id)) entrees.push('<article class="planning-entree"><div><span class="planning-label done">Réalisée</span><h3>'+e(s.nom)+'</h3></div>'+bouton('Consulter','details',attr(s.id))+'</article>');
    }
    return '<section class="panel planning-jour" aria-labelledby="planning-jour-titre"><div class="row spread"><h2 id="planning-jour-titre">'+e(fr.format(dateLocale(jour)))+'</h2>'+bouton('＋ Planifier une séance','planning-ajouter','','primary')+'</div>'+
      (entrees.length?'<div class="stack">'+entrees.join('')+'</div>':'<p class="muted planning-vide">Aucune séance à cette date.</p>')+'</section>';
  }

  function calendrier(index) {
    const mois = dateActive.slice(0,7);
    const debut = debutSemaine(mois+'-01');
    const semaine = debutSemaine(jourLocal());
    const fin = ajouterJours(semaine,7);
    const objectif = planning().objectif;
    const n = etat().seances.filter(s=>{const j=jourLocal(new Date(s.debut));return j>=semaine&&j<fin;}).length;
    const jours = Array.from({length:42},(_,i)=>{
      const j=ajouterJours(debut,i);
      const {prevus=[],realises=[]}=index.get(j)??{};
      const prevu=prevus.filter(x=>!x.seance).length;
      const fait=realises.length+prevus.filter(x=>x.seance&&jourLocal(new Date(x.seance.debut))!==j).length;
      const indication=e(fr.format(dateLocale(j))+', '+prevu+' prévue(s), '+fait+' réalisée(s)');
      return '<button type="button" class="planning-date'+(j.startsWith(mois)?'':' autre-mois')+'" data-act="planning-jour" data-jour="'+j+'" aria-label="'+indication+'" aria-pressed="'+(dateActive===j)+'"'+(j===jourLocal()?' aria-current="date"':'')+'>'+Number(j.slice(-2))+
        '<span aria-hidden="true" class="planning-points">'+(prevu?'<i></i>':'')+(fait?'<i class="done"></i>':'')+'</span></button>';
    }).join('');
    return '<div class="planning-layout"><section class="panel calendrier" aria-labelledby="planning-mois"><div class="row spread"><h2 id="planning-mois">'+e(moisFr.format(dateLocale(dateActive)))+'</h2><div class="row planning-mois-actions">'+
      bouton('‹','planning-precedent','aria-label="Mois précédent"')+bouton('Aujourd’hui','planning-aujourdhui')+bouton('›','planning-suivant','aria-label="Mois suivant"')+'</div></div>'+
      '<div class="planning-grille"><div class="planning-semaine" aria-hidden="true">'+joursCourts.map(j=>'<span>'+j+'</span>').join('')+'</div><div class="planning-dates">'+jours+'</div></div><div class="planning-legende"><span><i></i> Prévue</span><span><i class="done"></i> Réalisée</span></div></section>'+
      '<div class="stack planning-lateral"><section class="panel planning-objectif"><div class="row spread"><h2>Objectif de la semaine</h2>'+bouton('Ajuster','planning-objectif')+'</div><p><strong>'+n+' / '+objectif+'</strong> séances réalisées</p><progress value="'+Math.min(n,objectif)+'" max="'+objectif+'" aria-label="Séances réalisées cette semaine"></progress></section>'+carteJour(dateActive,index.get(dateActive))+'</div></div>';
  }

  function rendre() {
    return '<header><div class="eyebrow">ORGANISATION</div><h1>Planning</h1><p class="muted">Planifiez vos séances et retrouvez votre rythme au fil des semaines.</p></header>'+
      calendrier(indexer())+
      '<section class="section" aria-labelledby="planning-programmes"><h2 id="planning-programmes">Programmes guidés</h2><p class="muted">Ajoutez 2 à 8 semaines d’entraînement au calendrier. Chaque séance peut ensuite être déplacée.</p><div class="grid two">'+programmes.map(p=>
        '<article class="panel planning-programme"><span class="tag">'+p.seances.length+' séances par semaine</span><h3>'+e(p.nom)+'</h3><p class="muted">'+e(p.public)+'</p><p>'+e(p.description)+'</p>'+bouton('Voir le programme','planning-programme',attr(p.id))+'</article>').join('')+'</div></section>';
  }

  function ouvrirAjout(id) {
    const choisie = routine(id);
    const select = choisie ? '<p>'+e(choisie.nom)+'</p>' : '<label>Routine<select name="routine" required>'+nomRoutine()+'</select></label>';
    modal('Planifier une séance','<form class="stack" data-form="planning-ajouter" data-id="'+e(choisie?.id)+'">'+select+'<label>Date de la séance<input type="date" name="jour" value="'+e(dateActive)+'" min="1970-01-01" max="9999-12-31" required></label><button class="primary">Ajouter au planning</button></form>');
  }

  function action(b) {
    const {act,id,jour}=b.dataset;
    if (!act?.startsWith('planning-')) return false;
    switch (act) {
      case 'planning-jour': afficherDate(jour,'[data-act="planning-jour"][aria-pressed="true"]'); break;
      case 'planning-precedent': controleMois(-1,'[data-act="planning-precedent"]'); break;
      case 'planning-suivant': controleMois(1,'[data-act="planning-suivant"]'); break;
      case 'planning-aujourdhui': afficherDate(jourLocal(),'[data-act="planning-aujourdhui"]'); break;
      case 'planning-ajouter': ouvrirAjout(id); break;
      case 'planning-objectif':
        modal('Ajuster l’objectif','<form class="stack" data-form="planning-objectif"><label>Séances par semaine<input type="number" name="objectif" min="1" max="7" value="'+planning().objectif+'" required></label><button class="primary">Enregistrer</button></form>'); break;
      case 'planning-programme': {
        const p = programmes.find(x=>x.id===id);
        if (!p) return true;
        modal(e(p.nom),'<form class="stack" data-form="planning-programme" data-id="'+e(id)+'"><p>'+e(p.description)+'</p><ol>'+p.seances.map(s=>'<li><strong>'+e(s.nom)+'</strong><br><small>'+s.exercices.map(x=>e(parId(x.id)?.nom)+' · '+x.series+' × '+x.reps).join(', ')+'</small></li>').join('')+
          '</ol><label>Début du programme<input type="date" name="jour" value="'+e(dateActive)+'" min="1970-01-01" max="9999-12-31" required></label><label>Durée en semaines<input type="number" name="semaines" min="2" max="8" value="4" required></label><button class="primary">Planifier le programme</button></form>');
        break;
      }
      case 'planning-deplacer': {
        const p=etatPlan(id);
        if (!p || fait(id) || actif(id)) return true;
        modal('Déplacer la séance','<form class="stack" data-form="planning-deplacer" data-id="'+e(id)+'"><p>'+e(p.nom)+'</p><label>Nouvelle date<input type="date" name="jour" value="'+e(p.jour)+'" min="1970-01-01" max="9999-12-31" required></label><button class="primary">Déplacer</button></form>');
        break;
      }
      case 'planning-retirer': {
        const p=etatPlan(id);
        if (!p || fait(id) || actif(id)) return true;
        modal('Retirer la séance prévue','<p>Retirer « '+e(p.nom)+' » du planning ?</p>'+bouton('Confirmer le retrait','planning-retirer-ok',attr(id),'danger'));
        break;
      }
      case 'planning-retirer-ok':
        if (fait(id) || actif(id)) return true;
        planning().creneaux=planning().creneaux.filter(p=>p.id!==id);
        fermer(); actualiser(); message('Séance retirée du planning.'); break;
      case 'planning-demarrer': {
        const p=etatPlan(id);
        if (p && !fait(id)) demarrer(p,id);
        break;
      }
      case 'planning-favori':
        if (etat().routines.some(r=>r.id===id)) {
          modifierMeta(id,{favori:!meta(id).favori});
          actualiser();
          document.querySelector('[data-act="planning-favori"][data-id="'+CSS.escape(id)+'"]')?.focus();
        }
        break;
      case 'planning-dossier':
        if (etat().routines.some(r=>r.id===id)) {
          modal('Classer la routine','<form class="stack" data-form="planning-dossier" data-id="'+e(id)+'"><label>Dossier<input name="dossier" maxlength="60" value="'+e(meta(id).dossier)+'" placeholder="Par exemple, Haut du corps"></label><p class="muted">Un champ vide place la routine dans « Sans dossier ».</p><button class="primary">Enregistrer</button></form>');
        }
        break;
      case 'planning-export-routine': {
        const r = routine(id);
        if (!r) return true;
        const ids=dico(r.exercices);
        const exercicesPersonnels=etat().persos.filter(x=>ids.has(x.id)).map(exercicePartage);
        const fichier = {format:'cadence-routine-v1',routine:verifierRoutine(r,ids),exercicesPersonnels};
        const url=URL.createObjectURL(new Blob([JSON.stringify(fichier,null,2)],{type:'application/json'}));
        const lien=document.createElement('a');
        lien.href=url;
        lien.download='cadence-routine.json';
        lien.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        break;
      }
      case 'planning-import-routine':
        modal('Importer une routine','<form class="stack" data-form="planning-import-routine"><label>Fichier de routine Cadence<input name="fichier" type="file"></label>'+collageImport+'<p class="muted">Choisis une routine exportée depuis Cadence ou ton fichier de semaine personnelle.</p><button class="primary">Importer</button></form>'); break;
      default: return false;
    }
    return true;
  }

  async function formulaire(form) {
    const {form:nom,id} = form.dataset;
    if (!nom?.startsWith('planning-')) return false;
    const data=nom==='planning-import-routine'?null:new FormData(form);
    const jour=data?.get('jour');
    let confirmation='';
    switch(nom) {
      case 'planning-ajouter': {
        const r=routine(id||data.get('routine'));
        if (!r || !jourValide(jour)) throw Error('Choisissez une routine et une date valides.');
        if (planning().creneaux.length>=maxCreneaux) throw Error('Le planning a atteint sa limite de '+maxCreneaux+' séances.');
        planning().creneaux.push({id:crypto.randomUUID(),jour,...verifierRoutine(r,dico(r.exercices))});
        dateActive=jour;
        confirmation='Séance ajoutée au planning.';
        break;
      }
      case 'planning-deplacer': {
        const p=etatPlan(id);
        if (!p || fait(id) || actif(id) || !jourValide(jour)) throw Error('Cette séance ne peut pas être déplacée.');
        p.jour=jour;
        dateActive=jour;
        confirmation='Séance déplacée.';
        break;
      }
      case 'planning-programme': {
        const programme=programmes.find(x=>x.id===id);
        if (!programme) throw Error('Ce programme est indisponible.');
        const creneaux=developperProgramme(programme,jour,Number(data.get('semaines')));
        if (creneaux.some(p=>!jourValide(p.jour))) throw Error('Ce programme dépasse les dates prises en charge.');
        if (planning().creneaux.length+creneaux.length>maxCreneaux) throw Error('Ce programme dépasserait la limite de '+maxCreneaux+' séances planifiées.');
        const datesExistantes=new Set(planning().creneaux.filter(p=>p.programme===programme.nom).map(p=>p.jour));
        if (creneaux.some(p=>datesExistantes.has(p.jour))) throw Error('Ce programme contient des séances déjà prévues aux mêmes dates.');
        planning().creneaux.push(...creneaux);
        dateActive=jour;
        confirmation=creneaux.length+' séances ajoutées au planning.';
        break;
      }
      case 'planning-objectif': {
        const objectif=Number(data.get('objectif'));
        if (!entier(objectif,1,7)) throw Error('Choisissez entre 1 et 7 séances.');
        planning().objectif=objectif;
        confirmation='Objectif enregistré.';
        break;
      }
      case 'planning-dossier':
        if (!etat().routines.some(r=>r.id===id)) throw Error('Cette routine est indisponible.');
        modifierMeta(id,{dossier:String(data.get('dossier')??'').trim().slice(0,60)});
        confirmation='Routine classée.';
        break;
      case 'planning-import-routine': {
        const submit=form.querySelector('button');
        submit.disabled=true;
        try {
          form.querySelector('[data-import-etat]').textContent='Lecture du fichier…';
          const contenu=await lireImport(form,256*1024);
          if (!form.isConnected) return true;
          if (contenu?.format==='cadence-semaine-v1') {proposerSemaine(contenu);return true;}
          if (contenu?.schema||contenu?.format==='cadence-chiffre-v1') throw Error('C’est une sauvegarde complète. Ouvre Plus → Données → Restaurer un fichier.');
          if (etat().routines.length>=1000) throw Error('Le carnet contient déjà 1 000 routines.');
          const {routine:r,nouveaux}=importerRoutine(contenu,etat().persos,parId);
          const id=crypto.randomUUID();
          const anciennesRoutines=etat().routines, anciensPersos=etat().persos;
          etat().persos=[...anciensPersos,...nouveaux];
          etat().routines=[{id,...r},...anciennesRoutines];
          try { await sauver(); }
          catch(erreur) {etat().routines=anciennesRoutines;etat().persos=anciensPersos;throw erreur;}
          fermer();afficher();message('Routine importée.');
          return true;
        } finally {submit.disabled=false;}
      }
      default: return false;
    }
    fermer();
    actualiser();
    message(confirmation);
    return true;
  }

  function groupesRoutines() {
    const groupes = new Map();
    for (const r of etat().routines) {
      const m=meta(r.id);
      if (!groupes.has(m.dossier)) groupes.set(m.dossier,[]);
      groupes.get(m.dossier).push(r);
    }
    return [...groupes].sort(([a],[b])=>a.localeCompare(b,'fr')).map(([dossier,rs])=>({
      nom:dossier||'Sans dossier',
      routines:rs.sort((a,b)=>Number(meta(b.id).favori)-Number(meta(a.id).favori))
    }));
  }

  function boutonsRoutine(r) {
    const id=attr(r.id);
    const favori=meta(r.id).favori;
    return bouton('Planifier','planning-ajouter',id)+bouton('Exporter','planning-export-routine',id)+
      (etat().routines.includes(r)?bouton(favori?'★ Favori':'☆ Favori','planning-favori',id+' aria-label="Routine favorite" aria-pressed="'+favori+'"','planning-favori')+bouton('Classer','planning-dossier',id):'');
  }

  return {rendre,action,formulaire,groupesRoutines,boutonsRoutine,boutonImporter:()=>bouton('Importer une routine','planning-import-routine')};
}

