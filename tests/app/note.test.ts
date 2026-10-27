/**
 * Tests d'acceptation du lot 8.7 : la note de calcul passe sur la note
 * commune d'aedificium-ui (cartouche, sections dans l'ordre fixe, figure
 * dans la section qu'elle illustre, conclusions sans verdict global).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { noteDeCalculHtml, texteVisible, type ElementNote } from 'aedificium-ui';
import { ec2Recommande, verifierInterface, type Generation } from '../../src/index';
import { lireSaisie, saisieParDefaut, type Saisie } from '../../app/src/form';
import { blocEntrees, coupe } from '../../app/src/vue';
import { HYPOTHESES, noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';

const P = ec2Recommande();
const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');
const CARTOUCHE = { projet: 'Plancher mixte', element: 'Dalle D1', date: '2026-10-27' };

function calculer(s: Saisie, g: Generation) {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  const r = verifierInterface(l.donnees, g, P);
  return { d: l.donnees, r, note: noteDuCalcul(l.donnees, r, CARTOUCHE) };
}

const titresDeBlocs = (els: ElementNote[] | undefined): string[] =>
  (els ?? []).flatMap((e) => (e.type === 'bloc' ? [e.bloc.titre] : []));
const symboles = (els: ElementNote[] | undefined): string[] =>
  (els ?? []).flatMap((e) => (e.type === 'bloc' ? e.bloc.lignes.map((l) => l.symbole) : []));

const GENERATIONS = ['2004', '2023'] as const;

describe('cartouche', () => {
  it('projet, element et date repris de la saisie', () => {
    const { note } = calculer(saisieParDefaut(), '2004');
    expect(note.cartouche.projet).toBe('Plancher mixte');
    expect(note.cartouche.element).toBe('Dalle D1');
    expect(note.cartouche.date).toBe('2026-10-27');
    expect(note.cartouche.outil).toBe('cisaillement-interface');
  });

  for (const g of GENERATIONS) {
    it(`norme de la generation ${g}`, () => {
      expect(calculer(saisieParDefaut(), g).note.cartouche.norme).toBe(`EN 1992-1-1:${g}`);
    });
  }

  it('element vide : Interface entre betons', () => {
    const l = lireSaisie(saisieParDefaut());
    if (!l.ok) throw new Error(l.message);
    const r = verifierInterface(l.donnees, '2004', P);
    expect(noteDuCalcul(l.donnees, r, { ...CARTOUCHE, element: ' ' }).cartouche.element).toBe('Interface entre bétons');
  });

  it('le texte du cartouche est echappe', () => {
    const { d, r } = calculer(saisieParDefaut(), '2004');
    const h = noteDeCalculHtml(noteDuCalcul(d, r, { ...CARTOUCHE, projet: 'Dalle <test>' }), STYLES_TRACE);
    expect(h).toContain('Dalle &lt;test&gt;');
    expect(h).not.toContain('Dalle <test>');
  });
});

describe('sections', () => {
  for (const g of GENERATIONS) {
    it(`ordre fixe, generation ${g}`, () => {
      const { note } = calculer(saisieParDefaut(), g);
      const html = noteDeCalculHtml(note, STYLES_TRACE);
      const titres = [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((x) => x[1]);
      expect(titres).toEqual([
        '1. Géométrie',
        '2. Matériaux',
        '3. Hypothèses',
        '4. Cas de charges',
        '5. Calculs et vérifications',
        '6. Conclusions',
      ]);
    });

    it(`toutes les lignes d entree rangees une fois, generation ${g}`, () => {
      const { d, note } = calculer(saisieParDefaut(), g);
      const ranges = [
        ...symboles(note.sections.geometrie),
        ...symboles(note.sections.materiaux),
        ...symboles(note.sections.hypotheses),
        ...symboles(note.sections.charges),
      ];
      expect([...ranges].sort()).toEqual(blocEntrees(d, g).lignes.map((l) => l.symbole).sort());
    });
  }

  it('geometrie : interface et armatures, puis la coupe', () => {
    const { d, note } = calculer(saisieParDefaut(), '2004');
    expect(symboles(note.sections.geometrie)).toEqual(['z', 'b_i', 'surface', 'A_si', 'alpha']);
    const fig = (note.sections.geometrie ?? []).filter((e) => e.type === 'figure');
    expect(fig).toHaveLength(1);
    if (fig[0].type === 'figure') expect(fig[0].svg).toBe(coupe(d));
  });

  it('materiaux : f_ck et f_yk', () => {
    expect(symboles(calculer(saisieParDefaut(), '2004').note.sections.materiaux)).toEqual(['f_ck', 'f_yk']);
  });

  it('cas de charges : V_Ed, beta, sigma_n', () => {
    expect(symboles(calculer(saisieParDefaut(), '2004').note.sections.charges)).toEqual(['V_Ed', 'beta', 'sigma_n']);
  });

  it('hypotheses : texte applique, liste des hypotheses, mention des valeurs recommandees', () => {
    const h = calculer(saisieParDefaut(), '2023').note.sections.hypotheses ?? [];
    expect(symboles(h)).toEqual(['génération', 'ancrage']);
    expect(h.flatMap((e) => (e.type === 'liste' ? [e.items] : []))).toEqual([HYPOTHESES]);
    expect(h.some((e) => e.type === 'texte' && e.texte.includes('annexe nationale'))).toBe(true);
  });
});

describe('calculs et conclusions', () => {
  for (const g of GENERATIONS) {
    it(`un bloc par verification, sans bloc Verdict, generation ${g}`, () => {
      const { r, note } = calculer(saisieParDefaut(), g);
      expect(titresDeBlocs(note.sections.calculs)).toEqual(r.verifications.map((v) => v.titre));
    });

    it(`le bloc porte les grandeurs et les clauses, generation ${g}`, () => {
      const { r, note } = calculer(saisieParDefaut(), g);
      const b = (note.sections.calculs ?? [])[0];
      expect(b.type).toBe('bloc');
      if (b.type === 'bloc') {
        expect(b.bloc.lignes.map((l) => l.symbole)).toEqual(r.verifications[0].intermediaires.map((x) => x.symbole));
        expect(b.bloc.note).toContain(r.verifications[0].clauses[0]);
      }
    });

    it(`conclusions : taux du noyau, clause, sans titre de norme, generation ${g}`, () => {
      const { r, note } = calculer(saisieParDefaut(), g);
      const v = r.verifications[0];
      expect(note.verifications).toHaveLength(1);
      expect(note.verifications[0].nom).not.toContain('EN 1992');
      expect(note.verifications[0].clause).toBe(v.clauses[0]);
      expect(note.verifications[0].taux).toBe(v.taux);
      expect(note.verifications[0].ok).toBe(r.verdict === 'conforme');
    });
  }

  it('la comparaison du motif figure dans les calculs', () => {
    const { r, note } = calculer(saisieParDefaut(), '2004');
    expect((note.sections.calculs ?? []).some((e) => e.type === 'texte' && e.texte === r.motif)).toBe(true);
  });

  it('aucun verdict global', () => {
    const { note } = calculer(saisieParDefaut(), '2004');
    const texte = texteVisible(noteDeCalculHtml(note, STYLES_TRACE));
    expect(texte).not.toContain('Conforme');
    expect(texte).not.toContain('Non conforme');
    expect(texte).toContain('Vérification déterminante');
  });

  it('non conforme : non satisfaite', () => {
    const { r, note } = calculer({ ...saisieParDefaut(), VEd: '5000' }, '2004');
    expect(r.verdict).toBe('non-conforme');
    expect(note.verifications[0].ok).toBe(false);
    expect(note.verifications[0].taux).toBeGreaterThan(1);
  });

  it('non applicable : hors domaine, non satisfaite, motif dans le bloc', () => {
    const { r, note } = calculer({ ...saisieParDefaut(), alpha: '30' }, '2004');
    expect(r.verdict).toBe('non-applicable');
    expect(Number.isNaN(note.verifications[0].taux)).toBe(true);
    expect(note.verifications[0].ok).toBe(false);
    const b = (note.sections.calculs ?? [])[0];
    if (b.type === 'bloc') expect(b.bloc.note).toBe(r.motif);
    expect(texteVisible(noteDeCalculHtml(note, STYLES_TRACE))).toContain('hors domaine');
  });

  it('avertissements du noyau repris', () => {
    const { r, note } = calculer({ ...saisieParDefaut(), rugosite: 'tres-rugueuse' }, '2004');
    expect(r.avertissements.length).toBeGreaterThan(0);
    expect(note.avertissements).toEqual(r.avertissements);
  });
});

describe('cablage', () => {
  const main = lire('../../app/src/main.ts');
  const page = lire('../../app/index.html');
  const sorties = page.slice(page.indexOf('id="sorties"'), page.indexOf('</section>', page.indexOf('id="sorties"')));

  it('la note passe par noteDuCalcul et la note commune', () => {
    expect(main).toContain('noteDuCalcul(');
    expect(main).toMatch(/import \{[^}]*\bnoteDeCalculHtml\b[^}]*\} from 'aedificium-ui'/);
    expect(main).not.toMatch(/import \{[^}]*\bnoteDeCalculHtml\b[^}]*\} from '\.\/export'/);
  });

  it('champs projet et element dans les sorties, memorises', () => {
    expect(sorties).toContain('data-role="projet"');
    expect(sorties).toContain('data-role="element"');
    expect(main).toContain("'cisaillement-interface:cartouche'");
  });

  it('l ancienne note locale a disparu', () => {
    const exp = lire('../../app/src/export.ts');
    expect(exp).not.toContain('function noteDeCalculHtml');
    expect(exp).not.toContain('HYPOTHESES');
    expect(exp).toContain('export const STYLES_TRACE');
  });
});
