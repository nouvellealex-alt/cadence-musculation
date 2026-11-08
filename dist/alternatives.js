const familles = [
  ['Poussée des pectoraux',[
    ['Développé incliné','di','di-smith','pompes-declinees'],
    ['Poussée horizontale','dc','dc-halteres','chest-press','pom']
  ]],
  ['Écarté des pectoraux',[
    ['Écarté','ec','ecarte-halteres','papillon-machine']
  ]],
  ['Tirage du dos',[
    ['Tirage vertical','tir','tir-neutre','tra','tra-assistees','tra-lestees','tractions-supination'],
    ['Tirage horizontal','row','rowh','rowing-poulie','rowing-poitrine','rowing-machine-poitrine','tirage-inverse'],
    ['Tirage bras tendus','tirage-bras-tendus']
  ]],
  ['Travail des épaules',[
    ['Élévation latérale','lat','lat-poulie'],
    ['Écarté inversé','inv'],
    ['Tirage vers le visage','face-pull'],
    ['Poussée au-dessus de la tête','mil','mil-halteres','developpe-epaules-machine']
  ]],
  ['Travail des triceps',[
    ['Extension vers le bas','tri','tri-barre'],
    ['Extension bras relevés','tri-haut','tri-haut-halteres'],
    ['Extension couchée','triceps-ez'],
    ['Poussée bras rapprochés','pompes-serrees','repulsions-sol','dip']
  ]],
  ['Flexion des coudes',[
    ['Flexion prise supination','cur','curl-incline','curl-barre','curl-poulie'],
    ['Flexion prise neutre','mar']
  ]],
  ['Travail des quadriceps',[
    ['Presse à cuisses','pre'],
    ['Squat guidé','sq-smith','leg-hack'],
    ['Squat libre','sq','goblet','front-squat','pistol'],
    ['Fente','fen','fentes-avant','fentes-marchees'],
    ['Extension du genou','ext']
  ]],
  ['Travail des ischio-jambiers',[
    ['Flexion du genou','curlj','flexion-jambes-assis'],
    ['Charnière de hanche','rou','rou-halteres']
  ]],
  ['Extension de hanche',[
    ['Soulevé de terre','st','st-hex','charniere-kettlebell'],
    ['Poussée de hanches','hip','hip-machine']
  ]],
  ['Extension des mollets',[
    ['Extension des mollets genoux peu fléchis','mol','mollets-corps','mollets-presse'],
    ['Extension des mollets genoux fléchis','mollets-assis']
  ]],
  ['Travail du tronc',[
    ['Enroulement du buste','cr','cr-poulie','cr-machine'],
    ['Relevé des jambes','gen','releve-jambes'],
    ['Gainage','planche','touches-epaules','extension-opposee']
  ]],
  ['Rotation du buste',[
    ['Rotation assise guidée','rotation-assise'],
    ['Rotation debout à la poulie','rotation-poulie']
  ]],
  ['Extension du dos',[
    ['Extension assise guidée','lombaires-machine'],
    ['Extension du buste sur banc','lombaires-banc']
  ]],
  ['Adduction de hanche',[
    ['Adduction assise','adducteurs-machine'],
    ['Adduction debout','adducteurs-poulie']
  ]],
  ['Abduction de hanche',[
    ['Abduction assise','abducteurs-machine'],
    ['Abduction debout','abducteurs-poulie']
  ]],
  ['Flexion du poignet',[
    ['Flexion du poignet','poignets-flexion']
  ]],
  ['Extension du poignet',[
    ['Extension du poignet','poignets-extension']
  ]]
];

const motifs = new Map();
for (const [famille, groupes] of familles) {
  for (const [geste,...ids] of groupes) {
    for (const id of ids) motifs.set(id,{famille,geste});
  }
}

