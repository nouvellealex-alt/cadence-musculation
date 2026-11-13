const familles = [
  ['Poussée des pectoraux',[
    ['Développé incliné','di','di-smith','incline-barre','incline-machine'],
    ['Poussée horizontale','dc','dc-halteres','dc-serre','chest-press','pom','pompes-inclinees'],
    ['Développé décliné','dc-decline','pompes-declinees'],
    ['Développé au sol','dc-sol']
  ]],
  ['Écarté des pectoraux',[
    ['Écarté horizontal','ec','ecarte-halteres','papillon-machine'],
    ['Écarté de bas en haut','ec-poulie-basse']
  ]],
  ['Tirage du dos',[
    ['Tirage vertical','tir','tir-neutre','tra','tra-assistees','tra-lestees','tractions-supination','traction-neutre','tirage-vertical-unilateral','tirage-vertical-supination'],
    ['Tirage horizontal','row','rowh','rowing-poulie','rowing-poitrine','rowing-machine-poitrine','tirage-inverse','rowing-poulie-unilateral','rowing-supination','rowing-tbar','rowing-anneaux'],
    ['Tirage en diagonale','rowing-machine-haut'],
    ['Tirage à la barre depuis le sol','rowing-sol-barre'],
    ['Tirage bras tendus','tirage-bras-tendus','pullover-halteres','pullover-machine']
  ]],
  ['Travail des omoplates',[
    ['Tirage d’omoplates en suspension','traction-omoplates']
  ]],
  ['Travail des trapèzes',[
    ['Haussement des épaules','haussement-halteres','haussement-barre'],
    ['Tirage menton','tirage-debout-haut']
  ]],
  ['Travail des épaules',[
    ['Élévation latérale','lat','lat-poulie','elevation-laterale-machine'],
    ['Élévation frontale','elevation-frontale'],
    ['Écarté inversé','inv','oiseau-halteres','oiseau-halteres-assis','oiseau-poulie'],
    ['Tirage vers le visage','face-pull'],
    ['Poussée au-dessus de la tête','mil','mil-halteres','developpe-epaules-machine','developpe-arnold','pompes-pique'],
    ['Poussée oblique','developpe-landmine'],
    ['Poussée avec impulsion','push-press']
  ]],
  ['Rotation externe de l’épaule',[
    ['Rotation externe de l’épaule','rotation-externe-poulie']
  ]],
  ['Rotation interne de l’épaule',[
    ['Rotation interne de l’épaule','rotation-interne-poulie']
  ]],
  ['Travail des triceps',[
    ['Extension vers le bas','tri','tri-barre','triceps-poulie-unilateral','extension-triceps-elastique'],
    ['Extension bras relevés','tri-haut','tri-haut-halteres'],
    ['Extension couchée','triceps-ez','triceps-couche-halteres'],
    ['Extension vers l’arrière','triceps-coude-dos','triceps-coude-dos-poulie'],
    ['Extension assise guidée','triceps-assis-machine'],
    ['Poussée bras rapprochés','pompes-serrees','repulsions-sol'],
    ['Répulsion aux barres parallèles','dip','dips-assistes','dips-lestes']
  ]],
  ['Flexion des coudes',[
    ['Flexion en supination','cur','curl-incline','curl-barre','curl-poulie','flexion-bayesian','flexion-concentration'],
    ['Flexion avec bras en appui','flexion-pupitre-ez','flexion-pupitre-halteres','flexion-biceps-machine'],
    ['Flexion en prise neutre','mar'],
    ['Flexion en pronation','flexion-inversee'],
    ['Flexion avec rotation de prise','flexion-zottman']
  ]],
  ['Travail des quadriceps',[
    ['Presse à cuisses','pre','presse-unilaterale'],
    ['Squat guidé','sq-smith','leg-hack','squat-pendulaire','squat-ceinture'],
    ['Squat libre','sq','goblet','front-squat','squat-sumo-halteres','squat-boite'],
    ['Squat sur une jambe','pistol'],
    ['Fente','fen','fentes-avant','fentes-marchees','fentes-marchees-barre'],
    ['Squat fendu pied arrière surélevé','squat-bulgare'],
    ['Montée sur plateforme','step-up'],
    ['Extension du genou','ext','extension-jambes-unilaterale'],
    ['Maintien isométrique','chaise']
  ]],
  ['Travail des ischio-jambiers',[
    ['Flexion du genou','curlj','flexion-jambes-assis','flexion-jambes-debout','flexion-jambes-ballon'],
    ['Flexion nordique','flexion-jambes-nordique'],
    ['Charnière de hanche','rou','rou-halteres','roumain-unilateral','good-morning-barre']
  ]],
  ['Extension de hanche',[
    ['Soulevé de terre','st','st-hex','charniere-kettlebell','souleve-terre-sumo'],
    ['Poussée de hanches','hip','hip-machine'],
    ['Pont au sol','pont-fessier-barre','pont-fessier-unilateral'],
    ['Extension de hanche isolée','extension-hanche-poulie','extension-hanche-genou-flex'],
    ['Charnière à la poulie','pull-through'],
    ['Balancier explosif','charniere-kettlebell-balancier']
  ]],
  ['Extension des mollets',[
    ['Extension des mollets genoux peu fléchis','mol','mollets-corps','mollets-presse','mollets-debout-halteres','mollet-unilateral'],
    ['Extension des mollets genoux fléchis','mollets-assis','mollets-assis-halteres']
  ]],
  ['Travail du tronc',[
    ['Enroulement du buste','cr','cr-poulie','cr-machine'],
    ['Enroulement du bassin','enroulement-bassin'],
    ['Relevé de genoux avec appui','gen','genoux-chaise-romaine'],
    ['Relevé de jambes tendues','releve-jambes','releves-jambes-suspendu'],
    ['Gainage ventral','planche','touches-epaules'],
    ['Extension opposée','extension-opposee','dead-bug'],
    ['Déploiement à la roue','roulette-abdos']
  ]],
  ['Stabilité latérale et antirotation',[
    ['Gainage latéral','planche-laterale'],
    ['Poussée antirotation','pallof-poulie'],
    ['Portage asymétrique','portage-valise']
  ]],
  ['Rotation du buste',[
    ['Rotation assise guidée','rotation-assise'],
    ['Rotation debout à la poulie','rotation-poulie'],
    ['Rotation assise libre','rotation-medicinal']
  ]],
  ['Flexion latérale du buste',[
    ['Flexion latérale du buste','flexion-laterale-halteres']
  ]],
  ['Extension du dos',[
    ['Extension assise guidée','lombaires-machine'],
    ['Extension du buste sur banc','lombaires-banc']
  ]],
  ['Adduction de hanche',[
    ['Adduction assise','adducteurs-machine'],
    ['Adduction debout','adducteurs-poulie'],
    ['Adduction au sol','adduction-cote'],
    ['Fente latérale','fente-laterale']
  ]],
  ['Abduction de hanche',[
    ['Abduction assise','abducteurs-machine'],
    ['Abduction debout','abducteurs-poulie'],
    ['Abduction au sol','abduction-cote','abduction-quatre-pattes'],
    ['Pas latéraux','pas-lateraux-elastique']
  ]],
  ['Flexion du poignet',[
    ['Flexion du poignet','poignets-flexion']
  ]],
  ['Extension du poignet',[
    ['Extension du poignet','poignets-extension']
  ]],
  ['Travail de la prise',[
    ['Prise en pince','pince-disques'],
    ['Suspension','suspension-passive'],
    ['Portage bilatéral','portage-fermier']
  ]],
  ['Travail des tibiaux',[
    ['Relevé des pointes','tibial-mur']
  ]],
  ['Cardio sur tapis ou parcours',[
    ['Marche','marche','marche-inclinee-tapis'],
    ['Course','course-tapis']
  ]],
  ['Cardio sur ergomètre',[
    ['Rameur','rameur'],
    ['Vélo stationnaire','velo-salle'],
    ['Vélo elliptique','elliptique'],
    ['Escalier','escalier-machine'],
    ['Ergomètre de ski','ski-ergometre']
  ]],
  ['Cardio avec sauts',[
    ['Sauts avec corde','corde-sauts'],
    ['Sauts écartés','pas-ecartes'],
    ['Planche et saut','burpee-sans-pompe'],
    ['Talons-fesses','talons-fessiers']
  ]],
  ['Cardio en appui',[
    ['Montée de genoux en planche','mountain-climber']
  ]],
  ['Cordes ondulatoires',[
    ['Ondulations des bras','cordes-ondulations']
  ]],
  ['Poussée de traîneau',[
    ['Poussée de traîneau','traineau-poussee']
  ]],
  ['Saut sur plateforme',[
    ['Saut sur plateforme','saut-boite']
  ]],
  ['Mobilité de cheville',[
    ['Avancée du genou','cheville-avancee'],
    ['Étirement du mollet','mollets-etirement']
  ]],
  ['Mobilité de hanche',[
    ['Rotation assise','mobilite-hanches-9090'],
    ['Étirement des fléchisseurs','etirement-flechisseurs-hanche'],
    ['Balancier de jambe','balancier-jambe']
  ]],
  ['Mobilité du dos',[
    ['Rotation thoracique','rotation-thoracique'],
    ['Mobilisation à quatre pattes','chat-vache']
  ]],
  ['Mobilité des épaules',[
    ['Glissement des bras au mur','mobilite-epaules-mur']
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
  ['presse-unilaterale','Presse à cuisses'],
  ['ext','Machine d’extension des jambes'],
  ['extension-jambes-unilaterale','Machine d’extension des jambes'],
  ['curlj','Flexion des jambes allongé'],
  ['flexion-jambes-assis','Flexion des jambes assis'],
  ['mol','Machine à mollets'],
  ['inv','Machine d’écarté inversé'],
  ['leg-hack','Machine à chariot'],
  ['tra-assistees','Machine à tractions assistées'],
  ['dips-assistes','Machine à tractions assistées'],
  ['course-tapis','Tapis de course'],
  ['marche-inclinee-tapis','Tapis de course'],
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
  ['hip-machine','Machine à poussée de hanches'],
  ['incline-machine','Machine de développé incliné'],
  ['rowing-machine-haut','Machine de tirage haut convergent'],
  ['pullover-machine','Machine de pullover'],
  ['elevation-laterale-machine','Machine d’élévation latérale'],
  ['triceps-assis-machine','Machine d’extension des triceps'],
  ['flexion-biceps-machine','Machine de flexion des biceps'],
  ['squat-ceinture','Machine de squat à ceinture'],
  ['squat-pendulaire','Machine de squat pendulaire'],
  ['flexion-jambes-debout','Flexion des jambes debout']
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
  if (/pupitre à biceps/.test(equipement)) trouves.push('Pupitre à biceps');
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
    const identique = motif && autre?.famille===motif.famille && autre.geste===motif.geste;
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
