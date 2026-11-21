/**
 * Description du calcul pour le classeur Excel commun (fiche 11.3, S2) :
 * les saisies, les formules en syntaxe Excel avec noms definis, et les
 * valeurs du noyau a mettre en cache. La mise en page est celle
 * d'aedificium-ui (`classeurDeCalcul`) ; ce module ne fournit que des donnees.
 *
 * Le classeur represente le cas calcule : la generation, l'ancrage et les
 * charges dynamiques y sont des hypotheses figees ; les nombres restent
 * modifiables dans Excel, et la cohesion annulee en traction y suit le signe
 * de sigma_n (formules IF).
 *
 * Import de TYPES seulement : le noyau reste sans dependance a l'execution.
 * Unites : kN, mm, MPa.
 */

import type { CartoucheXlsx, ClasseurCalcul, GroupeXlsx, LigneCalculXlsx, LigneDonneeXlsx, VerificationXlsx } from 'aedificium-ui';
import type { DonneesInterface, Grandeur, ResultatInterface } from './interface';
import { LIBELLES_RUGOSITE, type ProfilInterface, type ValeurSourcee } from './profil';

/** Plus petit nombre de decimales (0 a 3) qui ecrit la valeur sans la deformer. */
function decimalesDe(v: number): number {
  for (let d = 0; d < 3; d++) if (Math.abs(Number(v.toFixed(d)) - v) < 1e-9) return d;
  return 3;
}

/** Source abregee a sa clause (derniere partie) : la colonne Source est etroite. */
function court(s: ValeurSourcee): string {
  const parties = s.source.split(', ');
  return parties[parties.length - 1];
}

const donnee = (grandeur: string, symbole: string, nom: string, valeur: number, unite: string, source?: string, decimales?: number): LigneDonneeXlsx => ({
  grandeur, symbole, nom, valeur, unite, decimales: decimales ?? decimalesDe(valeur), source,
});
const coef = (grandeur: string, symbole: string, nom: string, v: ValeurSourcee): LigneDonneeXlsx => donnee(grandeur, symbole, nom, v.valeur, '-', court(v), 3);
const texte = (grandeur: string, valeur: string, source?: string): LigneDonneeXlsx => ({ grandeur, symbole: '', valeur, unite: '', source });
const ligne = (grandeur: string, symbole: string, nom: string, formule: string, valeur: number, unite: string, clause?: string, decimales?: number): LigneCalculXlsx => ({
  grandeur, symbole, nom, formule, valeur, unite, clause, decimales,
});

/** Valeur d'un resultat intermediaire du noyau, par son symbole. */
function inter(liste: Grandeur[], symbole: string): number {
  const g = liste.find((x) => x.symbole === symbole);
  if (!g) throw new Error(`Classeur : resultat intermediaire ${symbole} absent.`);
  return g.valeur;
}

/**
 * Le classeur du calcul : donnees, calcul et verifications. Une verification
 * non applicable (hors domaine) ne donne que les donnees.
 */
