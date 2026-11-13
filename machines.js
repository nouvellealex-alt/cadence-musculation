const limitePhoto=160_000;
const tailleTotale=7_000_000;
export const photoValide = valeur => typeof valeur==='string'&&valeur.length<=limitePhoto&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(valeur);

export function ficheMachineValide(ex) {
  return (ex.machine===undefined||typeof ex.machine==='boolean') &&
    (ex.zone===undefined||(typeof ex.zone==='string'&&ex.zone.length<=80)) &&
    (ex.photo===undefined||(ex.machine===true&&photoValide(ex.photo)));
}

export function limitePhotos(exercices) {
  return exercices.reduce((n,x)=>n+(x.photo?.length??0),0)<=tailleTotale;
}

export async function preparerPhoto(fichier) {
  if(fichier.size>20_000_000||fichier.type==='image/svg+xml'||/\.svgz?$/i.test(fichier.name)) throw Error('Choisis une photo matricielle de moins de 20 Mo.');
  const url=URL.createObjectURL(fichier);
  try {
    const img=new Image();
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=()=>reject(Error('Photo illisible. Essaie une image JPEG ou PNG.'));
      img.src=url;
    });
    const facteur=Math.min(1,640/Math.max(img.naturalWidth,img.naturalHeight));
    const toile=document.createElement('canvas');
    toile.width=Math.max(1,Math.round(img.naturalWidth*facteur));
    toile.height=Math.max(1,Math.round(img.naturalHeight*facteur));
    const ctx=toile.getContext('2d',{alpha:false});
    ctx.fillStyle='#151e2b';
    ctx.fillRect(0,0,toile.width,toile.height);
    ctx.drawImage(img,0,0,toile.width,toile.height);
    for(const qualite of [.8,.62,.44]) {
      const photo=toile.toDataURL('image/jpeg',qualite);
      if(photoValide(photo)) return photo;
    }
    throw Error('Cette photo reste trop lourde. Essaie un autre cadrage.');
  } finally {URL.revokeObjectURL(url);}
}

export function sauvegardePhotos(etat,inclure) {
  if(inclure) return etat;
  const sansPhoto=({photo,...fiche})=>fiche;
  const nettoyerSeance=s=>s?.exercices?.some(x=>Object.hasOwn(x,'photo'))?
    {...s,exercices:s.exercices.map(sansPhoto)}:s;
  return {...etat,persos:etat.persos.map(sansPhoto),actif:nettoyerSeance(etat.actif),seances:etat.seances.map(nettoyerSeance)};
}
