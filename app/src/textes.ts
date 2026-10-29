/**
 * Les textes affiches, en francais et en anglais. PUR.
 *
 * Deux sources :
 * - les textes de l'app (`FR`, `EN`), types : une cle oubliee en anglais ne
 *   compile pas ;
 * - les phrases du noyau (`src/`), ecrites en francais, traduites a
 *   l'affichage par `phrase`.
 *
 * ⚠ Aucun texte ne se lit au chargement d'un module : toujours `textes()` ou
 * `phrase()` AU MOMENT DU RENDU, apres `definirLangue` (main.ts).
 */

import { langueCourante, traducteur } from 'aedificium-ui';
import { LIBELLES_RUGOSITE, type Rugosite } from '../../src/index';

const FR = {
  verdicts: { conforme: 'Conforme', 'non-conforme': 'Non conforme', 'non-applicable': 'Non applicable' },
  generations: {
    '2004': '1re génération — EN 1992-1-1:2004, 6.2.5',
    '2023': '2e génération — EN 1992-1-1:2023, 8.2.6',
  },
  rugosites: LIBELLES_RUGOSITE as Record<Rugosite, string>,
  taux: 'Taux',
  oui: 'oui',
  non: 'non',
  degres: 'degrés',
  entrees: {
    titre: "Données d'entrée",
    generation: ['génération', 'texte appliqué'],
    VEd: 'effort tranchant de calcul',
    beta: "part de l'effort longitudinal dans le béton de reprise",
    z: 'bras de levier de la section composite',
    bi: "largeur de l'interface",
    surface: ['surface', 'état de surface'],
    fck: 'plus faible des deux bétons',
    fyk: 'armatures',
    Asi: "armatures traversant l'interface",
    alpha: "angle des armatures avec l'interface",
    sigmaN: 'contrainte normale, positive en compression',
    charges: ['charges', 'dynamiques ou de fatigue'],
    ancrage: ['ancrage', 'armatures ancrées pour f_yd'],
    sansObjet: 'sans objet (A_si = 0)',
  },
  verdict: { titre: 'Verdict', constat: ['constat', 'verdict'], taux: ['taux', 'sollicitation / résistance'] },
  coupe: {
    aria: "coupe de l'interface",
    reprise: 'béton de reprise',
    enPlace: 'béton en place',
    interface: 'interface',
    sansArmature: "sans armature d'interface",
  },
  note: {
    hypotheses: [
      'Contrainte agissante v_Edi = beta V_Ed / (z b_i), identique dans les deux générations ((6.24), (8.75)).',
      'Effet de goujon (2e génération) : barre supposée à au moins 10 phi du bord libre.',
      'Majoration de c_v2 par 1,2 pour les dalles rapportées non appliquée (sens de la sécurité).',
      '1re génération : surface « très lisse » à c = 0,025 (borne basse) ; « très rugueuse » traitée comme « rugueuse ».',
      'Interface en escalier (6.2.5(3)) et calcul du beta par la section ne sont pas traités : beta est saisi.',
    ],
    mention: "Valeurs recommandées de l'EN 1992-1-1 ; l'annexe nationale peut les modifier.",
    element: 'Interface entre bétons',
    interface: 'Interface',
    legende: "Coupe schématique de l'interface (pas à l'échelle)",
    materiaux: 'Bétons et armatures',
    texte: 'Texte appliqué',
    sollicitations: 'Sollicitations',
    clauses: 'Clauses :',
  },
  messages: {
    nombreAttendu: (champ: string, brut: string) => `${champ} : nombre attendu, reçu « ${brut} ».`,
    surfaceInconnue: 'État de surface inconnu.',
    format: (recu: string, attendu: string) => `Fichier de format ${recu} : attendu ${attendu}.`,
    rienAExporter: 'Aucun calcul valide à exporter : corriger la saisie.',
    nouvelleVersion: 'Une nouvelle version est disponible. Recharger maintenant ?',
  },
};

export type Textes = typeof FR;

const EN: Textes = {
  verdicts: { conforme: 'Satisfied', 'non-conforme': 'Not satisfied', 'non-applicable': 'Not applicable' },
  generations: {
    '2004': '1st generation — EN 1992-1-1:2004, 6.2.5',
    '2023': '2nd generation — EN 1992-1-1:2023, 8.2.6',
  },
  rugosites: {
    'tres-lisse': 'very smooth',
    lisse: 'smooth',
    rugueuse: 'rough',
    'tres-rugueuse': 'very rough (2nd generation)',
    'a-cles': 'indented',
  },
  taux: 'Ratio',
  oui: 'yes',
  non: 'no',
  degres: 'degrees',
  entrees: {
    titre: 'Input data',
    generation: ['generation', 'applied standard'],
    VEd: 'design shear force',
    beta: 'share of the longitudinal force in the new concrete',
    z: 'lever arm of the composite section',
    bi: 'width of the interface',
    surface: ['surface', 'surface condition'],
    fck: 'weaker of the two concretes',
    fyk: 'reinforcement',
    Asi: 'reinforcement crossing the interface',
    alpha: 'angle of the reinforcement to the interface',
    sigmaN: 'normal stress, positive in compression',
    charges: ['loads', 'dynamic or fatigue'],
    ancrage: ['anchorage', 'reinforcement anchored to develop f_yd'],
    sansObjet: 'not relevant (A_si = 0)',
  },
  verdict: { titre: 'Verdict', constat: ['finding', 'verdict'], taux: ['ratio', 'demand / resistance'] },
  coupe: {
    aria: 'section through the interface',
    reprise: 'new concrete',
    enPlace: 'existing concrete',
    interface: 'interface',
    sansArmature: 'no reinforcement across the interface',
  },
  note: {
    hypotheses: [
      'Design shear stress v_Edi = beta V_Ed / (z b_i), the same in both generations ((6.24), (8.75)).',
      'Dowel action (2nd generation): bar assumed at least 10 phi from the free edge.',
      'The 1.2 increase of c_v2 for topping slabs is not applied (on the safe side).',
      '1st generation: “very smooth” surface with c = 0.025 (lower bound); “very rough” treated as “rough”.',
      'Stepped interfaces (6.2.5(3)) and the derivation of beta from the section are not covered: beta is an input.',
    ],
    mention: 'Recommended values of EN 1992-1-1; the National Annex may modify them.',
    element: 'Concrete-to-concrete interface',
    interface: 'Interface',
    legende: 'Schematic section through the interface (not to scale)',
    materiaux: 'Concrete and reinforcement',
    texte: 'Applied standard',
    sollicitations: 'Design actions',
    clauses: 'Clauses:',
  },
  messages: {
    nombreAttendu: (champ: string, brut: string) => `${champ}: number expected, got “${brut}”.`,
    surfaceInconnue: 'Unknown surface condition.',
    format: (recu: string, attendu: string) => `File of format ${recu}: expected ${attendu}.`,
    rienAExporter: 'No valid calculation to export: correct the input.',
    nouvelleVersion: 'A new version is available. Reload now?',
  },
};

