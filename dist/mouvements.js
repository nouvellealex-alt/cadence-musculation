// Dessins vectoriels originaux de Cadence. Un repère par articulation, en pixels SVG.
// Ordre : tête, épaules, bassin, coude, main, genou, pied. La seconde
// moitié du corps est dessinée avec un léger décalage de perspective.
const poses = {
  debout:'107,39 106,60 107,103 109,85 111,111 107,132 109,157',
  squat:'83,73 90,91 117,125 76,102 82,91 87,129 107,156',
  barre:'107,39 106,60 107,103 87,77 91,58 107,132 109,157',
  couche:'62,94 77,104 139,106 90,118 90,90 166,124 158,156',
  pousse:'62,94 77,104 139,106 81,80 85,55 166,124 158,156',
  incline:'71,64 81,78 118,116 65,102 64,78 151,126 149,157',
  inclineHaut:'71,64 81,78 118,116 80,56 86,33 151,126 149,157',
  pompeBas:'45,115 61,123 119,133 81,140 65,155 149,140 179,155',
  pompeHaut:'45,83 62,92 117,118 64,122 65,155 147,137 179,155',
  ecart:'107,39 106,60 107,103 78,77 54,88 108,132 111,157',
  serre:'107,39 106,60 107,103 87,79 61,76 108,132 111,157',
  presseBas:'63,104 76,116 107,140 90,132 107,130 122,95 153,110',
  presseHaut:'63,104 76,116 107,140 90,132 107,130 137,112 166,86',
  fente:'102,64 103,83 104,116 103,106 103,129 76,123 73,157',
  fenteDepart:'102,39 103,60 104,103 103,85 103,111 87,129 73,157',
  assis:'80,57 82,77 94,117 84,100 98,110 128,117 131,154',
  jambeHaute:'80,57 82,77 94,117 84,100 98,110 128,117 164,118',
  terre:'79,86 87,102 125,112 84,126 85,150 102,134 109,157',
  roumain:'70,76 83,88 121,102 82,112 84,133 109,130 109,157',
  flexionBas:'49,109 67,116 119,116 54,131 43,139 145,117 177,120',
  flexionHaut:'49,109 67,116 119,116 54,131 43,139 145,117 142,85',
  bassinBas:'61,97 75,109 111,142 94,130 106,134 143,121 157,157',
  bassinHaut:'61,97 75,109 116,110 93,119 109,111 147,112 157,157',
  mollet:'107,35 106,56 107,99 109,81 111,107 107,128 111,150',
  suspension:'109,64 107,84 111,118 105,57 104,29 112,137 115,158',
  traction:'105,31 107,51 111,88 86,52 104,29 112,119 115,145',
  tirageHaut:'105,66 105,85 110,120 102,60 100,31 128,123 130,157',
  tirageBas:'105,66 105,85 110,120 89,109 100,84 128,123 130,157',
  penche:'69,70 82,83 120,108 80,107 79,132 112,132 110,157',
  rame:'69,70 82,83 120,108 108,86 98,108 112,132 110,157',
  militaireBas:'107,39 106,60 107,103 91,80 90,56 107,132 109,157',
  militaireHaut:'107,39 106,60 107,103 101,38 100,17 107,132 109,157',
  lateral:'107,39 106,60 107,103 80,66 54,71 107,132 109,157',
  inverseBas:'74,58 86,75 114,105 80,95 74,114 114,133 115,157',
  inverseHaut:'74,58 86,75 114,105 67,76 47,80 114,133 115,157',
  curl:'107,39 106,60 107,103 105,86 84,65 107,132 109,157',
  triceps:'108,45 104,66 112,106 101,90 76,77 112,133 115,157',
  dipBas:'99,48 103,67 115,110 123,69 112,92 122,131 140,142',
  dipHaut:'99,31 103,49 115,94 107,70 112,92 122,118 140,132',
  crunchBas:'58,141 74,144 121,148 86,140 67,130 145,116 164,156',
  crunchHaut:'71,110 84,126 121,148 99,120 82,101 145,116 164,156',
  genoux:'109,64 107,84 111,118 105,57 104,29 81,113 92,137',
  gobletHaut:'107,39 106,60 107,103 94,86 87,72 107,132 109,157',
  gobletBas:'83,73 90,91 117,125 80,109 72,97 87,129 107,156',
  chaise:'112,73 114,94 117,123 95,117 77,119 82,124 83,156',
  pistol:'87,74 92,91 115,132 71,105 51,106 86,131 104,157',
  solDipHaut:'89,67 94,87 112,121 84,117 72,156 141,115 159,155',
  solDipBas:'89,84 94,104 112,139 68,132 72,156 141,119 159,155',
  fenteAvantDepart:'112,39 112,61 111,103 111,84 108,110 108,131 110,157',
  fenteAvant:'91,61 92,81 111,117 92,101 91,125 78,123 77,157',
  marcheA:'103,41 102,60 110,104 88,84 79,70 89,127 67,153',
  marcheB:'103,41 102,60 110,104 121,84 139,92 127,131 151,153',
  smithInclineBas:'71,64 81,78 118,116 70,102 83,78 151,126 149,157',
  smithInclineHaut:'71,64 81,78 118,116 82,56 83,33 151,126 149,157',
  rowSoutienBas:'79,64 87,81 121,117 86,108 87,135 130,140 135,159',
  rowSoutienHaut:'79,64 87,81 121,117 108,90 104,112 130,140 135,159',
  curlInclineBas:'73,52 85,68 110,109 84,94 84,116 138,116 140,158',
  curlInclineHaut:'73,52 85,68 110,109 84,94 72,74 138,116 140,158',
  triHautBas:'101,42 108,63 116,109 111,37 130,47 116,134 116,158',
  triHautHaut:'101,42 108,63 116,109 105,39 102,17 116,134 116,158',
  abPoulieHaut:'102,48 108,67 117,110 95,91 96,57 119,151 151,157',
  abPoulieBas:'82,99 93,108 117,110 79,130 76,109 119,151 151,157',
  faceDepart:'108,42 107,64 112,104 89,66 67,60 112,132 117,158',
  faceFin:'108,42 107,64 112,104 86,57 97,48 112,132 117,158',
  presseAssiseBas:'81,49 88,69 94,116 81,94 102,79 132,116 134,157',
  presseAssiseHaut:'81,49 88,69 94,116 113,75 139,77 132,116 134,157',
  brasTendusHaut:'108,45 106,65 117,107 91,77 74,84 115,133 117,158',
  brasTendusBas:'108,45 106,65 117,107 106,89 104,115 115,133 117,158',
  rotAssis:'109,48 109,66 109,107 88,78 94,91 93,118 92,155',
  rotAssisTourne:'93,48 96,66 109,107 69,79 79,91 93,118 92,155',
  rotCable:'97,42 99,63 110,102 81,76 66,82 101,130 95,155',
  rotCableTourne:'119,42 117,63 110,102 136,73 150,79 101,130 95,155',
  crunchGuideHaut:'90,50 92,70 99,114 103,86 116,80 130,117 133,154',
  crunchGuideBas:'112,79 107,94 99,114 121,100 128,93 130,117 133,154',
  extensionAssiseBas:'122,66 112,82 101,118 123,101 126,115 137,122 140,153',
  extensionAssiseHaut:'92,52 94,73 101,118 109,94 126,115 137,122 140,153',
  extensionBancBas:'57,119 69,111 106,103 62,127 58,126 133,128 157,154',
  extensionBancHaut:'67,59 79,76 106,103 80,95 75,98 133,128 157,154',
  hanchesEcartees:'110,40 110,61 110,109 83,89 75,102 75,118 78,153',
  hanchesRapprochees:'110,40 110,61 110,109 88,89 91,102 99,118 98,153',
  hancheCableProche:'111,40 110,62 110,104 131,83 149,84 102,130 101,157',
  hancheCableEcartee:'111,40 110,62 110,104 131,83 149,84 79,128 65,151',
  molletsAssisBas:'96,48 97,70 102,111 102,94 130,107 132,115 130,153',
  molletsAssisHaut:'96,48 97,70 102,111 102,94 130,103 132,111 132,144',
  molletsPresseBas:'62,104 75,116 105,139 87,132 105,130 139,111 161,87',
  molletsPresseHaut:'62,104 75,116 105,139 87,132 105,130 143,107 165,83',
  poignetBas:'86,67 94,85 103,123 106,115 137,126 136,126 139,156',
  tirageGuideLoin:'110,53 111,74 111,116 89,81 60,83 88,128 89,158',
  tirageGuidePres:'110,53 111,74 111,116 130,83 102,81 88,128 89,158',
  epaulesGuideBas:'104,46 105,66 110,113 83,78 82,54 132,124 135,158',
  epaulesGuideHaut:'104,46 105,66 110,113 88,48 84,23 132,124 135,158',
  papillonOuvert:'110,48 110,68 110,109 77,76 56,69 94,125 93,155',
  papillonFerme:'110,48 110,68 110,109 96,81 106,90 94,125 93,155'
};

