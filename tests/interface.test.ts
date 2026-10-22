import { describe, expect, it } from 'vitest';
import { ec2Recommande, verifierInterface, type DonneesInterface, type Generation } from '../src/index';

/**
 * Valeurs attendues calculees a la main (docs/validation/predalle.md), les
 * memes que celles du blog ec2-2e-generation (article « interfaces »).
 */

const P = ec2Recommande();

/** Dalle sur predalle, interface lisse : V_Ed = 45 kN, z = 153 mm, b_i = 1000 mm. */
function predalle(o: Partial<DonneesInterface> = {}): DonneesInterface {
  return {
    VEd: 45,
    beta: 1,
    z: 153,
    bi: 1000,
    rugosite: 'lisse',
    fck: 25,
    fyk: 500,
    Asi: 0,
    alpha: 90,
    sigmaN: 0,
    dynamique: false,
    armaturesAncrees: true,
    ...o,
  };
}

const v = (d: DonneesInterface, g: Generation) => verifierInterface(d, g, P).verifications[0];

describe('interface lisse sans armature', () => {
  it('v_Edi = 45 000 / (153 × 1000) = 0,2941 MPa dans les deux generations', () => {
    expect(v(predalle(), '2004').sollicitation).toBeCloseTo(0.294118, 5);
    expect(v(predalle(), '2023').sollicitation).toBeCloseTo(0.294118, 5);
  });

  it('2004 : c f_ctd = 0,2 × 0,7 × 2,565 / 1,5 = 0,2394 MPa, non conforme', () => {
    const r = verifierInterface(predalle(), '2004', P);
    expect(r.verifications[0].resistance).toBeCloseTo(0.239397, 5);
    expect(r.verdict).toBe('non-conforme');
  });

  it('2023 : c_v1 √f_ck / gamma_C = 0,08 × 5 / 1,5 = 0,2667 MPa, non conforme', () => {
    const r = verifierInterface(predalle(), '2023', P);
    expect(r.verifications[0].id).toBe('2023-ancrees');
    expect(r.verifications[0].resistance).toBeCloseTo(0.266667, 5);
    expect(r.verdict).toBe('non-conforme');
  });
});

describe('interface lisse avec 300 mm2/m d armatures', () => {
  it('2004 : 0,3177 MPa, conforme', () => {
    const r = verifierInterface(predalle({ Asi: 300 }), '2004', P);
    expect(r.verifications[0].resistance).toBeCloseTo(0.317658, 5);
    expect(r.verdict).toBe('conforme');
  });

  it('2023 ancrees : 0,3449 MPa ; ancrage insuffisant : 0,0650 MPa', () => {
    expect(v(predalle({ Asi: 300 }), '2023').resistance).toBeCloseTo(0.344928, 5);
    const ins = v(predalle({ Asi: 300, armaturesAncrees: false }), '2023');
    expect(ins.id).toBe('2023-insuffisant');
    expect(ins.resistance).toBeCloseTo(0.065029, 5);
  });
});

describe('rugosite, charges dynamiques et conditions', () => {
  it('rugueuse : 0,4788 MPa en 2004, 0,5 MPa en 2023', () => {
    expect(v(predalle({ rugosite: 'rugueuse' }), '2004').resistance).toBeCloseTo(0.478793, 5);
    expect(v(predalle({ rugosite: 'rugueuse' }), '2023').resistance).toBeCloseTo(0.5, 9);
  });

  it('2004, charges dynamiques : c divise par deux, 0,2394 / 2 = 0,1197 MPa', () => {
    expect(v(predalle({ dynamique: true }), '2004').resistance).toBeCloseTo(0.119698, 5);
  });

  it('tres rugueuse en 2004 : traitee comme rugueuse, et dit', () => {
    const r = verifierInterface(predalle({ rugosite: 'tres-rugueuse' }), '2004', P);
    expect(r.verifications[0].resistance).toBeCloseTo(0.478793, 5);
    expect(r.avertissements.join(' ')).toMatch(/traitee comme « rugueuse »/);
  });

  it('interface a cles, ancrage insuffisant : (8.77) sans objet', () => {
    const r = verifierInterface(predalle({ rugosite: 'a-cles', Asi: 300, armaturesAncrees: false }), '2023', P);
    expect(r.verdict).toBe('non-applicable');
    expect(r.motif).toMatch(/8\.77/);
  });

  it('angle de 120 degres : permis en 2023, pas en 2004', () => {
    expect(v(predalle({ Asi: 300, alpha: 120 }), '2004').statut.etat).toBe('non-applicable');
    expect(v(predalle({ Asi: 300, alpha: 120 }), '2023').statut.etat).toBe('calcule');
  });

  it('interface tendue : cohesion annulee ; en 2004 mu sigma_n reste compte', () => {
    expect(v(predalle({ sigmaN: -0.1 }), '2004').resistance).toBeCloseTo(-0.06, 9);
    expect(v(predalle({ sigmaN: -0.1 }), '2023').resistance).toBe(0);
  });

  it('taux = sollicitation / resistance', () => {
    const c = v(predalle({ Asi: 300 }), '2004');
    expect(c.taux).toBeCloseTo(0.294118 / 0.317658, 5);
  });
});

describe('controles', () => {
  it('refuse un beta superieur a 1 et un V_Ed nul', () => {
    expect(() => verifierInterface(predalle({ beta: 1.2 }), '2004', P)).toThrow(/beta ne peut pas depasser 1/);
    expect(() => verifierInterface(predalle({ VEd: 0 }), '2004', P)).toThrow(/V_Ed/);
  });

  it('refuse un profil dont une valeur n a pas de source', () => {
    const p = ec2Recommande();
    p.ec2004.c.lisse = { valeur: 0.2, source: ' ' };
    expect(() => verifierInterface(predalle(), '2004', p)).toThrow(/c \(lisse\).*source/);
  });
});
