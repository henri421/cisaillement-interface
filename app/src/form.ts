/**
 * La saisie, en chaines, et sa conversion en donnees du noyau. PUR.
 *
 * UNE SEULE saisie pour les deux generations : basculer de l'une a l'autre ne
 * change que la generation, jamais les valeurs saisies. Une donnee propre a
 * une generation (charges dynamiques en 2004, ancrage des armatures en 2023)
 * est conservee quand l'autre est active, simplement ignoree.
 */

import { lireNombre } from 'aedificium-ui';
import { RUGOSITES, type DonneesInterface, type Generation, type ProfilInterface, type Rugosite, type ValeurSourcee } from '../../src/index';
import { textes } from './textes';

export interface Saisie {
  generation: Generation;
  VEd: string;
  beta: string;
  z: string;
  bi: string;
  rugosite: Rugosite;
  fck: string;
  fyk: string;
  Asi: string;
  alpha: string;
  sigmaN: string;
  dynamique: boolean;
  armaturesAncrees: boolean;
  /** Parametres nationaux de la 1re generation (3.1.6), modifiables (audit U1). */
  alphaCc: string;
  alphaCt: string;
}

export function saisieParDefaut(): Saisie {
  return {
    generation: '2004',
    VEd: '45',
    beta: '1',
    z: '153',
    bi: '1000',
    rugosite: 'lisse',
    fck: '25',
    fyk: '500',
    Asi: '300',
    alpha: '90',
    sigmaN: '0',
    dynamique: false,
    armaturesAncrees: true,
    alphaCc: '1,0',
    alphaCt: '1,0',
  };
}

const LIBELLES: Record<string, string> = {
  VEd: 'V_Ed',
  beta: 'beta',
  z: 'z',
  bi: 'b_i',
  fck: 'f_ck',
  fyk: 'f_yk',
  Asi: 'A_si',
  alpha: 'alpha',
  sigmaN: 'sigma_n',
  alphaCc: 'alpha_cc',
  alphaCt: 'alpha_ct',
};

export type Lecture = { ok: true; donnees: DonneesInterface; alphaCc: number; alphaCt: number } | { ok: false; message: string };

/** Convertit la saisie ; refuse en nommant le premier champ illisible. */
export function lireSaisie(s: Saisie): Lecture {
  const n: Record<string, number> = {};
  for (const champ of Object.keys(LIBELLES)) {
    const brut = String(s[champ as keyof Saisie]);
    const v = lireNombre(brut);
    if (v === null) return { ok: false, message: textes().messages.nombreAttendu(LIBELLES[champ], brut) };
    n[champ] = v;
  }
  if (!RUGOSITES.includes(s.rugosite)) return { ok: false, message: textes().messages.surfaceInconnue };
  return {
    ok: true,
    alphaCc: n.alphaCc,
    alphaCt: n.alphaCt,
    donnees: {
      VEd: n.VEd,
      beta: n.beta,
      z: n.z,
      bi: n.bi,
      rugosite: s.rugosite,
      fck: n.fck,
      fyk: n.fyk,
      Asi: n.Asi,
      alpha: n.alpha,
      sigmaN: n.sigmaN,
      dynamique: s.dynamique,
      armaturesAncrees: s.armaturesAncrees,
    },
  };
}

const FORMAT = 'cisaillement-interface/1';

export function serialiser(s: Saisie): string {
  return JSON.stringify({ format: FORMAT, ...s }, null, 2);
}

/** Relit un document enregistre ; les champs absents prennent leur valeur par defaut. */
export function relire(texte: string): Saisie {
  const brut = JSON.parse(texte) as Record<string, unknown>;
  if (brut.format !== FORMAT) throw new Error(textes().messages.format(JSON.stringify(brut.format), FORMAT));
  const d = saisieParDefaut();
  const texteDe = (cle: keyof Saisie) => (typeof brut[cle] === 'string' ? (brut[cle] as string) : (d[cle] as string));
  return {
    generation: brut.generation === '2023' ? '2023' : '2004',
    VEd: texteDe('VEd'),
    beta: texteDe('beta'),
    z: texteDe('z'),
    bi: texteDe('bi'),
    rugosite: RUGOSITES.includes(brut.rugosite as Rugosite) ? (brut.rugosite as Rugosite) : d.rugosite,
    fck: texteDe('fck'),
    fyk: texteDe('fyk'),
    Asi: texteDe('Asi'),
    alpha: texteDe('alpha'),
    sigmaN: texteDe('sigmaN'),
    dynamique: brut.dynamique === true,
    armaturesAncrees: brut.armaturesAncrees !== false,
    alphaCc: texteDe('alphaCc'),
    alphaCt: texteDe('alphaCt'),
  };
}

/** Profil de calcul avec alpha_cc et alpha_ct saisis ; une valeur changee est marquee imposee. */
export function profilSaisi(p: ProfilInterface, a: { alphaCc: number; alphaCt: number }): ProfilInterface {
  const v = (base: ValeurSourcee, x: number): ValeurSourcee =>
    x === base.valeur ? base : { valeur: x, source: textes().messages.imposee(base.valeur, base.source) };
  return { ...p, ec2004: { ...p.ec2004, alphaCc: v(p.ec2004.alphaCc, a.alphaCc), alphaCt: v(p.ec2004.alphaCt, a.alphaCt) } };
}
