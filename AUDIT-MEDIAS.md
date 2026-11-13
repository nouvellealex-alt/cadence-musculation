# Audit des visuels de Cadence

## Révision après signalement des postures incohérentes

Les 91 fiches restent disponibles. Quarante affichent un visuel dans cette version, dont sept une vidéo. Pour les autres fiches, l’interface montre les consignes écrites pendant la revue des schémas. Les schémas qui passent la revue sont présentés comme des repères simplifiés.

La seconde revue a corrigé les pompes, les fentes arrière, les extensions des mollets, le crunch à la poulie, le squat à la Smith et le tirage bras tendus à la poulie. Elle a porté sur les points de contact, la stabilité des proportions et le trajet de l’équipement. La fiche des fentes arrière conserve sa photo de référence. Le dessin de la machine à mollets a été repris et reste en attente d’une revue du matériel.

## Inventaire avant le filtre des schémas

Le catalogue compte 91 fiches. Sept proposent une vidéo de démonstration. Trente-trois proposent des illustrations fixes indépendantes de la vidéo, pour 54 fichiers WebP. Cinquante-six utilisent uniquement les schémas de Cadence. Certaines fiches vidéo ont aussi des illustrations fixes, ce qui explique le recoupement des comptes.

Chaque vidéo a une image d’attente extraite du fichier MP4 affiché. Une image fixe, un schéma de début ou de fin et une image d’attente se distinguent d’une vidéo par leur format et par les commandes de lecture.

## Vérifications

- Vérification automatique des 91 associations, de la présence des ressources, de l’identité du fichier par fiche, des formats, des crédits et des visuels sans fichier. Commande de contrôle `node --test tests/catalogue.test.mjs`.
- Revue des 60 images fixes présentes avant correction et des schémas des 67 fiches qui en disposaient, avec rendu des deux positions dans Chromium. Les schémas donnent des repères de posture et de matériel.
- Décodage intégral des sept vidéos avec FFmpeg et revue de huit images réparties sur la durée de chacune. Chaque image d’attente a été comparée à l’image de la vidéo à l’instant indiqué. Les sources et licences par fichier sont dans [les crédits](CREDITS-MEDIAS.md).

| Démonstration | Fichier | Geste et matériel vus | Durée | Image d’attente |
|---|---|---|---:|---:|
| Développé couché | `dc-21.mp4` | Poussée à la barre libre sur banc plat, avec supports | 15,85 s | 2,97 s |
| Développé couché aux haltères | `dc-halteres-17.mp4` | Poussée de deux haltères sur banc plat | 14,10 s | 2,64 s |
| Presse à cuisses | `pre-46.mp4` | Flexion et extension des jambes sur presse horizontale | 17,63 s | 7,71 s |
| Tractions en pronation | `tra-71.mp4` | Tirage en suspension, prise en pronation. Le cadre coupe le bas des jambes | 18,77 s | 3,52 s |
| Élévations latérales | `lat-6.mp4` | Élévation de deux haltères sur les côtés | 18,25 s | 1,14 s |
| Flexion des biceps | `cur-48.mp4` | Flexion debout avec deux haltères, paumes qui se tournent vers le haut pendant la montée | 10,93 s | 8,88 s |
| Soulevé de terre roumain aux haltères | `rou-halteres-2.mp4` | Charnière de hanches debout avec deux haltères | 13,00 s | 5,69 s |

## Corrections

- **Mobilité de cheville en fente.** Le visuel précédent présentait une variante à genou sans appui des mains. Les deux nouveaux schémas montrent la variante décrite avec appui au mur et talon au sol.
- **Tirage buste penché.** Les illustrations tierces montraient un tirage avec les coudes écartés, orienté vers l’arrière des épaules. La fiche utilise les deux schémas du tirage de la barre vers le ventre.
- **Squat avec haltère devant la poitrine.** La photo montrait les talons sur des disques. Le schéma de la fiche montre un haltère tenu verticalement et des appuis au sol.
- **Écarté inversé et développé incliné.** Les schémas de référence montrent maintenant l’écarté inversé assis à la machine et les deux haltères séparés au développé incliné.
- **Images d’attente.** Chaque vidéo utilise un extrait du fichier joué. Les chemins des anciens visuels restent distribués pour les versions en cache et figurent dans les crédits.

