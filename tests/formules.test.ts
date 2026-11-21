/**
 * Classeur Excel a formules (fiche 11.3, T3, pilote) : le classeur dit la
 * meme chose que le noyau, dans les deux generations et sur tous les chemins
 * (cohesion annulee en traction, charges dynamiques, ancrage insuffisant,
 * non conforme), et respecte le gabarit commun.
 */

import { describe, expect, it } from 'vitest';
import { classeurDeCalcul, ecartsDeConcordance, verifierGabaritXlsx, type CartoucheXlsx } from 'aedificium-ui';
import { classeurInterface, ec2Recommande, verifierInterface, type DonneesInterface, type Generation } from '../src/index';

const P = ec2Recommande();
const CARTOUCHE: CartoucheXlsx = {
  titre: 'Cisaillement le long d’une reprise de bétonnage',
  projet: 'Essai',
  element: 'Dalle D1',
  outil: 'cisaillement-interface',
  version: '0.3.0 (test)',
  norme: 'EN 1992-1-1',
  date: '2026-11-20',
};

function donnees(o: Partial<DonneesInterface> = {}): DonneesInterface {
  return {
    VEd: 300, beta: 1, z: 400, bi: 300, rugosite: 'rugueuse', fck: 30, fyk: 500, Asi: 2000, alpha: 90,
    sigmaN: 0, dynamique: false, armaturesAncrees: true, ...o,
  };
}

const CAS: Array<[string, Partial<DonneesInterface>, Generation]> = [
  ['2004 rugueuse, conforme', {}, '2004'],
  ['2004 non conforme', { Asi: 500 }, '2004'],
  ['2004 lisse, sans armatures, compression', { rugosite: 'lisse', Asi: 0, sigmaN: 0.5 }, '2004'],
  ['2004 traction : cohesion annulee', { sigmaN: -0.4 }, '2004'],
  ['2004 charges dynamiques', { dynamique: true }, '2004'],
  ['2004 armatures inclinees, beton C60', { alpha: 60, fck: 60 }, '2004'],
  ['2004 plafond 0,5 nu f_cd atteint', { Asi: 20000, rugosite: 'a-cles' }, '2004'],
  ['2023 ancrees', {}, '2023'],
  ['2023 ancrees, traction', { sigmaN: -0.3 }, '2023'],
  ['2023 ancrees, armatures inclinees a 120 degres', { alpha: 120, rugosite: 'tres-rugueuse' }, '2023'],
  ['2023 ancrage insuffisant', { armaturesAncrees: false }, '2023'],
  ['2023 ancrage insuffisant, tres lisse, compression', { armaturesAncrees: false, rugosite: 'tres-lisse', sigmaN: 1 }, '2023'],
  ['2023 beton C20 (eta_cc plafonne a 1)', { fck: 20 }, '2023'],
  ['2023 sans armatures', { Asi: 0, armaturesAncrees: false }, '2023'],
];

describe('concordance du classeur avec le noyau', () => {
  for (const [nom, o, g] of CAS) {
    it(nom, () => {
      const d = donnees(o);
      const r = verifierInterface(d, g, P);
      expect(r.verdict).not.toBe('non-applicable');
      const c = classeurInterface(d, r, P, CARTOUCHE);
      expect(ecartsDeConcordance(c)).toEqual([]);
      // la verification principale reprend la sollicitation et la resistance du noyau
      const v = r.verifications[0];
      expect(c.verifications[0].valeurSollicitation).toBe(v.sollicitation);
      expect(c.verifications[0].valeurResistance).toBe(v.resistance);
      expect(verifierGabaritXlsx(classeurDeCalcul(c))).toEqual([]);
    });
  }
});

describe('contenu', () => {
  it('2004 : saisies et coefficients du profil en donnees, formules nommees', () => {
    const d = donnees();
    const c = classeurInterface(d, verifierInterface(d, '2004', P), P, CARTOUCHE);
    const noms = c.donnees.flatMap((g) => g.lignes.map((l) => l.nom));
    for (const n of ['z', 'b_i', 'f_ck', 'f_yk', 'gamma_C', 'gamma_S', 'alpha_cc', 'alpha_ct', 'v_c', 'mu', 'A_si', 'alpha', 'V_Ed', 'beta', 'sigma_n']) expect(noms).toContain(n);
    const calcul = c.calcul.flatMap((g) => g.lignes.map((l) => l.nom));
    expect(calcul[0]).toBe('v_Edi');
    expect(calcul.at(-1)).toBe('v_Rdi');
    expect(c.verifications.map((v) => v.sollicitation)).toEqual(['v_Edi', 'sigma_n']);
  });
  it('2023 ancrage insuffisant : c_v2, k_v, k_dowel et terme de goujon', () => {
    const d = donnees({ armaturesAncrees: false });
    const c = classeurInterface(d, verifierInterface(d, '2023', P), P, CARTOUCHE);
    const noms = [...c.donnees, ...c.calcul].flatMap((g) => g.lignes.map((l) => l.nom));
    for (const n of ['c_v2', 'mu_v', 'k_v', 'k_dowel', 'k_tc', 't_goujon', 'tau_Edi', 'tau_Rdi']) expect(noms).toContain(n);
    expect(noms).not.toContain('c_v1');
  });
  it('les sources des coefficients sont courtes (clause seule)', () => {
    const d = donnees();
    const c = classeurInterface(d, verifierInterface(d, '2004', P), P, CARTOUCHE);
    const gammaC = c.donnees.flatMap((g) => g.lignes).find((l) => l.nom === 'gamma_C');
    expect(gammaC?.source).toBe('tableau 2.1N');
  });
  it('hors domaine (non applicable) : donnees seules, ni calcul ni verification', () => {
    const d = donnees({ alpha: 30 });
    const r = verifierInterface(d, '2004', P);
    expect(r.verdict).toBe('non-applicable');
    const c = classeurInterface(d, r, P, CARTOUCHE);
    expect(c.calcul).toEqual([]);
    expect(c.verifications).toEqual([]);
    expect(verifierGabaritXlsx(classeurDeCalcul(c))).toEqual([]);
  });
});
