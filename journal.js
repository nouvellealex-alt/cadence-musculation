export const modes = {
  charge: 'Charge et répétitions',
  corps: 'Poids du corps',
  lest: 'Poids du corps avec lest',
  assistance: 'Poids du corps assisté',
  duree: 'Durée',
  distance: 'Distance et durée'
};

export const types = ['Travail', 'Échauffement', 'Dégressive', 'Échec'];
export const mesureValide = mesure => typeof mesure === 'string' && Object.hasOwn(modes,mesure);
export const mode = exercice => mesureValide(exercice?.mesure) ? exercice.mesure : 'charge';

const charge = ['kg', 'Charge (kg)', 'Charge', 0, 2000, 'any'];
const reps = ['reps', 'Rép.', 'Répétitions', 1, 1000, 1];
const duree = ['secondes', 'Durée (s)', 'Durée en secondes', 1, 86400, 1];
const metres = ['metres', 'Distance (m)', 'Distance en mètres', 1, 1000000, 'any'];
const champs = {
  charge: [charge, reps],
  corps: [reps],
  lest: [['kg', 'Lest (kg)', 'Lest', 0, 2000, 'any'], reps],
  assistance: [['kg', 'Aide (kg)', 'Assistance', 0, 2000, 'any'], reps],
  duree: [duree],
  distance: [metres, duree]
};

export const effort = ['rpe', 'RPE (facultatif)', 'RPE', 1, 10, 0.5];
export const champsSerie = exercice => champs[mode(exercice)];
export const groupesSuperset = ['A', 'B', 'C', 'D', 'E', 'F'];
const dansIntervalle = (n,min,max) => Number.isFinite(n) && n >= min && n <= max;
const entier = (n,min,max) => Number.isInteger(n) && dansIntervalle(n,min,max);

export function verifierCibleRoutine(e, ids) {
  return e && ids.has(e.id) && entier(e.series,1,20) && entier(e.reps,1,1000) &&
    (e.kg === undefined || dansIntervalle(e.kg,0,2000)) &&
    (e.repos === undefined || entier(e.repos,0,600)) &&
    (e.note === undefined || (typeof e.note === 'string' && e.note.length <= 1000)) &&
    (e.mesure === undefined || mesureValide(e.mesure)) &&
    (e.secondes === undefined || entier(e.secondes,1,86400)) &&
    (e.metres === undefined || dansIntervalle(e.metres,1,1000000));
}

export function initialiserSerie(mesure, modele = {}) {
  const {kg = 0, reps = 8, secondes = 30, metres = 100, rpe} = modele;
  const s = {kg, reps, type: 'Travail', faite: false};
  if (mesure === 'duree' || mesure === 'distance') s.secondes = secondes;
  if (mesure === 'distance') s.metres = metres;
  if (rpe != null) s.rpe = rpe;
  return s;
}

export function decrireSerie(exercice, s, format) {
  switch (mode(exercice)) {
    case 'corps': return format(s.reps)+' rép.';
    case 'lest': return '+'+format(s.kg)+' kg × '+s.reps;
    case 'assistance': return format(s.kg)+' kg d’aide × '+s.reps;
    case 'duree': return format(s.secondes)+' s';
    case 'distance': return format(s.metres)+' m en '+format(s.secondes)+' s';
    default: return format(s.kg)+' kg × '+s.reps;
  }
}

export function volumeSerie(exercice, serie) {
  return mode(exercice) === 'charge' && serie.faite ? serie.kg * serie.reps : 0;
}

export const groupeMesure = exercice => JSON.stringify([exercice.id, mode(exercice)]);

export function mesureProgression(exercice, series) {
  const mesure = mode(exercice);
  if (mesure === 'duree') return Math.max(...series.map(s => s.secondes));
  if (mesure === 'distance') return Math.max(...series.map(s => s.metres));
  if (mesure === 'corps') return Math.max(...series.map(s => s.reps));
  if (mesure === 'assistance') return Math.min(...series.map(s => s.kg));
  return Math.max(...series.map(s => s.kg));
}

export const indicateurs = {
  charge: ['Charge maximale', 'kg'],
  corps: ['Répétitions maximales', 'rép.'],
  lest: ['Lest maximal', 'kg'],
  assistance: ['Assistance minimale', 'kg'],
  duree: ['Durée maximale', 's'],
  distance: ['Distance maximale', 'm']
};

export function reposApres(exercices, exercice, numero, defaut) {
  if (exercice.superset && exercices.some(x => x !== exercice && x.superset === exercice.superset &&
    x.series[numero] && !x.series[numero].faite)) return 0;
  return exercice.repos ?? defaut;
}

export function disques(chargeTotale, barre) {
  const resultat = [];
  let reste = Math.max(0,Math.floor((chargeTotale-barre)*500+1e-6));
  for (const masse of [25000,20000,15000,10000,5000,2500,1250]) {
    const quantite = Math.floor(reste/masse);
    if(quantite) resultat.push({kg:masse/1000,quantite});
    reste%=masse;
  }
  return {disques:resultat,chargeReelle:barre+resultat.reduce((n,d)=>n+2*d.kg*d.quantite,0)};
}

function celluleCSV(v) {
  if (typeof v === 'number') return String(v).replace('.',',');
  const texte = String(v ?? '');
  const protege = /^(?:[\t\r\n]|\s*[=+@-])/.test(texte) ? "'"+texte : texte;
  return '"'+protege.replaceAll('"','""')+'"';
}

export function csvSeances(seances) {
  const lignes = [['Date ISO', 'Séance', 'Exercice', 'Mode', 'Série', 'Type', 'Charge / lest / assistance (kg)', 'Répétitions', 'Durée (s)', 'Distance (m)', 'RPE', 'Note de la séance', 'Note de l’exercice']];
  for(const s of seances) for(const x of s.exercices) x.series.forEach((y,i)=>{
    if(!y.faite) return;
    const mesure = mode(x);
    const valeurs = new Map(champsSerie(x).map(([k])=>[k,y[k]]));
    lignes.push([new Date(s.debut).toISOString(),s.nom,x.nom,modes[mesure],i+1,y.type,valeurs.get('kg'),valeurs.get('reps'),valeurs.get('secondes'),valeurs.get('metres'),y.rpe,s.notes,x.note]);
  });
  return '\uFEFF'+lignes.map(ligne=>ligne.map(celluleCSV).join(';')).join('\r\n')+'\r\n';
}