/** Les textes de la langue courante. */
export function textes(): Textes {
  return langueCourante() === 'en' ? EN : FR;
}

// --- Phrases du noyau ----------------------------------------------------------

const EXACTES: Record<string, string> = {
  // Titres et clauses des verifications.
  "Cisaillement à l'interface, EN 1992-1-1:2004": 'Shear at the interface, EN 1992-1-1:2004',
  'Armatures ancrées pour f_yd, EN 1992-1-1:2023': 'Reinforcement anchored to develop f_yd, EN 1992-1-1:2023',
  'Ancrage insuffisant pour f_yd, EN 1992-1-1:2023': 'Anchorage insufficient to develop f_yd, EN 1992-1-1:2023',
  'tableau 8.2': 'Table 8.2',
  // Libelles des grandeurs intermediaires.
  'cohésion': 'cohesion',
  'cohésion, divisée par 2 (charges dynamiques, 6.2.5(5))': 'cohesion, halved (dynamic loads, 6.2.5(5))',
  'frottement': 'friction',
  'annulé : interface tendue': 'nil: interface in tension',
  'terme de cohésion': 'cohesion term',
  'terme de frottement': 'friction term',
  'terme des armatures': 'reinforcement term',
  'terme de goujon': 'dowel term',
  'plafond, nu = 0,6 (1 - f_ck/250)': 'upper limit, nu = 0.6 (1 - f_ck/250)',
  'plafond': 'upper limit',
  'résistance': 'resistance',
  'efficacité des armatures': 'effectiveness of the reinforcement',
  'effet de goujon': 'dowel action',
  // Motifs et avertissements.
  'Interface à clés : la formule (8.77) est sans objet.': 'Indented interface: expression (8.77) does not apply.',
  'Surface « très rugueuse » : classe absente de la 1re génération, traitée comme « rugueuse ».':
    'Surface “very rough”: class absent from the 1st generation, treated as “rough”.',
  'Surface « très lisse » : c pris à la borne basse 0,025 de la plage 0,025 à 0,1 de 6.2.5(2).':
    'Surface “very smooth”: c taken at the lower bound 0.025 of the range 0.025 to 0.1 in 6.2.5(2).',
  "Charges dynamiques ou de fatigue : la réduction de 6.2.5(5) de la 1re génération n'est pas reprise ici en 2e génération.":
    'Dynamic or fatigue loads: the reduction of 6.2.5(5) in the 1st generation is not carried over to the 2nd generation.',
  // Erreurs de donnees.
  'A_si doit être un nombre positif ou nul (mm2/m).': 'A_si must be zero or a positive number (mm2/m).',
  "beta ne peut pas dépasser 1 : c'est une part de l'effort longitudinal.": 'beta cannot exceed 1: it is a share of the longitudinal force.',
};

/** Unites en toutes lettres dans les phrases du noyau. */
const unite = (u: string): string => (u === 'degrés' ? 'degrees' : u);

/**
 * Traduit une phrase du noyau (titre, clause, libelle, symbole, motif,
 * avertissement, erreur). En francais, la phrase sort intacte.
 */
export const phrase = traducteur(EXACTES, [
  [/^sigma_n dépasse (.+)$/, 'sigma_n exceeds $1'],
  [/^alpha = (.+) degrés hors de la plage (\S+) à (\S+) degrés de (.+)$/, 'alpha = $1 degrees outside the range $2 to $3 degrees of $4'],
  [/^alpha = (.+) degrés hors de la plage (\S+) à (\S+) degrés (.+)$/, 'alpha = $1 degrees outside the range $2 to $3 degrees $4'],
  [/^(\S+) doit être un nombre strictement positif \((.+)\)\.$/, (_m, nom: string, u: string) => `${nom} must be a strictly positive number (${unite(u)}).`],
  [/^(\S+) doit être un nombre \((.+)\)\.$/, (_m, nom: string, u: string) => `${nom} must be a number (${unite(u)}).`],
  [/^(\S+ = .+ MPa (?:<=|>) .+ MPa) \((.+)\)\.$/, (_m, comparaison: string, titre: string) => `${comparaison} (${EXACTES[titre] ?? titre}).`],
]);
