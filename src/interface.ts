/**
 * Cisaillement le long des surfaces de reprise de betonnage (dalle rapportee
 * sur predalle, reprise entre deux phases de coulage).
 *
 * Unites : kN, mm, MPa ; A_si en mm2 par metre de longueur d'interface.
 *
 * Contrainte agissante, identique dans les deux generations :
 *   v_Edi = beta V_Ed / (z b_i)                                  (6.24), (8.75)
 *
 * 1re generation, EN 1992-1-1:2004, 6.2.5 :
 *   v_Rdi = c f_ctd + mu sigma_n + rho f_yd (mu sin a + cos a) <= 0,5 nu f_cd   (6.25)
 *
 * 2e generation, EN 1992-1-1:2023, 8.2.6, deux cas :
 *   armatures ancrees pour f_yd (ou absentes) :                              (8.76)
 *     c_v1 sqrt(f_ck)/gamma_C + mu_v sigma_n + rho_i f_yd (mu_v sin a + cos a)
 *       <= 0,30 f_cd + rho_i f_yd cos a
 *   armatures dont l'ancrage ne permet pas la plastification :               (8.77)
 *     c_v2 sqrt(f_ck)/gamma_C + mu_v sigma_n + k_v rho_i f_yd mu_v
 *       + k_dowel rho_i sqrt(f_yd f_cd) <= 0,25 f_cd
 *
 * Moteur repris du blog ec2-2e-generation (article « interfaces »), dont les
 * formules ont ete relues sur les textes ; choix declares dans `profil.ts`.
 * L'effet de goujon suppose la barre a au moins 10 phi du bord libre ; la
 * majoration de c_v2 par 1,2 des dalles rapportees n'est pas appliquee (sens
 * de la securite).
 */

import type { ProfilInterface, Rugosite } from './profil';
import { verifierProfil } from './profil';

export type Generation = '2004' | '2023';

export interface DonneesInterface {
  /** Effort tranchant de calcul (kN). */
  VEd: number;
  /** Part de l'effort longitudinal reprise par le beton de reprise (-). */
  beta: number;
  /** Bras de levier de la section composite (mm). */
  z: number;
  /** Largeur de l'interface (mm). */
  bi: number;
  rugosite: Rugosite;
  /** Resistance du plus faible des deux betons (MPa). */
  fck: number;
  fyk: number;
  /** Armatures traversant l'interface (mm2/m). */
  Asi: number;
  /** Angle des armatures avec l'interface (degres). */
  alpha: number;
  /** Contrainte normale a l'interface, positive en compression (MPa). */
  sigmaN: number;
  /** 2004 : charges dynamiques ou de fatigue, c divise par deux (6.2.5(5)). */
  dynamique: boolean;
  /** 2023 : les armatures sont ancrees pour developper f_yd. */
  armaturesAncrees: boolean;
}

export interface Grandeur {
  symbole: string;
  libelle: string;
  valeur: number;
  unite: string;
}

export type Statut = { etat: 'calcule' } | { etat: 'non-applicable'; motif: string };

export interface Verification {
  id: string;
  titre: string;
  clauses: string[];
  statut: Statut;
  /** Contrainte agissante et resistance (MPa) ; absentes si non applicable. */
  sollicitation?: number;
  resistance?: number;
  /** Taux sollicitation / resistance ; absent si la resistance est nulle. */
  taux?: number;
  intermediaires: Grandeur[];
}

export interface ResultatInterface {
  generation: Generation;
  verifications: Verification[];
  verdict: 'conforme' | 'non-conforme' | 'non-applicable';
  motif: string;
  avertissements: string[];
}

const N_PAR_KN = 1000;
const MM_PAR_M = 1000;
const rad = (deg: number): number => (deg * Math.PI) / 180;

function positif(v: number, nom: string, unite: string): void {
  if (!(Number.isFinite(v) && v > 0)) throw new Error(`${nom} doit etre un nombre strictement positif (${unite}).`);
}

