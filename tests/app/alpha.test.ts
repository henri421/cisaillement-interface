// alpha_cc et alpha_ct modifiables (audit du 10/11/2026, U1).
import { describe, expect, it } from 'vitest';
import { ec2Recommande, verifierInterface } from '../../src/index';
import { lireSaisie, profilSaisi, saisieParDefaut } from '../../app/src/form';

const calcul = (alphaCc: string, alphaCt: string) => {
  const l = lireSaisie({ ...saisieParDefaut(), alphaCc, alphaCt });
  if (!l.ok) throw new Error(l.message);
  const r = verifierInterface(l.donnees, '2004', profilSaisi(ec2Recommande(), l));
  const v = (s: string) => r.verifications[0].intermediaires.find((x) => x.symbole === s);
  return { v };
};

describe('alpha_cc et alpha_ct (3.1.6)', () => {
  it('valeurs recommandees par defaut, avec leur source', () => {
    const { v } = calcul('1,0', '1,0');
    expect(v('alpha_cc')?.valeur).toBe(1);
    expect(v('alpha_cc')?.libelle).toContain('3.1.6(1)');
    expect(v('alpha_ct')?.libelle).toContain('3.1.6(2)');
  });

  it('valeurs saisies : f_cd et f_ctd proportionnels, marquees imposees', () => {
    const ref = calcul('1,0', '1,0');
    const mod = calcul('0,85', '0,8');
    expect(mod.v('f_cd')!.valeur / ref.v('f_cd')!.valeur).toBeCloseTo(0.85, 10);
    expect(mod.v('f_ctd')!.valeur / ref.v('f_ctd')!.valeur).toBeCloseTo(0.8, 10);
    expect(mod.v('alpha_cc')?.libelle).toMatch(/imposée par l'utilisateur.*1.*3\.1\.6\(1\)/);
  });

  it('saisie illisible refusee en nommant le champ', () => {
    const l = lireSaisie({ ...saisieParDefaut(), alphaCc: 'abc' });
    expect(l.ok).toBe(false);
    if (!l.ok) expect(l.message).toContain('alpha_cc');
  });
});
