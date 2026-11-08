import { verifierCibleRoutine } from './journal.js';

export const joursSemaine = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
export const indexJour = (date=new Date()) => (date.getDay()+6)%7;
const entier=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const texte=(s,max)=>typeof s==='string'&&s.length<=max;
const semaineVide=()=>({objectif:'',jours:joursSemaine.map(()=>({nom:'Repos',exercices:[]})),active:false});

export function verifierSemaine(source,ids) {
  if (source===undefined) return undefined;
  if (!source || typeof source.active!=='boolean'||!texte(source.objectif,240)||!Array.isArray(source.jours)||source.jours.length!==7)
    throw Error('La semaine doit contenir sept jours et un objectif valide.');
  const jours=source.jours.map(jour=>{
    if (!jour||!texte(jour.nom,120)||!jour.nom.trim()||!Array.isArray(jour.exercices)||jour.exercices.length>20)
      throw Error('Une journée de la semaine est invalide.');
    const exercices=jour.exercices.map(cible=>{
      if (!verifierCibleRoutine(cible,ids)||!entier(cible.repsMax,cible.reps,1000)||!entier(cible.repos,0,600)||!entier(cible.reposMax,cible.repos,600))
        throw Error('Vérifiez les exercices, répétitions et repos de cette semaine.');
      const {id,series,reps,repsMax,repos,reposMax,note}=cible;
      return {id,series,reps,repsMax,repos,reposMax,note};
    });
    return {nom:jour.nom.trim(),exercices};
  });
  return {active:source.active,objectif:source.objectif.trim(),jours};
}

export function cibleTexte(cible) {
  return cible.series+' × '+cible.reps+(cible.repsMax===cible.reps?'':'–'+cible.repsMax)+' rép.';
}
export function reposTexte(cible) {
  const fmt=s=>s<60?s+' s':Math.floor(s/60)+' min'+(s%60?' '+s%60+' s':'');
  return fmt(cible.repos)+(cible.reposMax===cible.repos?'':' à '+fmt(cible.reposMax));
}