const fiche = (a,b,materiel,zone,secondaires,erreur) => ({a,b,materiel,zone,secondaires,erreur});
export const mouvements = {
  dc:fiche('couche','pousse','banc-barre','torse','Triceps, épaules','Évitez de faire rebondir la barre sur la poitrine.'),
  di:fiche('incline','inclineHaut','incline-halteres','torse','Triceps, épaules','Évitez de cambrer davantage pour faire monter les haltères.'),
  pom:fiche('pompeHaut','pompeBas','sol','torse','Triceps, épaules','Évitez de laisser le bassin tomber sous le buste.'),
  ec:fiche('ecart','serre','poulie-double','torse','Épaules','Gardez une légère flexion des coudes pendant le mouvement.'),
  sq:fiche('barre','squat','barre-epaule','cuisses','Fessiers, adducteurs','Gardez le pied entier en appui et les genoux dans l’axe des pieds.'),
  pre:fiche('presseBas','presseHaut','presse','cuisses','Fessiers','Gardez le bassin en contact avec le dossier.'),
  fen:fiche('fenteDepart','fente','fente','cuisses','Fessiers, adducteurs','Évitez de pousser uniquement sur le pied arrière.'),
  ext:fiche('assis','jambeHaute','extension','cuisses','—','Évitez de lancer la charge avec un à-coup.'),
  st:fiche('terre','debout','barre-main','hanche','Ischio-jambiers, dos','Évitez de laisser la barre s’éloigner des jambes.'),
  rou:fiche('debout','roumain','barre-main','arriere','Fessiers, dos','Gardez les genoux souples et reculez les hanches.'),
  curlj:fiche('flexionBas','flexionHaut','flexion','arriere','Mollets','Gardez les hanches en contact avec le banc.'),
  hip:fiche('bassinBas','bassinHaut','banc-hanches','hanche','Ischio-jambiers','Terminez avec le bassin aligné avec le buste.'),
  mol:fiche('debout','mollet','mollets','mollets','—','Évitez de rebondir en bas du mouvement.'),
  tra:fiche('suspension','traction','traction','dos','Biceps, avant-bras','Évitez de prendre de l’élan avec les jambes.'),
  tir:fiche('tirageHaut','tirageBas','poulie-haute','dos','Biceps, avant-bras','Gardez l’inclinaison du buste stable.'),
  row:fiche('penche','rame','barre-main','dos','Biceps, arrière des épaules','Évitez de redresser le buste à chaque répétition.'),
  rowh:fiche('penche','rame','banc-un-bras','dos','Biceps, arrière des épaules','Gardez le bassin orienté vers le sol.'),
  mil:fiche('militaireBas','militaireHaut','barre-main','epaules','Triceps','Gardez le buste stable lorsque la barre monte.'),
  lat:fiche('debout','lateral','halteres','epaules','Trapèzes','Évitez de soulever les épaules vers les oreilles.'),
  inv:fiche('inverseBas','inverseHaut','inverse','epaules','Haut du dos','Gardez la poitrine en contact avec l’appui.'),
  cur:fiche('debout','curl','halteres','biceps','Avant-bras','Gardez les coudes près du buste.'),
  mar:fiche('debout','curl','marteau','biceps','Avant-bras','Gardez les paumes face à face et les poignets stables.'),
  tri:fiche('triceps','debout','corde','triceps','Avant-bras','Évitez de déplacer le haut des bras pour tirer la corde.'),
  dip:fiche('dipHaut','dipBas','paralleles','triceps','Pectoraux, épaules','Descendez sur une amplitude que vous contrôlez.'),
  cr:fiche('crunchBas','crunchHaut','tapis','abdos','—','Évitez de tirer sur la nuque avec les mains.'),
  gen:fiche('suspension','genoux','traction','abdos','Fléchisseurs de hanche','Évitez de balancer les jambes pour amorcer la montée.'),
  goblet:fiche('gobletHaut','gobletBas','kettlebell','cuisses','Fessiers, adducteurs','Gardez la charge près du buste.'),
  'charniere-kettlebell':fiche('terre','debout','kettlebell','hanche','Ischio-jambiers, dos','Gardez la charge entre les appuis.'),
  'sq-smith':fiche('barre','squat','smith','cuisses','Fessiers','Réglez les butées.'),
  'st-hex':fiche('terre','debout','hex','hanche','Quadriceps, dos','Reposez les deux côtés ensemble.'),
  'tra-assistees':fiche('suspension','traction','assiste','dos','Biceps, avant-bras','Contrôlez la remontée de la plateforme.'),
  'tra-lestees':fiche('suspension','traction','leste','dos','Biceps, avant-bras','Vérifiez l’attache du lest.'),
  pistol:fiche('debout','pistol','pistol','cuisses','Fessiers, abdominaux','Gardez le talon d’appui au sol.'),
  'repulsions-sol':fiche('solDipHaut','solDipBas','sol','triceps','Épaules','Gardez une amplitude confortable.'),
  'fentes-avant':fiche('fenteAvantDepart','fenteAvant','fente-avant','cuisses','Fessiers','Posez le pied entier avant de descendre.'),
  chaise:fiche('debout','chaise','mur','cuisses','Fessiers','Conservez le dos au mur.'),
  'mollets-corps':fiche('debout','mollet','sol','mollets','—','Gardez les appuis stables.'),
  marche:fiche('marcheA','marcheB','marche','mollets','Fessiers','Adoptez une foulée régulière.'),
  'tir-neutre':fiche('tirageHaut','tirageBas','poulie-neutre','dos','Biceps, avant-bras','Gardez les paumes face à face.'),
  'rowing-poitrine':fiche('rowSoutienBas','rowSoutienHaut','row-soutien','dos','Biceps, arrière des épaules','Gardez la poitrine en appui.'),
  'di-smith':fiche('smithInclineBas','smithInclineHaut','incline-smith','torse','Triceps, épaules','Vérifiez les butées.'),
  'tri-barre':fiche('triceps','debout','poulie-barre','triceps','Avant-bras','Gardez les coudes près des côtes.'),
  'tri-haut':fiche('triHautBas','triHautHaut','poulie-basse','triceps','Avant-bras','Gardez les coudes stables.'),
  'curl-incline':fiche('curlInclineBas','curlInclineHaut','curl-incline','biceps','Avant-bras','Gardez le dos contre le banc.'),
  'cr-poulie':fiche('abPoulieHaut','abPoulieBas','poulie-crunch','abdos','—','Gardez le bassin stable.'),
  'lat-poulie':fiche('debout','lateral','cable-lateral','epaules','Trapèzes','Évitez de hausser l’épaule.'),
  'face-pull':fiche('faceDepart','faceFin','cable-face','epaules','Haut du dos','Gardez le buste stable.'),
  'chest-press':fiche('presseAssiseBas','presseAssiseHaut','presse-assise','torse','Triceps, épaules','Gardez le dos contre le dossier.'),
  'tirage-bras-tendus':fiche('brasTendusHaut','brasTendusBas','poulie-barre','dos','Triceps','Gardez les coudes souples.'),
  'tri-haut-halteres':fiche('triHautBas','triHautHaut','halteres','triceps','—','Contrôlez la descente.'),
  'rotation-assise':fiche('rotAssis','rotAssisTourne','rotation-assise','abdos','Abdominaux','Tournez avec contrôle.'),
  'rotation-poulie':fiche('rotCable','rotCableTourne','rotation-cable','abdos','Abdominaux','Utilisez une charge maîtrisable.'),
  'cr-machine':fiche('crunchGuideHaut','crunchGuideBas','crunch-guide','abdos','—','Rapprochez les côtes du bassin.'),
  'lombaires-machine':fiche('extensionAssiseBas','extensionAssiseHaut','extension-assise','dos','Fessiers','Évitez de forcer la cambrure.'),
  'lombaires-banc':fiche('extensionBancBas','extensionBancHaut','banc-lombaires','dos','Fessiers, ischio-jambiers','Arrêtez-vous dans l’alignement.'),
  'adducteurs-machine':fiche('hanchesEcartees','hanchesRapprochees','adducteurs-guide','cuisses','—','Contrôlez l’ouverture.'),
  'abducteurs-machine':fiche('hanchesRapprochees','hanchesEcartees','abducteurs-guide','hanche','Fessiers','Gardez le bassin stable.'),
  'adducteurs-poulie':fiche('hancheCableEcartee','hancheCableProche','hanche-cable','cuisses','—','Utilisez un appui stable.'),
  'abducteurs-poulie':fiche('hancheCableProche','hancheCableEcartee','hanche-cable-inverse','hanche','Fessiers','Utilisez un appui stable.'),
  'mollets-assis':fiche('molletsAssisBas','molletsAssisHaut','mollets-assis','mollets','—','Évitez les rebonds.'),
  'mollets-presse':fiche('molletsPresseBas','molletsPresseHaut','mollets-presse','mollets','—','Gardez les genoux stables.'),
  'poignets-flexion':fiche('poignetBas','poignetBas','poignet-paume','avant-bras','—','Gardez l’avant-bras en appui.'),
  'poignets-extension':fiche('poignetBas','poignetBas','poignet-dos','avant-bras','—','Gardez l’avant-bras en appui.'),
  'rowing-machine-poitrine':fiche('tirageGuideLoin','tirageGuidePres','tirage-guide','dos','Biceps, arrière des épaules','Gardez la poitrine en appui.'),
  'developpe-epaules-machine':fiche('epaulesGuideBas','epaulesGuideHaut','epaules-guide','epaules','Triceps','Gardez le dos contre le dossier.'),
  'papillon-machine':fiche('papillonOuvert','papillonFerme','papillon-guide','torse','Épaules','Réglez l’amplitude de départ.'),
  'hip-machine':fiche('bassinBas','bassinHaut','poussee-hanches-guide','hanche','Ischio-jambiers','Vérifiez le verrouillage.')
};