export function classeurInterface(d: DonneesInterface, r: ResultatInterface, p: ProfilInterface, cartouche: CartoucheXlsx): ClasseurCalcul {
  const v = r.verifications[0];
  const en2004 = r.generation === '2004';
  const insuffisant = v.id === '2023-insuffisant';
  const q4 = p.ec2004;
  const q3 = p.ec2023;
  const rug = d.rugosite;

  const materiaux: LigneDonneeXlsx[] = [
    donnee('Résistance du béton le plus faible', 'f_ck', 'f_ck', d.fck, 'MPa'),
    donnee('Limite d’élasticité des armatures', 'f_yk', 'f_yk', d.fyk, 'MPa'),
    coef('Coefficient partiel du béton', 'γ_C', 'gamma_C', en2004 ? q4.gammaC : q3.gammaC),
    coef('Coefficient partiel de l’acier', 'γ_S', 'gamma_S', en2004 ? q4.gammaS : q3.gammaS),
    ...(en2004
      ? [coef('Coefficient de résistance en compression', 'α_cc', 'alpha_cc', q4.alphaCc), coef('Coefficient de résistance en traction', 'α_ct', 'alpha_ct', q4.alphaCt)]
      : [coef('Coefficient de durée de chargement', 'k_tc', 'k_tc', q3.kTc)]),
  ];

  const surface = texte('État de surface', LIBELLES_RUGOSITE[rug], en2004 ? '6.2.5(2)' : 'tableau 8.2');
  let coefficients: LigneDonneeXlsx[];
  if (en2004) {
    coefficients = [
      texte('Charges dynamiques ou de fatigue', d.dynamique ? 'oui' : 'non', '6.2.5(5)'),
      coef('Coefficient de cohésion', 'c', 'v_c', q4.c[rug]),
      coef('Coefficient de frottement', 'μ', 'mu', q4.mu[rug]),
    ];
  } else if (insuffisant) {
    const req = (x: ValeurSourcee | null): ValeurSourcee => {
      if (x === null) throw new Error('Classeur : coefficient de (8.77) absent pour cette surface.');
      return x;
    };
    coefficients = [
      texte('Armatures ancrées pour f_yd', 'non', '8.2.6(7)'),
      coef('Coefficient de cohésion', 'c_v2', 'c_v2', req(q3.cv2[rug])),
      coef('Coefficient de frottement', 'μ_v', 'mu_v', q3.muV[rug]),
      coef('Efficacité des armatures', 'k_v', 'k_v', req(q3.kV[rug])),
      coef('Effet de goujon', 'k_dowel', 'k_dowel', req(q3.kDowel[rug])),
    ];
  } else {
    coefficients = [
      texte('Armatures ancrées pour f_yd', d.Asi === 0 ? 'sans objet' : 'oui', '8.2.6(5)'),
      coef('Coefficient de cohésion', 'c_v1', 'c_v1', q3.cv1[rug]),
      coef('Coefficient de frottement', 'μ_v', 'mu_v', q3.muV[rug]),
    ];
  }

  const donnees: GroupeXlsx<LigneDonneeXlsx>[] = [
    { titre: 'Géométrie', lignes: [donnee('Bras de levier de la section composite', 'z', 'z', d.z, 'mm'), donnee('Largeur de l’interface', 'b_i', 'b_i', d.bi, 'mm')] },
    { titre: 'Matériaux', lignes: materiaux },
    {
      titre: 'Hypothèses',
      lignes: [
        surface,
        ...coefficients,
        donnee('Armatures traversant l’interface', 'A_si', 'A_si', d.Asi, 'mm²/m'),
        donnee('Angle des armatures avec l’interface', 'α', 'alpha', d.alpha, '°'),
      ],
    },
    {
      titre: 'Cas de charges',
      lignes: [
        donnee('Effort tranchant de calcul', 'V_Ed', 'V_Ed', d.VEd, 'kN'),
        donnee('Part reprise par le béton de reprise', 'β', 'beta', d.beta, '-', undefined, Math.max(2, decimalesDe(d.beta))),
        donnee('Contrainte normale (compression +)', 'σ_n', 'sigma_n', d.sigmaN, 'MPa', undefined, 3),
      ],
    },
  ];

  if (v.statut.etat !== 'calcule') return { cartouche, donnees, calcul: [], verifications: [] };

  const I = v.intermediaires;
  const s = v.sollicitation as number;
  const res = v.resistance as number;
  const sinCos = 'mu*SIN(RADIANS(alpha))+COS(RADIANS(alpha))';
  let calcul: GroupeXlsx<LigneCalculXlsx>[];
  let principale: VerificationXlsx;
  let fcd: number;
  let clauseDomaine: string;

  if (en2004) {
    fcd = inter(I, 'f_cd');
    const fctm = d.fck <= 50 ? 0.3 * d.fck ** (2 / 3) : 2.12 * Math.log(1 + (d.fck + 8) / 10);
    const nu = 0.6 * (1 - d.fck / 250);
    const cohesion = d.dynamique ? 'v_c_d' : 'v_c';
    calcul = [
      { titre: 'Contrainte agissante', lignes: [ligne('Contrainte de cisaillement à l’interface', 'v_Edi', 'v_Edi', 'beta*V_Ed*1000/(z*b_i)', s, 'MPa', '(6.24)')] },
      {
        titre: 'Résistance',
        lignes: [
          ligne('Résistance moyenne en traction', 'f_ctm', 'f_ctm', 'IF(f_ck<=50,0.3*POWER(f_ck,2/3),2.12*LN(1+(f_ck+8)/10))', fctm, 'MPa', 'tableau 3.1'),
          ligne('Résistance de calcul en traction', 'f_ctd', 'f_ctd', 'alpha_ct*0.7*f_ctm/gamma_C', inter(I, 'f_ctd'), 'MPa', '(3.16)'),
          ligne('Résistance de calcul en compression', 'f_cd', 'f_cd', 'alpha_cc*f_ck/gamma_C', fcd, 'MPa', '(3.15)'),
          ligne('Limite d’élasticité de calcul', 'f_yd', 'f_yd', 'f_yk/gamma_S', inter(I, 'f_yd'), 'MPa', '3.2.7'),
          ligne('Pourcentage d’armatures', 'ρ', 'rho', 'A_si/(b_i*1000)', inter(I, 'rho'), '-', '6.2.5(1)', 5),
          ...(d.dynamique ? [ligne('Cohésion réduite (charges dynamiques)', 'c', 'v_c_d', '0.5*v_c', inter(I, 'c'), '-', '6.2.5(5)')] : []),
          ligne('Coefficient de réduction', 'ν', 'nu', '0.6*(1-f_ck/250)', nu, '-', '(6.6N)'),
          ligne('Terme de cohésion', '', 't_coh', `IF(sigma_n<0,0,${cohesion}*f_ctd)`, inter(I, 'c f_ctd'), 'MPa', '(6.25)'),
          ligne('Terme de frottement', '', 't_frot', 'mu*sigma_n', inter(I, 'mu sigma_n'), 'MPa', '(6.25)'),
          ligne('Terme des armatures', '', 't_arm', `rho*f_yd*(${sinCos})`, inter(I, 'rho f_yd (mu sin a + cos a)'), 'MPa', '(6.25)'),
          ligne('Plafond', '', 't_plaf', '0.5*nu*f_cd', inter(I, '0,5 nu f_cd'), 'MPa', '(6.25)'),
          ligne('Résistance au cisaillement de l’interface', 'v_Rdi', 'v_Rdi', 'MIN(t_coh+t_frot+t_arm,t_plaf)', res, 'MPa', '(6.25)'),
        ],
      },
    ];
    principale = { nom: 'Cisaillement à l’interface', sollicitation: 'v_Edi', resistance: 'v_Rdi', unite: 'MPa', valeurSollicitation: s, valeurResistance: res, clause: '6.2.5(1)' };
    clauseDomaine = '6.2.5(1)';
  } else {
    fcd = inter(I, 'f_cd');
    const etaCc = Math.min((40 / d.fck) ** (1 / 3), 1);
    const sinCosV = sinCos.replace('mu*', 'mu_v*');
    const communs = [
      ligne('Coefficient de résistance du béton', 'η_cc', 'eta_cc', 'MIN(POWER(40/f_ck,1/3),1)', etaCc, '-', '(5.4)'),
      ligne('Résistance de calcul en compression', 'f_cd', 'f_cd', 'eta_cc*k_tc*f_ck/gamma_C', fcd, 'MPa', '(5.3)'),
      ligne('Limite d’élasticité de calcul', 'f_yd', 'f_yd', 'f_yk/gamma_S', insuffisant ? d.fyk / q3.gammaS.valeur : inter(I, 'f_yd'), 'MPa', '5.2.4'),
      ligne('Pourcentage d’armatures', 'ρ_i', 'rho_i', 'A_si/(b_i*1000)', inter(I, 'rho_i'), '-', '8.2.6', 5),
    ];
    const resistance = insuffisant
      ? [
          ligne('Terme de cohésion', '', 't_coh', 'IF(sigma_n<0,0,c_v2*SQRT(f_ck)/gamma_C)', inter(I, 'c_v2 √f_ck / gamma_C'), 'MPa', '(8.77)'),
          ligne('Terme de frottement', '', 't_frot', 'IF(sigma_n<0,0,mu_v*sigma_n)', inter(I, 'mu_v sigma_n'), 'MPa', '(8.77)'),
          ligne('Terme des armatures', '', 't_arm', 'k_v*rho_i*f_yd*mu_v', inter(I, 'k_v rho_i f_yd mu_v'), 'MPa', '(8.77)'),
          ligne('Terme de goujon', '', 't_goujon', 'k_dowel*rho_i*SQRT(f_yd*f_cd)', inter(I, 'k_dowel rho_i √(f_yd f_cd)'), 'MPa', '(8.77)'),
          ligne('Plafond', '', 't_plaf', '0.25*f_cd', inter(I, '0,25 f_cd'), 'MPa', '(8.77)'),
          ligne('Résistance au cisaillement de l’interface', 'τ_Rdi', 'tau_Rdi', 'MIN(t_coh+t_frot+t_arm+t_goujon,t_plaf)', res, 'MPa', '(8.77)'),
        ]
      : [
          ligne('Terme de cohésion', '', 't_coh', 'IF(sigma_n<0,0,c_v1*SQRT(f_ck)/gamma_C)', inter(I, 'c_v1 √f_ck / gamma_C'), 'MPa', '(8.76)'),
          ligne('Terme de frottement', '', 't_frot', 'IF(sigma_n<0,0,mu_v*sigma_n)', inter(I, 'mu_v sigma_n'), 'MPa', '(8.76)'),
          ligne('Terme des armatures', '', 't_arm', `rho_i*f_yd*(${sinCosV})`, inter(I, 'rho_i f_yd (mu_v sin a + cos a)'), 'MPa', '(8.76)'),
          ligne('Plafond', '', 't_plaf', '0.3*f_cd+rho_i*f_yd*COS(RADIANS(alpha))', inter(I, '0,3 f_cd + rho_i f_yd cos a'), 'MPa', '(8.76)'),
          ligne('Résistance au cisaillement de l’interface', 'τ_Rdi', 'tau_Rdi', 'MIN(t_coh+t_frot+t_arm,t_plaf)', res, 'MPa', '(8.76)'),
        ];
    calcul = [
      { titre: 'Contrainte agissante', lignes: [ligne('Contrainte de cisaillement à l’interface', 'τ_Edi', 'tau_Edi', 'beta*V_Ed*1000/(z*b_i)', s, 'MPa', '(8.75)')] },
      { titre: 'Résistance', lignes: [...communs, ...resistance] },
    ];
    principale = { nom: 'Cisaillement à l’interface', sollicitation: 'tau_Edi', resistance: 'tau_Rdi', unite: 'MPa', valeurSollicitation: s, valeurResistance: res, clause: insuffisant ? '8.2.6(7)' : '8.2.6(5)' };
    clauseDomaine = '8.2.6';
  }

  const domaine: VerificationXlsx = {
    nom: 'Contrainte normale ≤ 0,6 f_cd',
    sollicitation: 'sigma_n',
    resistance: '0.6*f_cd',
    unite: 'MPa',
    valeurSollicitation: d.sigmaN,
    valeurResistance: 0.6 * fcd,
    clause: clauseDomaine,
  };
  return { cartouche, donnees, calcul, verifications: [principale, domaine] };
}