function controlerDonnees(d: DonneesInterface): void {
  positif(d.VEd, 'V_Ed', 'kN');
  positif(d.beta, 'beta', '-');
  positif(d.z, 'z', 'mm');
  positif(d.bi, 'b_i', 'mm');
  positif(d.fck, 'f_ck', 'MPa');
  positif(d.fyk, 'f_yk', 'MPa');
  if (!(Number.isFinite(d.Asi) && d.Asi >= 0)) throw new Error('A_si doit etre un nombre positif ou nul (mm2/m).');
  if (!Number.isFinite(d.alpha)) throw new Error('alpha doit etre un nombre (degres).');
  if (!Number.isFinite(d.sigmaN)) throw new Error('sigma_n doit etre un nombre (MPa).');
  if (d.beta > 1) throw new Error('beta ne peut pas depasser 1 : c est une part de l effort longitudinal.');
}

/** v_Edi = beta V_Ed / (z b_i) (MPa). */
export function contrainteInterface(d: DonneesInterface): number {
  return (d.beta * d.VEd * N_PAR_KN) / (d.z * d.bi);
}

/** rho = A_si / A_i, A_i aire de l'interface par metre (b_i × 1000 mm). */
export function tauxArmature(d: DonneesInterface): number {
  return d.Asi / (d.bi * MM_PAR_M);
}

function g(symbole: string, libelle: string, valeur: number, unite: string): Grandeur {
  return { symbole, libelle, valeur, unite };
}

function avecTaux(v: Omit<Verification, 'taux'>): Verification {
  const s = v.sollicitation;
  const r = v.resistance;
  return s !== undefined && r !== undefined && r > 0 ? { ...v, taux: s / r } : v;
}

// --- 1re generation -----------------------------------------------------------

export function verifier2004(d: DonneesInterface, p: ProfilInterface): Verification {
  const q = p.ec2004;
  const titre = 'Cisaillement a l interface, EN 1992-1-1:2004';
  const clauses = ['6.2.5(1)', '(6.24)', '(6.25)', '6.2.5(2)'];
  const fcd = (q.alphaCc.valeur * d.fck) / q.gammaC.valeur;
  if (d.alpha < 45 || d.alpha > 90) {
    return { id: '2004', titre, clauses, statut: { etat: 'non-applicable', motif: `alpha = ${d.alpha} degres hors de la plage 45 a 90 degres de 6.2.5(1).` }, intermediaires: [] };
  }
  if (d.sigmaN > 0.6 * fcd) {
    return { id: '2004', titre, clauses, statut: { etat: 'non-applicable', motif: 'sigma_n depasse 0,6 f_cd (6.2.5(1)).' }, intermediaires: [] };
  }
  const v = contrainteInterface(d);
  const rho = tauxArmature(d);
  const c = q.c[d.rugosite].valeur * (d.dynamique ? 0.5 : 1);
  const mu = q.mu[d.rugosite].valeur;
  const fctm = d.fck <= 50 ? 0.3 * d.fck ** (2 / 3) : 2.12 * Math.log(1 + (d.fck + 8) / 10);
  const fctd = (0.7 * fctm) / q.gammaC.valeur;
  const fyd = d.fyk / q.gammaS.valeur;
  const nu = 0.6 * (1 - d.fck / 250);
  // Interface tendue : c f_ctd est annule (6.2.5(1)) ; mu sigma_n, negatif, reste compte.
  const cohesion = d.sigmaN < 0 ? 0 : c * fctd;
  const frottement = mu * d.sigmaN;
  const acier = rho * fyd * (mu * Math.sin(rad(d.alpha)) + Math.cos(rad(d.alpha)));
  const plafond = 0.5 * nu * fcd;
  const vRdi = Math.min(cohesion + frottement + acier, plafond);
  return avecTaux({
    id: '2004',
    titre,
    clauses,
    statut: { etat: 'calcule' },
    sollicitation: v,
    resistance: vRdi,
    intermediaires: [
      g('v_Edi', 'beta V_Ed / (z b_i)', v, 'MPa'),
      g('c', d.dynamique ? 'cohesion, divisee par 2 (charges dynamiques, 6.2.5(5))' : 'cohesion', c, '-'),
      g('mu', 'frottement', mu, '-'),
      g('f_ctd', '0,7 f_ctm / gamma_C', fctd, 'MPa'),
      g('f_cd', 'alpha_cc f_ck / gamma_C', fcd, 'MPa'),
      g('f_yd', 'f_yk / gamma_S', fyd, 'MPa'),
      g('rho', 'A_si / A_i', rho, '-'),
      g('c f_ctd', d.sigmaN < 0 ? 'annule : interface tendue' : 'terme de cohesion', cohesion, 'MPa'),
      g('mu sigma_n', 'terme de frottement', frottement, 'MPa'),
      g('rho f_yd (mu sin a + cos a)', 'terme des armatures', acier, 'MPa'),
      g('0,5 nu f_cd', 'plafond, nu = 0,6 (1 - f_ck/250)', plafond, 'MPa'),
      g('v_Rdi', 'resistance', vRdi, 'MPa'),
    ],
  });
}

