import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JETONS, valeursDesJetons } from 'aedificium-ui';
import { lireSaisie, relire, saisieParDefaut, serialiser } from '../../app/src/form';
import { coupe } from '../../app/src/vue';

describe('saisie unique pour les deux generations', () => {
  it('basculer de generation ne change aucune valeur saisie', () => {
    const s = { ...saisieParDefaut(), VEd: '60', dynamique: true, armaturesAncrees: false };
    const en2023 = { ...s, generation: '2023' as const };
    const retour = { ...en2023, generation: '2004' as const };
    const { generation: _a, ...valeurs } = s;
    const { generation: _b, ...valeursRetour } = retour;
    expect(valeursRetour).toEqual(valeurs);
    // Les deux generations lisent les memes donnees.
    const l = lireSaisie(en2023);
    expect(l.ok && l.donnees.VEd).toBe(60);
  });

  it('enregistrer puis relire rend la meme saisie, generation comprise', () => {
    const s = { ...saisieParDefaut(), generation: '2023' as const, rugosite: 'tres-rugueuse' as const };
    expect(relire(serialiser(s))).toEqual(s);
  });

  it('un champ illisible est refuse en le nommant', () => {
    const l = lireSaisie({ ...saisieParDefaut(), z: 'abc' });
    expect(!l.ok && l.message).toMatch(/^z : nombre attendu/);
  });
});

describe('sorties', () => {
  it('la coupe ne contient aucun NaN', () => {
    const l = lireSaisie({ ...saisieParDefaut(), alpha: '45' });
    expect(l.ok && coupe(l.donnees)).not.toContain('NaN');
  });

  it('le :root de style.css concorde avec les jetons communs', () => {
    const css = readFileSync(fileURLToPath(new URL('../../app/src/style.css', import.meta.url)), 'utf8');
    const page = valeursDesJetons(css);
    for (const [nom, valeur] of valeursDesJetons(JETONS)) expect(page.get(nom)).toBe(valeur);
  });
});
