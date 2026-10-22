/**
 * Profils normatifs des deux generations de l'EN 1992-1-1 pour le
 * cisaillement a l'interface.
 *
 * Les coefficients de rugosite et les coefficients partiels sont des valeurs
 * RECOMMANDEES, que l'annexe nationale peut modifier. Chaque valeur porte sa
 * source ; une valeur sans source bloque le calcul (`verifierProfil`).
 *
 * Grandeurs sans dimension.
 */

export interface ValeurSourcee {
  valeur: number;
  source: string;
}

/** Les cinq etats de surface. « tres-rugueuse » n'existe qu'en 2e generation. */
export type Rugosite = 'tres-lisse' | 'lisse' | 'rugueuse' | 'tres-rugueuse' | 'a-cles';

export const RUGOSITES: readonly Rugosite[] = ['tres-lisse', 'lisse', 'rugueuse', 'tres-rugueuse', 'a-cles'];

export const LIBELLES_RUGOSITE: Record<Rugosite, string> = {
  'tres-lisse': 'tres lisse',
  lisse: 'lisse',
  rugueuse: 'rugueuse',
  'tres-rugueuse': 'tres rugueuse (2e generation)',
  'a-cles': 'a cles',
};

export interface Profil2004 {
  gammaC: ValeurSourcee;
  gammaS: ValeurSourcee;
  /** alpha_cc dans f_cd = alpha_cc f_ck / gamma_C. */
  alphaCc: ValeurSourcee;
  /** c et mu par etat de surface, 6.2.5(2). */
  c: Record<Rugosite, ValeurSourcee>;
  mu: Record<Rugosite, ValeurSourcee>;
}

export interface Profil2023 {
  gammaC: ValeurSourcee;
  gammaS: ValeurSourcee;
  /** k_tc dans f_cd = eta_cc k_tc f_ck / gamma_C (mise en charge avant 90 jours). */
  kTc: ValeurSourcee;
  /** Tableau 8.2 ; une valeur `null` : formule (8.77) sans objet pour cette surface. */
  cv1: Record<Rugosite, ValeurSourcee>;
  muV: Record<Rugosite, ValeurSourcee>;
  cv2: Record<Rugosite, ValeurSourcee | null>;
  kV: Record<Rugosite, ValeurSourcee | null>;
  kDowel: Record<Rugosite, ValeurSourcee | null>;
}

export interface ProfilInterface {
  nom: string;
  date: string;
  ec2004: Profil2004;
  ec2023: Profil2023;
}

function controler(chemin: string, v: ValeurSourcee | null): void {
  if (v === null) return;
  if (!Number.isFinite(v.valeur)) throw new Error(`Profil : ${chemin} n est pas un nombre.`);
  if (v.source.trim() === '') throw new Error(`Profil : ${chemin} n a pas de source ; une valeur sans provenance bloque le calcul.`);
}

/** Leve en nommant la premiere valeur sans source ou non numerique. */
export function verifierProfil(p: ProfilInterface): void {
  const a = p.ec2004;
  controler('2004 gamma_C', a.gammaC);
  controler('2004 gamma_S', a.gammaS);
  controler('2004 alpha_cc', a.alphaCc);
  const b = p.ec2023;
  controler('2023 gamma_C', b.gammaC);
  controler('2023 gamma_S', b.gammaS);
  controler('2023 k_tc', b.kTc);
  for (const r of RUGOSITES) {
    controler(`2004 c (${r})`, a.c[r]);
    controler(`2004 mu (${r})`, a.mu[r]);
    controler(`2023 c_v1 (${r})`, b.cv1[r]);
    controler(`2023 mu_v (${r})`, b.muV[r]);
    controler(`2023 c_v2 (${r})`, b.cv2[r]);
    controler(`2023 k_v (${r})`, b.kV[r]);
    controler(`2023 k_dowel (${r})`, b.kDowel[r]);
  }
}

const S2004 = 'EN 1992-1-1:2004, valeur recommandee';
const S2023 = 'EN 1992-1-1:2023, valeur recommandee';

function table<T>(source: string, valeurs: Record<Rugosite, number | null>): Record<Rugosite, T> {
  const sortie = {} as Record<Rugosite, T>;
  for (const r of RUGOSITES) {
    const v = valeurs[r];
    sortie[r] = (v === null ? null : { valeur: v, source }) as T;
  }
  return sortie;
}

/**
 * Valeurs recommandees des deux generations.
 *
 * Choix de l'outil, declares : en 2004, « tres lisse » prend c a la borne
 * basse 0,025 de la plage 0,025 a 0,10 ; « tres rugueuse », absente de 2004,
 * y est traitee comme « rugueuse ».
 */
export function ec2Recommande(): ProfilInterface {
  const s2004 = `${S2004}, 6.2.5(2)`;
  const s2023 = `${S2023}, tableau 8.2`;
  return {
    nom: 'EN 1992-1-1, valeurs recommandees (2004 et 2023)',
    date: '2026-10-23',
    ec2004: {
      gammaC: { valeur: 1.5, source: `${S2004}, tableau 2.1N` },
      gammaS: { valeur: 1.15, source: `${S2004}, tableau 2.1N` },
      alphaCc: { valeur: 1.0, source: `${S2004}, 3.1.6(1)` },
      c: table(s2004, { 'tres-lisse': 0.025, lisse: 0.2, rugueuse: 0.4, 'tres-rugueuse': 0.4, 'a-cles': 0.5 }),
      mu: table(s2004, { 'tres-lisse': 0.5, lisse: 0.6, rugueuse: 0.7, 'tres-rugueuse': 0.7, 'a-cles': 0.9 }),
    },
    ec2023: {
      gammaC: { valeur: 1.5, source: `${S2023}, tableau 4.3` },
      gammaS: { valeur: 1.15, source: `${S2023}, tableau 4.3` },
      kTc: { valeur: 0.85, source: `${S2023}, 5.1.6` },
      cv1: table(s2023, { 'tres-lisse': 0.01, lisse: 0.08, rugueuse: 0.15, 'tres-rugueuse': 0.19, 'a-cles': 0.37 }),
      muV: table(s2023, { 'tres-lisse': 0.5, lisse: 0.6, rugueuse: 0.7, 'tres-rugueuse': 0.9, 'a-cles': 0.9 }),
      cv2: table(s2023, { 'tres-lisse': 0, lisse: 0, rugueuse: 0.08, 'tres-rugueuse': 0.15, 'a-cles': null }),
      kV: table(s2023, { 'tres-lisse': 0, lisse: 0.5, rugueuse: 0.5, 'tres-rugueuse': 0.5, 'a-cles': null }),
      kDowel: table(s2023, { 'tres-lisse': 1.5, lisse: 1.1, rugueuse: 0.9, 'tres-rugueuse': 0.9, 'a-cles': null }),
    },
  };
}