// --- 2e generation ------------------------------------------------------------

function fcd2023(d: DonneesInterface, p: ProfilInterface): number {
  const etaCc = Math.min((40 / d.fck) ** (1 / 3), 1);
  return (etaCc * p.ec2023.kTc.valeur * d.fck) / p.ec2023.gammaC.valeur;
}

function conditions2023(d: DonneesInterface, fcd: number): string | null {
  const max = d.rugosite === 'tres-lisse' ? 90 : 135;
  if (d.alpha < 35 || d.alpha > max) return `alpha = ${d.alpha} degres hors de la plage 35 a ${max} degres (8.2.6).`;
  if (d.sigmaN > 0.6 * fcd) return 'sigma_n depasse 0,6 f_cd (8.2.6).';
  return null;
}

export function verifier2023Ancrees(d: DonneesInterface, p: ProfilInterface): Verification {
  const q = p.ec2023;
  const titre = 'Armatures ancrees pour f_yd, EN 1992-1-1:2023';
  const clauses = ['8.2.6(5)', '(8.75)', '(8.76)', 'tableau 8.2'];
  const fcd = fcd2023(d, p);
  const motif = conditions2023(d, fcd);
  if (motif !== null) return { id: '2023-ancrees', titre, clauses, statut: { etat: 'non-applicable', motif }, intermediaires: [] };
  const tau = contrainteInterface(d);
  const rho = tauxArmature(d);
  const cv1 = q.cv1[d.rugosite].valeur;
  const mu = q.muV[d.rugosite].valeur;
  const fyd = d.fyk / q.gammaS.valeur;
  const traction = d.sigmaN < 0;
  const cohesion = traction ? 0 : (cv1 * Math.sqrt(d.fck)) / q.gammaC.valeur;
  const frottement = traction ? 0 : mu * d.sigmaN;
  const acier = rho * fyd * (mu * Math.sin(rad(d.alpha)) + Math.cos(rad(d.alpha)));
  const plafond = 0.3 * fcd + rho * fyd * Math.cos(rad(d.alpha));
  const tauRdi = Math.min(cohesion + frottement + acier, plafond);
  return avecTaux({
    id: '2023-ancrees',
    titre,
    clauses,
    statut: { etat: 'calcule' },
    sollicitation: tau,
    resistance: tauRdi,
    intermediaires: [
      g('tau_Edi', 'beta V_Ed / (z b_i)', tau, 'MPa'),
      g('c_v1', 'cohesion', cv1, '-'),
      g('mu_v', 'frottement', mu, '-'),
      g('f_cd', 'eta_cc k_tc f_ck / gamma_C', fcd, 'MPa'),
      g('f_yd', 'f_yk / gamma_S', fyd, 'MPa'),
      g('rho_i', 'A_si / A_i', rho, '-'),
      g('c_v1 √f_ck / gamma_C', traction ? 'annule : interface tendue' : 'terme de cohesion', cohesion, 'MPa'),
      g('mu_v sigma_n', traction ? 'annule : interface tendue' : 'terme de frottement', frottement, 'MPa'),
      g('rho_i f_yd (mu_v sin a + cos a)', 'terme des armatures', acier, 'MPa'),
      g('0,30 f_cd + rho_i f_yd cos a', 'plafond', plafond, 'MPa'),
      g('tau_Rdi', 'resistance', tauRdi, 'MPa'),
    ],
  });
}

