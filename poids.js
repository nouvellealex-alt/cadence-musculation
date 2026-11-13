// Suivi local, inclus dans les sauvegardes du carnet.
const MAX_PESEES = 20_000;
const MIN_KG = 20;
const MAX_KG = 400;
const MS_PAR_JOUR = 86_400_000;
const fr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const dateFr = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' });

function aujourdhui() {
  const date = new Date();
  const pad = n => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function jourCivil(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '0001-01-01') return NaN;
  const instant = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(+instant) || instant.toISOString().slice(0, 10) !== date) return NaN;
  return +instant / MS_PAR_JOUR;
}

const poidsValide = kg => Number.isFinite(kg) && kg >= MIN_KG && kg <= MAX_KG;
const parDate = (a, b) => a.date.localeCompare(b.date);
const dateLue = date => dateFr.format(new Date(date + 'T00:00:00Z'));

export function verifierPoids(liste) {
  if (liste === undefined) return [];
  const erreur = () => Error('Cette sauvegarde contient des pesées incomplètes ou incompatibles.');
  if (!Array.isArray(liste) || liste.length > MAX_PESEES) throw erreur();
  const vus = new Set();
  const pesées = [];
  for (const p of liste) {
    if (!p || !Number.isFinite(jourCivil(p.date)) || !poidsValide(p.kg) || vus.has(p.date)) throw erreur();
    vus.add(p.date);
    pesées.push({ date: p.date, kg: p.kg });
  }
  return pesées.sort(parDate);
}

export function ajouterPoids(etat, date, saisie) {
  if (!Number.isFinite(jourCivil(date)) || date > aujourdhui()) return false;
  const texte = String(saisie).trim();
  if (!/^\d+(?:[,.]\d+)?$/.test(texte)) return false;
  const kg = Number(texte.replace(',', '.'));
  if (!poidsValide(kg)) return false;
  const autres = (etat.poids ?? []).filter(p => p.date !== date);
  if (autres.length >= MAX_PESEES) return false;
  etat.poids = autres.concat({ date, kg: Math.round(kg * 10) / 10 }).sort(parDate);
  return true;
}

export function supprimerPoids(etat, date) {
  const pesées = etat.poids ?? [];
  const autres = pesées.filter(p => p.date !== date);
  if (autres.length === pesées.length) return false;
  etat.poids = autres;
  return true;
}

// La liste est triée par date. Un jour sans pesée n'ajoute pas de valeur.
export function moyennesPoids(liste) {
  const jours = liste.map(p => jourCivil(p.date));
  let debut = 0;
  let somme = 0;
  return liste.map((p, i) => {
    somme += p.kg;
    while (jours[debut] < jours[i] - 6) somme -= liste[debut++].kg;
    return somme / (i - debut + 1);
  });
}

function courbe(liste, moyennes) {
  const fin = jourCivil(liste.at(-1)?.date);
  const premiere = liste.findIndex(p => jourCivil(p.date) >= fin - 364);
  const points = liste.slice(Math.max(0, premiere));
  if (points.length < 2) return '<p class="muted">Ajoutez au moins deux pesées pour voir la courbe.</p>';
  const valeurs = points.map(p => p.kg);
  const lisse = moyennes.slice(Math.max(0, premiere));
  const largeur = 340, hauteur = 140, marge = 8;
  const jours = points.map(p => jourCivil(p.date));
  const valeursTracees = valeurs.concat(lisse);
  const min = Math.min(...valeursTracees), max = Math.max(...valeursTracees);
  const bas = min - 0.5, amplitude = max - bas + 0.5;
  const depart = jours[0], duree = jours.at(-1) - depart;
  const ligne = ys => ys.map((y, i) => {
    const x = marge + (jours[i] - depart) / duree * (largeur - 2 * marge);
    const v = hauteur - marge - (y - bas) / amplitude * (hauteur - 2 * marge);
    return x.toFixed(1) + ',' + v.toFixed(1);
  }).join(' ');
  return '<svg class="courbe" viewBox="0 0 ' + largeur + ' ' + hauteur +
    '" role="img" aria-label="Évolution du poids corporel">' +
    '<polyline fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5" points="' + ligne(valeurs) +
    '"/><polyline fill="none" stroke="var(--blue)" stroke-width="2.5" points="' + ligne(lisse) + '"/></svg>' +
    '<p class="muted"><small>Trait épais · moyenne mobile sur 7 jours. Trait fin · pesées. De ' +
    fr.format(min) + ' à ' + fr.format(max) + ' kg. Jusqu’à 365 jours affichés.</small></p>';
}

export function rendrePoids(etat, titre, bout, edition = '') {
  const liste = etat.poids ?? [];
  const dernier = liste.at(-1), premier = liste[0];
  const modifiee = liste.find(p => p.date === edition);
  const aujourd = aujourdhui();
  const moyennes = moyennesPoids(liste);
  const delta = liste.length > 1 ? Math.round((dernier.kg - premier.kg) * 10) / 10 : null;
  const mesures = liste.slice(-120).reverse().map(p => {
    const dateAffichee = dateLue(p.date);
    return '<div class="row spread"><span>' + dateAffichee + ' · <strong>' + fr.format(p.kg) +
      ' kg</strong></span><div class="row">' + bout('Modifier', 'poids-editer',
        'data-id="' + p.date + '" aria-label="Modifier la pesée du ' + p.date + '"') +
      bout('Supprimer', 'poids-suppr', 'data-id="' + p.date + '" aria-label="Supprimer la pesée du ' +
        p.date + '"') + '</div></div>';
  }).join('');
  return titre('SUIVI', 'Poids corporel', 'Les pesées restent sur cet appareil et sont incluses dans vos sauvegardes.') +
    '<section class="panel stack"><h2>' + (modifiee ? 'Modifier la pesée' : 'Ajouter une pesée') +
    '</h2><div class="row filters"><label>Date<input id="poids-date" type="date" value="' +
    (modifiee?.date ?? aujourd) + '" max="' + aujourd + '"' + (modifiee ? ' readonly' : '') +
    '></label><label>Poids (kg)<input id="poids-kg" type="text" inputmode="decimal" autocomplete="off" maxlength="8" placeholder="80,5" value="' +
    (modifiee ? fr.format(modifiee.kg) : '') + '"></label></div><div class="row">' +
    bout('Enregistrer le poids', 'poids-ajouter', '', 'primary') +
    (modifiee ? bout('Annuler', 'poids-annuler') : '') + '</div>' +
    (modifiee ? '' : '<p class="muted"><small>Une pesée par date. Enregistrer une date déjà renseignée met à jour la pesée.</small></p>') +
    '</section><section class="panel section stack"><h2>' + (dernier ? fr.format(dernier.kg) + ' kg' : 'Aucune pesée') +
    '</h2>' + (dernier ? '<p class="muted" id="poids-moyenne">Moyenne des 7 jours au ' +
      dateLue(dernier.date) + ' · <strong>' + fr.format(moyennes.at(-1)) + ' kg</strong></p>' : '') +
    (delta === null ? '' : '<p class="muted">' + (delta > 0 ? '+' : '') + fr.format(delta) +
      ' kg depuis le ' + dateLue(premier.date) + '</p>') + courbe(liste, moyennes) + '</section>' +
    (liste.length ? '<section class="panel section stack"><h2>Historique des pesées</h2>' + mesures +
      (liste.length > 120 ? '<p class="muted">Les 120 dernières pesées sont affichées. La sauvegarde contient l’historique complet.</p>' : '') + '</section>' : '');
}
