const normaliser = valeur => typeof valeur==='string'
  ? valeur.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/[^a-z0-9]+/g,' ').trim()
  : '';

export function correspondancesImport(cibles, exercices, definitionsPersonnelles=new Set()) {
  const index=new Map(exercices.map(x=>[x.id,{
    exercice:x,
    noms:[x.nom,...(Array.isArray(x.synonymes)?x.synonymes:[])].map(normaliser).filter(Boolean),
    materiel:[x.materiel,x.equipement].map(normaliser).filter(Boolean)
  }]));
  const tries=[...exercices].sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
  const choixDemandes=new Map();
  const associations=cibles.map(cible=>{
    if (!cible || typeof cible!=='object' || (!normaliser(cible.id)&&!normaliser(cible.nom))) {
      throw Error('Une référence d’exercice ne contient ni identifiant ni nom.');
    }
    if (definitionsPersonnelles.has(cible.id)) return {id:cible.id};
    const nom=normaliser(cible.nom);
    const materiel=normaliser(cible.materiel);
    const local=index.get(cible.id);
    const compatible=x=>(!nom||x.noms.includes(nom))&&(!materiel||x.materiel.includes(materiel));
    if (local&&compatible(local)) return {id:cible.id};
    const libelle=nom||(!local?normaliser(cible.id):'');
    const candidats=libelle?[...index.values()].filter(x=>compatible(x)&&x.noms.includes(libelle)).map(x=>x.exercice):[];
    if (!local&&candidats.length===1) return {id:candidats[0].id};
    const cle=JSON.stringify([cible.id??'',nom,materiel]);
    if (!choixDemandes.has(cle)) {
      const suggestions=[...new Set([local?.exercice,...candidats].filter(Boolean))];
      const autres=tries.filter(x=>!suggestions.includes(x));
      choixDemandes.set(cle,{numero:choixDemandes.size,source:cible.nom||cible.id,materiel:cible.materiel,suggestions,autres});
    }
    return {demande:choixDemandes.get(cle)};
  });
  return {
    demandes:[...choixDemandes.values()],
    appliquer(choisir=()=>null) {
      return cibles.map((cible,i)=>{
        const {id,demande}=associations[i];
        const choisi=id??choisir(demande.numero);
        if (!id&&!index.has(choisi)) throw Error('Choisissez un exercice pour « '+demande.source+' ».');
        return {...cible,id:choisi};
      });
    }
  };
}

export function formulaireCorrespondances(demandes,e) {
  if (!demandes.length) return '';
  const options=exercices=>exercices.map(x=>'<option value="'+e(x.id)+'">'+e(x.nom)+' · '+e(x.equipement||x.materiel)+'</option>').join('');
  return '<p>Vérifiez les correspondances avant de confirmer l’import.</p>'+
    demandes.map(({numero,source,materiel,suggestions,autres})=>'<label>'+e(source)+(materiel?' · '+e(materiel):'')+
      '<select name="correspondance-'+numero+'" required><option value="">Choisir la bonne variante</option>'+
      (suggestions.length?'<optgroup label="Correspondances possibles">'+options(suggestions)+'</optgroup>':'')+
      '<optgroup label="Autres exercices du carnet">'+options(autres)+'</optgroup></select></label>').join('');
}