export function creerSemaine({etat,parId,tous,e,bout,modal,fermer,actualiser,afficher,aller,demarrer,message,miniature,descriptionPrecedente}) {
  let selection=null;
  const actuel=()=>etat().semaine??semaineVide();
  const courant=()=>selection??indexJour();
  const attrs=i=>'data-i="'+i+'"';
  const titre=(nom,texte)=>'<header><div class="eyebrow">CARNET PERSONNEL</div><h1>'+nom+'</h1><p class="muted">'+texte+'</p></header>';
  const verifier=source=>verifierSemaine(source,new Set(tous().map(x=>x.id)));
  const mutation=semaine=>{etat().semaine=verifier(semaine);fermer();actualiser();};
  function derniereJournee(i) {
    const debut=new Date();
    debut.setHours(0,0,0,0);
    debut.setDate(debut.getDate()-indexJour(debut));
    const fin=new Date(debut);
    fin.setDate(fin.getDate()+7);
    return etat().seances.find(s=>s.semaineJour===i && s.debut>=+debut && s.debut<+fin);
  }
  function rendre() {
    const profil=actuel(), i=courant(), jour=profil.jours[i];
    const aujourdHui=indexJour();
    const navigation='<div class="row spread section"><h2>Ma semaine</h2>'+bout('Revenir à aujourd’hui','semaine-aujourdhui')+'</div>'+
      '<div class="semaine-jours" aria-label="Jours de la semaine">'+joursSemaine.map((nom,n)=>bout(nom.slice(0,3)+'.','semaine-jour',attrs(n)+' aria-label="'+nom+'" aria-pressed="'+(n===i)+'"'+(n===aujourdHui?' aria-current="date"':''),'jour-semaine')).join('')+'</div>';
    const outils='<div class="row">'+bout('Modifier la journée','semaine-editer')+bout('Déplacer la séance','semaine-deplacer')+(jour.exercices.length?bout('Passer ce jour en repos','semaine-repos'):'')+bout('Modifier mon objectif','semaine-objectif')+'</div>';
    const importation=bout('Importer ma semaine','semaine-importer','','primary');
    if (!profil.active) return titre('Ma semaine','Un écran dédié à votre entraînement. Importez une semaine ou composez-la sur cet appareil.')+'<section class="panel stack"><h2>Créer mon carnet personnel</h2><p class="muted">Vos séances, objectifs et charges restent dans votre navigateur.</p><div class="row">'+importation+bout('Partir d’une semaine vide','semaine-activer')+'</div></section>';
    const faite=derniereJournee(i);
    const brouillon=etat().actif;
    const memeSeance=brouillon?.semaineJour===i&&brouillon.nom===jour.nom;
    const sousTitre=memeSeance?'En cours':jour.exercices.length?'Séance prévue':'Repos';
    const reprendre=bout('Reprendre la séance','semaine-reprendre','','primary');
    const action=memeSeance?reprendre:(!brouillon&&jour.exercices.length?
      '<div class="row semaine-demarrage">'+bout('Démarrer la séance','semaine-demarrer','','primary')+
      (jour.exercices.length>1?bout('Choisir par quoi commencer','semaine-choisir-depart'):'')+'</div>':'');
    const autreBrouillon=brouillon&&!memeSeance?'<section class="panel row spread section" aria-label="Séance en cours"><div><p class="eyebrow">SÉANCE EN COURS</p><h2>'+e(brouillon.nom||'Séance sans titre')+'</h2><p class="muted">Terminez cette séance pour en commencer une autre.</p></div>'+reprendre+'</section>':'';
    const historiqueJour=faite?'<section class="panel row spread section" aria-label="Séance enregistrée cette semaine"><div><p class="eyebrow">ENREGISTRÉE CETTE SEMAINE</p><h2>'+e(faite.nom)+'</h2><p class="muted">Séance enregistrée pour le créneau du '+joursSemaine[i].toLocaleLowerCase('fr')+'.</p></div>'+bout('Consulter la séance','details','data-id="'+e(faite.id)+'"')+'</section>':'';
    return titre(i===aujourdHui?'Aujourd’hui':joursSemaine[i],e(profil.objectif)||'Votre semaine d’entraînement')+navigation+autreBrouillon+
      '<section class="panel semaine-hero"><div><p class="eyebrow">'+e(sousTitre)+'</p><h2>'+e(jour.nom)+'</h2><p class="muted">'+jour.exercices.length+' mouvements · '+jour.exercices.reduce((n,x)=>n+x.series,0)+' séries prévues</p></div>'+action+'</section>'+
      (jour.exercices.length?'<h2 class="section">Ordre conseillé</h2>':'')+
      '<ol class="semaine-exercices">'+jour.exercices.map((x,n)=>{
        const ex=parId(x.id);
        if(!ex) return '';
        const img=miniature(ex);
        const historique=descriptionPrecedente(ex);
        return '<li class="panel semaine-exercice"><span class="semaine-numero">'+(n+1)+'</span>'+(img?'<div class="semaine-miniature">'+img+'</div>':'')+'<div><h3>'+e(ex.nom)+'</h3><p class="muted">'+e(ex.equipement||ex.materiel)+(x.note?' · '+e(x.note):'')+'</p><div class="row"><span class="tag">'+e(cibleTexte(x))+'</span><span class="tag">Repos '+e(reposTexte(x))+'</span></div>'+(historique?'<p class="muted semaine-precedent">Précédent · '+e(historique)+'</p>':'')+'</div>'+bout('Voir la fiche','exercice','data-id="'+e(ex.id)+'"')+'</li>';
      }).join('')+'</ol>'+historiqueJour+
      '<details class="panel details section"><summary>Organiser ma semaine</summary><div class="stack section">'+outils+'<div class="row">'+importation+bout('Quitter le mode personnel','semaine-masquer')+'</div></div></details>';
  }
  function ligne(x={}) {
    const select='<select name="id" required>'+tous().map(ex=>'<option value="'+e(ex.id)+'" '+(x.id===ex.id?'selected':'')+'>'+e(ex.nom)+'</option>').join('')+'</select>';
    const champ=(k,nom,v,min,max)=>'<label>'+nom+'<input name="'+k+'" type="number" min="'+min+'" max="'+max+'" required value="'+e(x[k]??v)+'"></label>';
    return '<fieldset class="semaine-ligne"><label>Exercice'+select+'</label><div class="row filters">'+champ('series','Séries',3,1,20)+champ('reps','Rép. min.',8,1,1000)+champ('repsMax','Rép. max.',12,1,1000)+champ('repos','Repos min. (s)',90,0,600)+champ('reposMax','Repos max. (s)',120,0,600)+'</div><label>Repère personnel<input name="note" maxlength="1000" value="'+e(x.note)+'"></label><div class="row">'+bout('Monter','semaine-monter')+bout('Descendre','semaine-descendre')+bout('Retirer cet exercice','semaine-retirer-ligne')+'</div></fieldset>';
  }
  function action(b) {
    const {act,i}=b.dataset;
    switch(act) {
      case 'semaine-jour': selection=Number(i);afficher();document.querySelector('.jour-semaine[aria-pressed=true]')?.focus();break;
      case 'semaine-aujourdhui': selection=null;afficher();document.querySelector('.jour-semaine[aria-current=date]')?.focus();break;
      case 'semaine-activer': mutation({...actuel(),active:true});break;
      case 'semaine-masquer': mutation({...actuel(),active:false});break;
      case 'semaine-reprendre': aller('seance');break;
      case 'semaine-choisir-depart': {
        const jour=actuel().jours[courant()];
        modal('Par quoi veux-tu commencer ?', '<p class="muted">Choisis un exercice. Les numéros indiquent l’ordre conseillé de ta séance.</p><div class="stack choix-ordre">'+jour.exercices.map((x,n)=>{
          const ex=parId(x.id);
          return bout('<span>'+String(n+1)+'. '+e(ex.nom)+'</span><small>'+e(ex.equipement||ex.materiel)+'</small>','semaine-depart-ex',attrs(n));
        }).join('')+'</div>');
        break;
      }
      case 'semaine-demarrer':
      case 'semaine-depart-ex': {
        const jour=actuel().jours[courant()];
        const depart=act==='semaine-depart-ex'?Number(i):0;
        if(jour.exercices[depart]) {
          fermer();
          demarrer(jour,undefined,courant(),depart);
        }
        break;
      }
      case 'semaine-importer':
        modal('Importer ma semaine','<form class="stack" data-form="semaine-import"><label>Fichier de semaine Cadence<input type="file" name="fichier" accept=".json,application/json" required></label><p class="muted">L’import remplace votre semaine type. Votre historique, vos routines et votre séance en cours sont conservés.</p><button class="primary">Importer la semaine</button></form>');break;
      case 'semaine-editer': {
        const j=actuel().jours[courant()];
        modal('Modifier '+joursSemaine[courant()],'<form class="stack" data-form="semaine-edition"><label>Titre de la journée<input name="nom" maxlength="120" value="'+e(j.nom)+'" required></label><div id="semaine-lignes" class="stack">'+j.exercices.map(ligne).join('')+'</div><div class="row">'+bout('Ajouter un exercice','semaine-ajouter-ligne')+'<button class="primary">Enregistrer la journée</button></div><p class="muted">Retirez tous les exercices pour en faire une journée de repos.</p></form>');break;
      }
      case 'semaine-ajouter-ligne': {
        const lignes=document.querySelector('#semaine-lignes');
        if(lignes.children.length<20) lignes.insertAdjacentHTML('beforeend',ligne());
        break;
      }
      case 'semaine-retirer-ligne': b.closest('fieldset').remove();break;
      case 'semaine-monter':
      case 'semaine-descendre': {
        const ligne=b.closest('fieldset');
        const voisin=act==='semaine-monter'?ligne.previousElementSibling:ligne.nextElementSibling;
        if(voisin) {
          if(act==='semaine-monter') voisin.before(ligne);
          else voisin.after(ligne);
          b.focus();
        }
        break;
      }
      case 'semaine-repos':
        modal('Passer '+joursSemaine[courant()]+' en repos','<p>Les cibles de ce jour seront retirées de la semaine type. Vos séances enregistrées sont conservées.</p>'+bout('Confirmer le repos','semaine-repos-ok','','primary'));break;
      case 'semaine-repos-ok': {
        const copie=structuredClone(actuel());
        copie.jours[courant()]={nom:'Repos',exercices:[]};
        mutation(copie);
        break;
      }
      case 'semaine-objectif':
        modal('Mon objectif','<form class="stack" data-form="semaine-objectif"><label>Priorité d’entraînement<textarea name="objectif" maxlength="240">'+e(actuel().objectif)+'</textarea></label><button class="primary">Enregistrer</button></form>');break;
      case 'semaine-deplacer':
        modal('Déplacer la séance','<form class="stack" data-form="semaine-deplacer"><label>Échanger cette journée avec<select name="jour">'+joursSemaine.map((nom,n)=>n===courant()?'':'<option value="'+n+'">'+nom+'</option>').join('')+'</select></label><button class="primary">Échanger les journées</button></form>');break;
      default: return false;
    }
    return true;
  }
  async function formulaire(form) {
    const type=form.dataset.form;
    if (!['semaine-import','semaine-edition','semaine-objectif','semaine-deplacer'].includes(type)) return false;
    const data=new FormData(form);
    const copie=structuredClone(actuel());
    if(type==='semaine-import') {
      const f=data.get('fichier');
      if(!f?.size||f.size>100000) throw Error('Choisissez un fichier de semaine JSON de moins de 100 ko.');
      const submit=form.querySelector('button');
      submit.disabled=true;
      try {
        let source;
        try { source=JSON.parse(await f.text()); } catch { throw Error('Le fichier de semaine n’est pas un JSON valide.'); }
        if(!form.isConnected) return true;
        if(source?.format!=='cadence-semaine-v1') throw Error('Ce fichier n’est pas une semaine Cadence.');
        mutation({...source.semaine,active:true});
        selection=null;
        afficher();
      } finally {submit.disabled=false;}
    } else if(type==='semaine-edition') {
      const exercices=[...form.querySelectorAll('fieldset')].map(l=>{
        const champ=k=>l.querySelector('[name="'+k+'"]').value;
        return {id:champ('id'),note:champ('note').trim(),...Object.fromEntries(['series','reps','repsMax','repos','reposMax'].map(k=>[k,Number(champ(k))]))};
      });
      copie.jours[courant()]={nom:String(data.get('nom')).trim()||'Repos',exercices};
      mutation(copie);
    } else if(type==='semaine-objectif') {
      copie.objectif=String(data.get('objectif'));
      mutation(copie);
    } else {
      const i=courant(), j=Number(data.get('jour'));
      if(!entier(j,0,6)||j===i) throw Error('Choisissez un autre jour.');
      [copie.jours[i],copie.jours[j]]=[copie.jours[j],copie.jours[i]];
      selection=j;
      mutation(copie);
    }
    message('Semaine enregistrée sur cet appareil.');
    return true;
  }
  return {rendre,action,formulaire};
}