La revue a comparé l’exercice, le matériel visible et la variante. La qualité de l’exécution et l’adaptation de l’exercice à une personne nécessiteraient une appréciation professionnelle. Le cadrage de la traction ne permet pas de confirmer visuellement la présence ou l’absence d’une assistance sous le champ.

## Démonstrations ajoutées après comparaison avec les fiches

| Fiche | Fichier | Geste et matériel vus | Durée | Image d’attente |
|---|---|---|---:|---:|
| adducteurs-machine | `adducteurs-machine-74.mp4` | Adduction des cuisses assis contre les coussins latéraux | 20,87 s | 12,52 s |
| curl-poulie | `curl-poulie-50.mp4` | Flexion debout avec barre droite et poulie basse | 10,45 s | 6,27 s |
| curlj | `curlj-35.mp4` | Flexion des genoux allongé sur une machine à rouleau | 15,07 s | 3,92 s |
| developpe-epaules-machine | `developpe-epaules-machine-11.mp4` | Poussée verticale assise aux poignées d’une machine à dossier | 12,27 s | 5,28 s |
| di | `di-24.mp4` | Poussée de deux haltères sur banc incliné | 27,44 s | 16,46 s |
| dip | `dip-64.mp4` | Flexion puis extension des bras en appui sur deux barres parallèles | 12,65 s | 3,29 s |
| fentes-marchees | `fentes-marchees-33.mp4` | Fentes vers l’avant en déplacement avec un haltère par main | 14,31 s | 11,16 s |
| flexion-jambes-assis | `flexion-jambes-assis-37.mp4` | Flexion des genoux assis, cuisses sous le coussin et chevilles sur le rouleau mobile | 24,90 s | 14,94 s |
| hip | `hip-72.mp4` | Élévation du bassin avec une barre, pieds au sol et haut du dos sur le banc | 30,20 s | 18,12 s |
| mar | `mar-51.mp4` | Flexion debout de deux haltères en prise neutre | 10,37 s | 6,22 s |
| mil-halteres | `mil-halteres-12.mp4` | Poussée de deux haltères au-dessus de la tête, assis avec dossier | 23,13 s | 13,88 s |
| mollets-assis | `mollets-assis-13.mp4` | Élévation des talons sur machine assise, support sur les cuisses | 20,72 s | 12,43 s |
| rowing-poulie | `rowing-poulie-1.mp4` | Tirage assis, pieds calés, poignée serrée reliée à la poulie basse | 10,48 s | 2,73 s |
| sq-smith | `sq-smith-42.mp4` | Squat avec barre sur le dos, chariot engagé dans les rails Smith | 11,95 s | 7,17 s |
| fentes-marchees-barre | `fentes-marchees-barre-34.mp4` | Fentes vers l’avant en déplacement avec une barre sur le haut du dos | 12,73 s | 7,64 s |
| flexion-pupitre-halteres | `flexion-pupitre-halteres-52.mp4` | Flexion d’un coude avec un haltère, bras en appui sur le pupitre | 13,02 s | 7,81 s |
| front-squat | `front-squat-28.mp4` | Squat libre avec barre devant les épaules et prise croisée | 16,10 s | 6,92 s |
| triceps-couche-halteres | `triceps-couche-halteres-60.mp4` | Flexion des coudes avec deux haltères de part et d’autre du visage, allongé sur banc plat | 18,67 s | 11,20 s |
| triceps-ez | `triceps-ez-61.mp4` | Flexion et extension des coudes avec une barre EZ, allongé sur banc plat | 15,17 s | 9,10 s |
| flexion-pupitre-ez | `flexion-pupitre-ez-53.mp4` | Flexion simultanée des coudes sur un pupitre, prise en supination avec barre EZ | 25,78 s | 15,47 s |
| incline-machine | `incline-machine-16.mp4` | Poussée inclinée sur une machine à leviers chargée de disques | 19,86 s | 11,92 s |
| oiseau-halteres-assis | `oiseau-halteres-assis-7.mp4` | Élévation latérale des haltères, assis sur le banc avec le buste penché | 7,60 s | 3,27 s |
| triceps-coude-dos | `triceps-coude-dos-77.mp4` | Extension du coude à un haltère, buste penché et main libre appuyée sur un banc | 13,10 s | 1,31 s |
| tri-haut-halteres-assis | `tri-haut-halteres-assis-57.mp4` | Extension des coudes au-dessus de la tête, un haltère tenu à deux mains, assis sur un banc à dossier | 31,97 s | 3,20 s |