export function dessin(f, position=0, miniature=false) {
  const [t,s,h,c,m,g,p] = poses[position?f.b:f.a].split(' ').map(a=>a.split(',').map(Number));
  const e = (point,x,y) => [point[0]+x,point[1]+y];
  const ligne = (points, couleur, largeur) => '<polyline points="'+points.join(' ')+'" fill="none" stroke="'+couleur+'" stroke-width="'+largeur+'" stroke-linecap="round" stroke-linejoin="round"/>';
  const rond = (point,r,couleur) => '<circle cx="'+point[0]+'" cy="'+point[1]+'" r="'+r+'" fill="'+couleur+'"/>';
  const rail = (a,b) => ligne([a,b],'#546982',5);
  const cable = (a,b) => ligne([a,b],'#70859c',2);
  const barre = point => rail(e(point,-20,0),e(point,20,0))+rond(e(point,-17,0),7,'#7188a4')+rond(e(point,17,0),7,'#7188a4');
  const banc = (a,b) => rail(a,b)+rail(a,[a[0],160])+rail(b,[b[0],160]);
  const pieds = (a,b) => rail(a,b)+rail(a,e(a,-6,65))+rail(b,e(b,6,65));
  const siege = (x,y) => banc([x-14,y],[x+15,y]);
  const pile = (x,y) => rail([x,y],[x,159])+rail([x-7,155],[x+7,155])+rail([x-7,149],[x+7,149])+rail([x-7,143],[x+7,143]);
  // Petit repère vu de dessus : bassin fixe et épaules en rotation.
  const repereRotation = '<circle cx="187" cy="41" r="20" fill="#14263a" stroke="#355575"/>'+
    ligne([[175,47],[199,47]],'#7b95b4',3)+
    ligne(position?[[177,35],[197,44]]:[[175,38],[199,38]],'#8ad2ff',4)+
    '<path d="M178 27q10-5 18 2m-4-3 4 3-5 1" fill="none" stroke="#8ad2ff" stroke-width="1.6"/>';
  const disque = point => rail(e(point,-8,0),e(point,8,0))+rond(e(point,-8,0),4,'#7188a4')+rond(e(point,8,0),4,'#7188a4');
  let devant='', derriere='', pointe=e(p,10,1);
  let brasArriere = [e(s,9,3),e(c,11,-1),e(m,13,0)];
  let jambeArriere = [e(h,8,2),e(g,11,1),e(p,12,0)];
  switch (f.materiel) {
    case 'banc-barre': derriere=banc([62,111],[143,111]);devant=barre(m);break;
    case 'incline-halteres': derriere=banc([66,70],[123,123]);devant=barre(e(m,-2,0));break;
    case 'halteres': devant=rail(e(m,-9,0),e(m,9,0))+rond(e(m,-8,0),5,'#7188a4')+rond(e(m,8,0),5,'#7188a4');break;
    case 'marteau': devant=rail(e(m,0,-8),e(m,0,8))+rond(e(m,0,-8),5,'#7188a4')+rond(e(m,0,8),5,'#7188a4');break;
    case 'barre-epaule': devant=barre(e(s,0,-4));break;
    case 'barre-main': devant=barre(m);break;
    case 'presse': derriere=banc([51,101],[112,150])+rail([174,56],[123,157])+rail(e(p,-9,-13),e(p,9,13));break;
    case 'extension': derriere=banc([72,125],[128,125]);devant=rond(e(p,2,-10),7,'#7188a4');break;
    case 'flexion': derriere=banc([58,123],[147,123]);devant=rond(e(p,-9,-3),6,'#7188a4');break;
    case 'banc-hanches': derriere=banc([44,116],[80,116]);devant=barre(e(h,0,-8));break;
    case 'banc-un-bras': derriere=banc([41,113],[83,113]);brasArriere=[e(s,9,3),[67,93],[62,111]];devant=rond(m,7,'#7188a4');break;
    case 'inverse': derriere=banc([101,102],[136,118])+rail([88,79],[102,114]);break;
    case 'mollets': derriere=rail([98,158],[143,158])+rail([119,67],[138,67])+rail([138,67],[138,157]);break;
    case 'traction': derriere=rail([63,24],[153,24])+rail([153,24],[153,160]);devant=rail(e(m,-5,-3),e(m,11,-3));break;
    case 'cable-lateral': derriere=rail([42,47],[42,158]);devant=cable([42,148],m);break;
    case 'cable-face': derriere=rail([48,36],[48,158]);devant=cable([48,50],m)+cable(m,brasArriere[2]);break;
    case 'presse-assise': derriere=banc([83,124],[134,124])+rail([77,70],[85,124])+rail([160,52],[160,158]);devant=rail([160,88],m);break;
    case 'poulie-neutre': derriere=banc([95,126],[129,126])+rail([149,24],[149,159])+rail([100,24],[149,24]);devant=cable([100,24],e(m,0,-8))+cable(e(m,-8,0),e(m,0,-8))+cable(e(m,0,-8),e(m,8,0))+rail(e(m,-9,-2),e(m,-9,4))+rail(e(m,9,-2),e(m,9,4));break;
    case 'row-soutien': derriere=banc([90,87],[126,126]);devant=rail(e(m,-8,0),e(m,8,0));break;
    case 'incline-smith': derriere=banc([66,70],[123,123])+rail([66,22],[66,159])+rail([100,22],[100,159]);devant=barre(m);break;
    case 'poulie-barre': derriere=rail([54,38],[54,157]);devant=cable([54,39],m)+rail(e(m,-13,0),e(m,13,0));break;
    case 'poulie-basse': derriere=rail([161,43],[161,158]);devant=cable([161,148],m)+cable(m,e(m,8,5));break;
    case 'curl-incline': derriere=banc([80,59],[121,116]);devant=rail(e(m,-8,0),e(m,8,0));break;
    case 'poulie-crunch': derriere=rail([54,35],[54,157]);devant=cable([54,36],m)+cable(m,e(m,7,3));break;
    case 'poulie-haute': derriere=banc([95,126],[129,126])+rail([149,24],[149,159])+rail([100,24],[149,24]);devant=cable([100,24],m)+rail(e(m,-15,0),e(m,15,0));break;
    case 'poulie-double': derriere=rail([42,45],[42,157])+rail([164,45],[164,157])+rail([42,45],[164,45]);devant=cable([42,67],m)+cable([164,67],brasArriere[2]);break;
    case 'corde': derriere=rail([49,40],[49,157]);devant=cable([49,43],m)+cable(m,e(m,6,9));break;
    case 'paralleles': derriere=pieds([74,92],[151,92]);break;
    case 'fente': jambeArriere=[e(h,8,2),position?[140,149]:[128,125],[151,157]];break;
    case 'kettlebell':
      devant=rond(e(m,0,8),8,'#7188a4')+'<ellipse cx="'+m[0]+'" cy="'+(m[1]+1)+'" rx="5" ry="4" fill="none" stroke="#7188a4" stroke-width="3"/>';break;
    case 'smith':
      derriere=rail([75,25],[75,158])+rail([150,25],[150,158])+rail([75,25],[150,25]);
      devant=barre(e(s,0,-4));break;
    case 'hex':
      devant=ligne([e(m,-20,0),e(m,-11,-8),e(m,21,-8),e(m,34,0),e(m,22,9),e(m,-11,9),e(m,-20,0)],'#7188a4',4)+rond(e(m,-19,0),5,'#7188a4')+rond(e(m,33,0),5,'#7188a4');break;
    case 'assiste':
    case 'leste':
      derriere=rail([63,24],[153,24])+rail([153,24],[153,160]);
      devant=f.materiel==='assiste'?rail(e(g,-8,6),e(g,23,6)):cable(h,e(h,3,19))+rond(e(h,3,23),6,'#7188a4');break;
    case 'pistol':
      if(position) jambeArriere=[e(h,8,2),[84,137],[57,144]];
      break;
    case 'fente-avant':
      if(position) jambeArriere=[e(h,8,2),[131,144],[151,154]];
      break;
    case 'mur': derriere=rail([127,50],[127,160]);break;
    case 'marche':
      jambeArriere=[e(h,8,2),position?[90,127]:[132,131],position?[66,151]:[154,153]];
      brasArriere=[e(s,9,3),position?[88,87]:[120,87],position?[82,73]:[135,96]];
      break;
    case 'rotation-assise':
      derriere=siege(110,118)+pile(159,54)+rail([133,65],[133,117]);
      jambeArriere=[e(h,8,1),[126,118],[128,155]];
      brasArriere=[e(s,14,2),e(c,38,-1),e(m,29,0)];
      devant=rail(e(s,-19,4),e(s,19,4))+rail(e(m,-1,-7),e(m,0,2))+repereRotation;break;
    case 'rotation-cable':
      derriere=pile(43,41);devant=cable([43,80],m)+rail(e(m,-2,-3),e(m,3,2))+repereRotation;
      jambeArriere=[e(h,8,0),[124,130],[131,157]];break;
    case 'crunch-guide':
      derriere=siege(98,126)+rail([81,62],[89,126])+pile(158,44);
      devant=rail([158,81],m)+rail(e(s,-8,7),e(s,9,7));break;
    case 'extension-assise':
      derriere=siege(101,127)+pile(65,45)+rail([140,158],[157,158]);
      devant=rail([65,98],e(s,-8,5))+rond(e(s,-8,5),6,'#7188a4');break;
    case 'banc-lombaires':
      derriere=rail([104,111],[161,159])+rail([104,111],[89,159])+rail([89,159],[171,159]);
      devant=rail([98,109],[111,100])+rail([151,150],[167,147]);break;
    case 'adducteurs-guide':
    case 'abducteurs-guide': {
      const autreGenou=[220-g[0],g[1]];
      derriere=siege(110,119)+pile(167,58)+rail([109,66],[109,118]);
      jambeArriere=[e(h,8,1),autreGenou,[220-p[0],p[1]]];
      brasArriere=[e(s,14,0),[132,90],[220-m[0],m[1]]];
      const versInterieur=f.materiel==='adducteurs-guide'?1:-1;
      const coussin=e(g,5*versInterieur,0), oppose=e(autreGenou,-5*versInterieur,0);
      devant=rail([110,135],coussin)+rail([110,135],oppose)+rond(coussin,5,'#7188a4')+rond(oppose,5,'#7188a4');break;
    }
    case 'hanche-cable':
    case 'hanche-cable-inverse': {
      const source=f.materiel==='hanche-cable-inverse'?[163,151]:[43,151];
      derriere=pile(source[0],51)+rail([148,85],[148,158]);
      jambeArriere=[e(h,8,1),[122,130],[123,157]];
      devant=cable(source,e(p,0,-3))+rail(e(p,-4,-4),e(p,4,-4));break;
    }
    case 'mollets-assis':
      pointe=[146,152];
      derriere=siege(103,119)+rail([141,155],[169,155])+rail([163,129],[163,158]);
      devant=rail([163,129],e(g,1,-5))+rail(e(g,-9,-5),e(g,9,-5));break;
    case 'mollets-presse':
      pointe=e(p,4,-9);
      derriere=banc([51,101],[112,150])+rail([174,56],[123,157])+rail(e(pointe,-8,-12),e(pointe,8,12));break;
    case 'poignet-paume':
    case 'poignet-dos': {
      derriere=siege(101,132)+banc([113,121],[135,121]);
      const main=e(m,10,position?-9:7);
      const cote=f.materiel==='poignet-paume'?-4:4;
      devant=ligne([m,main],'#aebfd0',5)+disque(main)+rond(e(main,-4,cote),2,'#8ad2ff');break;
    }
    case 'tirage-guide':
      derriere=siege(113,123)+rail([99,78],[99,122])+pile(52,39);
      devant=rail([52,60],m)+rail(e(m,0,-5),e(m,0,5));break;
    case 'epaules-guide':
      derriere=siege(110,121)+rail([111,64],[111,121])+pile(158,35);
      devant=rail([59,54],m)+rail(e(m,-7,0),e(m,7,0));break;
    case 'papillon-guide':
      derriere=siege(110,120)+rail([110,65],[110,120])+pile(164,50);
      brasArriere=[e(s,14,1),[220-c[0],c[1]],[220-m[0],m[1]]];
      devant=rail([65,45],m)+rail([155,45],brasArriere[2]);break;
    case 'poussee-hanches-guide':
      derriere=banc([44,116],[80,116])+rail([140,161],[174,161])+pile(180,78);
      devant=rail([176,119],e(h,0,-7))+rail(e(h,-11,-7),e(h,11,-7));break;
    case 'tapis': derriere=ligne([[34,158],[186,158]],'#335f85',7);break;
  }
  const zone = f.zone;
  const bleu = '#409bff', clair = '#8ad2ff', gris = '#aebfd0', grisFond = '#5c7590';
  const torse = ['torse','dos','abdos','epaules'].includes(zone);
  const bras = ['biceps','triceps','epaules'].includes(zone);
  const cuisse = ['cuisses','arriere','hanche'].includes(zone);
  const contenu = ligne([[25,163],[195,163]],'#31455b',2)+derriere+
    ligne(jambeArriere,cuisse?clair:grisFond,9)+ligne(brasArriere,bras?clair:grisFond,7)+
    ligne([h,g,p],zone==='mollets'?bleu:gris,10)+ligne([h,g],cuisse?bleu:gris,11)+
    ligne([h,s],torse?bleu:gris,17)+ligne([s,c,m],bras?bleu:gris,8)+(zone==='avant-bras'?ligne([c,m],bleu,7):'')+
    ligne([p,pointe],gris,7)+rond(t,10,gris)+devant;
  return '<svg class="mouvement" viewBox="0 0 220 178" '+(miniature?'aria-hidden="true"':'role="img" aria-label="Schéma de la position '+(position?'finale':'initiale')+'"')+'><rect width="220" height="178" rx="12" fill="#101c2c"/><path d="M16 34h22m-11-11v22m155 98h22m-11-11v22" stroke="#254565"/>'+contenu+'</svg>';
}
