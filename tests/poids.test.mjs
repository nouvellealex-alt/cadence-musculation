import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ajouterPoids, supprimerPoids, verifierPoids, moyennesPoids } from '../dist/poids.js';

test('les pesées sont locales, triées et mises à jour par date', () => {
  const etat = {};
  assert.equal(ajouterPoids(etat, '2024-03-03', '80.1'), true);
  assert.equal(ajouterPoids(etat, '2024-02-29', '81,2'), true);
  assert.equal(ajouterPoids(etat, '2024-03-03', '79,5'), true);
  assert.deepEqual(etat.poids, [{ date: '2024-02-29', kg: 81.2 }, { date: '2024-03-03', kg: 79.5 }]);
  assert.equal(supprimerPoids(etat, '2024-02-29'), true);
  assert.equal(supprimerPoids(etat, '2024-02-29'), false);
  assert.deepEqual(etat.poids, [{ date: '2024-03-03', kg: 79.5 }]);
});

test('la validation rejette les dates impossibles et les poids hors limites', () => {
  const etat = {};
  for (const [date, kg] of [
    ['2025-02-29', '80'], ['2024-04-31', '80'], ['2024-03-03', '0x50'],
    ['2024-03-03', '19,99'], ['2024-03-03', '400,01'], ['2999-01-01', '80']
  ]) assert.equal(ajouterPoids(etat, date, kg), false);
  assert.deepEqual(etat, {});
  assert.deepEqual(verifierPoids(undefined), []);
  assert.throws(() => verifierPoids([{ date: '2025-02-29', kg: 80 }]), /pesées/);
  assert.throws(() => verifierPoids([{ date: '2024-02-29', kg: '80' }]), /pesées/);
  assert.throws(() => verifierPoids(Array(20_001)), /pesées/);
  assert.throws(() => verifierPoids(Array(2).fill({ date: '2024-02-29', kg: 80 })), /pesées/);
});

test('la restauration trie et ne garde que date et poids', () => {
  const mesures = [
    { date: '2024-03-03', kg: 79.5, autre: '<script>' },
    { date: '2024-02-29', kg: 80 }
  ];
  assert.deepEqual(verifierPoids(mesures), [
    { date: '2024-02-29', kg: 80 },
    { date: '2024-03-03', kg: 79.5 }
  ]);
  assert.equal(mesures[0].date, '2024-03-03');
});

test('la moyenne mobile couvre sept dates civiles, même au changement d’heure', () => {
  const mesures = [
    { date: '2024-03-24', kg: 90 },
    { date: '2024-03-25', kg: 84 },
    { date: '2024-03-31', kg: 80 },
    { date: '2024-04-08', kg: 76 }
  ];
  assert.deepEqual(moyennesPoids(mesures), [90, 87, 82, 76]);
});