const machines = new Map([
  ['pre','Presse à cuisses'],
  ['ext','Machine d’extension des jambes'],
  ['curlj','Flexion des jambes allongé'],
  ['flexion-jambes-assis','Flexion des jambes assis'],
  ['mol','Machine à mollets'],
  ['inv','Machine d’écarté inversé'],
  ['leg-hack','Machine à chariot'],
  ['tra-assistees','Machine à tractions assistées'],
  ['rotation-assise','Machine de rotation du buste'],
  ['cr-machine','Machine à abdominaux'],
  ['lombaires-machine','Machine d’extension du dos'],
  ['lombaires-banc','Banc à lombaires'],
  ['adducteurs-machine','Machine d’adduction des hanches'],
  ['abducteurs-machine','Machine d’abduction des hanches'],
  ['mollets-assis','Machine à mollets assis'],
  ['mollets-presse','Presse à cuisses'],
  ['rowing-machine-poitrine','Machine de tirage horizontal'],
  ['developpe-epaules-machine','Machine de développé épaules'],
  ['papillon-machine','Machine papillon'],
  ['hip-machine','Machine à poussée de hanches']
]);
const mesureChronometree = mesure => mesure === 'duree' || mesure === 'distance';

function stations(exercice) {
  const materielOriginal=typeof exercice.materiel==='string'?exercice.materiel:'';
  const description=typeof exercice.equipement==='string'&&exercice.equipement?exercice.equipement:materielOriginal;
  const equipement = description.toLowerCase();
  const materiel = materielOriginal.toLowerCase();
  const trouves = [];
  if (machines.has(exercice.id)) trouves.push(machines.get(exercice.id));
  if (/poulie/.test(equipement)) trouves.push('Poulies');
  if (/smith/.test(equipement)) trouves.push('Machine Smith');
  if (/barre (de traction|fixe|basse)|anneaux/.test(equipement)) trouves.push('Barres de traction et supports');
  if (/barres parallèles/.test(equipement)) trouves.push('Barres parallèles');
  if (/cage|rack|supports|sécurités/.test(equipement)) trouves.push('Rack et barre');
  if (/banc/.test(equipement) && exercice.id!=='lombaires-banc') trouves.push('Bancs');
  if (/haltère/.test(equipement)) trouves.push('Haltères');
  if (/^barre/.test(materiel)) trouves.push(exercice.materiel);
  if (trouves.length===0 && materiel && !/poids du corps|aucun matériel|sans matériel/.test(materiel)) {
    trouves.push(description);
  }
  return [...new Set(trouves)];
}

export function poste(exercice) {
  return stations(exercice)[0] ?? null;
}
export const postesPossibles=stations;

export function posteDisponible(exercice,bloques) {
  return !stations(exercice).some(poste=>bloques.has(poste));
}

export function alternatives(exercice, catalogue, bloques=[], salle=false) {
  const indisponibles = new Set(bloques);
  const motif = motifs.get(exercice.id);
  const mesure = exercice.mesure || 'charge';
  const resultats = [];
  for (const candidat of catalogue) {
    if (candidat.id===exercice.id || (candidat.categorie || 'Musculation')!==(exercice.categorie || 'Musculation')) continue;
    if (!posteDisponible(candidat,indisponibles)) continue;
    const autre = motifs.get(candidat.id);
    const muscle = candidat.muscle===exercice.muscle;
    const identique = motif && autre?.geste===motif.geste;
    const proche = motif && autre?.famille===motif.famille;
    if (!identique && !proche && (motif || !muscle)) continue;
    const autreMesure = candidat.mesure || 'charge';
    const memeMesure = mesure===autreMesure;
    if (!memeMesure && (mesureChronometree(mesure) || mesureChronometree(autreMesure))) continue;
    const exigeant = candidat.niveau==='Avancé' && exercice.niveau!=='Avancé';
    if (exigeant && !identique) continue;
    const memePoste = poste(candidat) && poste(candidat)===poste(exercice);
    const points = (identique?30:proche?15:0)+(muscle?2:0)+(memeMesure?2:0)-(exigeant?4:0)-(memePoste?2:0);
    let raison = identique ? autre.geste+' · même geste' : proche ? autre.famille+' · variante différente' : 'Même groupe musculaire · geste à vérifier';
    if (!memeMesure) raison += ' · autre mode de suivi';
    if (exigeant) raison += ' · variante avancée';
    resultats.push({exercice:candidat,raison,points});
  }
  return resultats.sort((a,b)=>b.points-a.points ||
    (salle?Number(b.exercice.lieu==='Salle')-Number(a.exercice.lieu==='Salle'):0) ||
    a.exercice.nom.localeCompare(b.exercice.nom,'fr'))
    .slice(0,4).map(({exercice,raison})=>({exercice,raison}));
}