export function verifier2023AncrageInsuffisant(d: DonneesInterface, p: ProfilInterface): Verification {
  const q = p.ec2023;
  const titre = 'Ancrage insuffisant pour f_yd, EN 1992-1-1:2023';
  const clauses = ['8.2.6(7)', '(8.75)', '(8.77)', 'tableau 8.2'];
  const fcd = fcd2023(d, p);
  const cv2 = q.cv2[d.rugosite];
  const kv = q.kV[d.rugosite];
  const kd = q.kDowel[d.rugosite];
  if (cv2 === null || kv === null || kd === null) {
    return { id: '2023-insuffisant', titre, clauses, statut: { etat: 'non-applicable', motif: 'Interface a cles : la formule (8.77) est sans objet.' }, intermediaires: [] };
  }
  const motif = conditions2023(d, fcd);
  if (motif !== null) return { id: '2023-insuffisant', titre, clauses, statut: { etat: 'non-applicable', motif }, intermediaires: [] };
  const tau = contrainteInterface(d);
  const rho = tauxArmature(d);
  const mu = q.muV[d.rugosite].valeur;
  const fyd = d.fyk / q.gammaS.valeur;
  const traction = d.sigmaN < 0;
  const cohesion = traction ? 0 : (cv2.valeur * Math.sqrt(d.fck)) / q.gammaC.valeur;
  const frottement = traction ? 0 : mu * d.sigmaN;
  const acier = kv.valeur * rho * fyd * mu;
  const goujon = kd.valeur * rho * Math.sqrt(fyd * fcd);
  const plafond = 0.25 * fcd;
  const tauRdi = Math.min(cohesion + frottement + acier + goujon, plafond);
  return avecTaux({
    id: '2023-insuffisant',
    titre,
    clauses,
    statut: { etat: 'calcule' },
    sollicitation: tau,
    resistance: tauRdi,
    intermediaires: [
      g('tau_Edi', 'beta V_Ed / (z b_i)', tau, 'MPa'),
      g('c_v2', 'cohesion', cv2.valeur, '-'),
      g('mu_v', 'frottement', mu, '-'),
      g('k_v', 'efficacite des armatures', kv.valeur, '-'),
      g('k_dowel', 'effet de goujon', kd.valeur, '-'),
      g('f_cd', 'eta_cc k_tc f_ck / gamma_C', fcd, 'MPa'),
      g('rho_i', 'A_si / A_i', rho, '-'),
      g('c_v2 √f_ck / gamma_C', traction ? 'annule : interface tendue' : 'terme de cohesion', cohesion, 'MPa'),
      g('mu_v sigma_n', traction ? 'annule : interface tendue' : 'terme de frottement', frottement, 'MPa'),
      g('k_v rho_i f_yd mu_v', 'terme des armatures', acier, 'MPa'),
      g('k_dowel rho_i √(f_yd f_cd)', 'terme de goujon', goujon, 'MPa'),
      g('0,25 f_cd', 'plafond', plafond, 'MPa'),
      g('tau_Rdi', 'resistance', tauRdi, 'MPa'),
    ],
  });
}

// --- Verification complete -----------------------------------------------------

/**
 * La verification de la generation demandee, avec son verdict.
 *
 * En 2023, l'expression suit l'ancrage declare par l'utilisateur ; sans
 * armatures (A_si = 0), c'est (8.76), qui couvre l'interface non armee.
 */
export function verifierInterface(d: DonneesInterface, generation: Generation, p: ProfilInterface): ResultatInterface {
  verifierProfil(p);
  controlerDonnees(d);

  const avertissements: string[] = [];
  let verifications: Verification[];
  if (generation === '2004') {
    if (d.rugosite === 'tres-rugueuse') avertissements.push('Surface « tres rugueuse » : classe absente de la 1re generation, traitee comme « rugueuse ».');
    if (d.rugosite === 'tres-lisse') avertissements.push('Surface « tres lisse » : c pris a la borne basse 0,025 de la plage 0,025 a 0,10 de 6.2.5(2).');
    verifications = [verifier2004(d, p)];
  } else {
    if (d.dynamique) avertissements.push('Charges dynamiques ou de fatigue : la reduction de 6.2.5(5) de la 1re generation n est pas reprise ici en 2e generation.');
    verifications = [d.Asi === 0 || d.armaturesAncrees ? verifier2023Ancrees(d, p) : verifier2023AncrageInsuffisant(d, p)];
  }

  const retenue = verifications[0];
  if (retenue.statut.etat === 'non-applicable') {
    return { generation, verifications, verdict: 'non-applicable', motif: retenue.statut.motif, avertissements };
  }
  const s = retenue.sollicitation as number;
  const r = retenue.resistance as number;
  const ok = s <= r;
  const motif = `${generation === '2004' ? 'v_Edi' : 'tau_Edi'} = ${s.toFixed(3)} MPa ${ok ? '<=' : '>'} ${r.toFixed(3)} MPa (${retenue.titre}).`;
  return { generation, verifications, verdict: ok ? 'conforme' : 'non-conforme', motif, avertissements };
}
