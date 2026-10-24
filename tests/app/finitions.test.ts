/**
 * Tests d'acceptation de l'etape 8.2 (finitions) : notations, arrondis,
 * accents, titre, phrases types, sur le texte VISIBLE (ecran, coupe, note,
 * CSV, page). Le controle lui-meme vit dans aedificium-ui (`constatsAffichage`).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NOMS_GRECS, notationHtml, blocsEnTexte, constatsAffichage, contenuBalise, resultatsEnCsv, texteVisible } from 'aedificium-ui';
import { LIBELLES_RUGOSITE, RUGOSITES, ec2Recommande, verifierInterface } from '../../src/index';
import { lireSaisie, saisieParDefaut, type Saisie } from '../../app/src/form';
import { blocEntrees, blocsResultat, coupe, tableauVerification, verdictHtml } from '../../app/src/vue';
import { noteDeCalculHtml } from '../../app/src/export';

const P = ec2Recommande();
const TITRE = "Cisaillement à l'interface";
const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');
const controler = (nom: string, html: string): string[] => constatsAffichage(texteVisible(html)).map((c) => `${nom} : ${c}`);

function messageDe(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('une erreur etait attendue');
}

const SAISIES: Saisie[] = [
  saisieParDefaut(),
  { ...saisieParDefaut(), dynamique: true },
  { ...saisieParDefaut(), armaturesAncrees: false, Asi: '500' } as Saisie,
  { ...saisieParDefaut(), alpha: '45' },
  ...RUGOSITES.map((rugosite) => ({ ...saisieParDefaut(), rugosite })),
];

function sorties() {
  const ecran: string[] = [];
  const notes: string[] = [];
  const csv: string[] = [];
  for (const s of SAISIES) {
    const l = lireSaisie(s);
    if (!l.ok) throw new Error(l.message);
    for (const g of ['2004', '2023'] as const) {
      const r = verifierInterface(l.donnees, g, P);
      const entrees = blocEntrees(l.donnees, g);
      ecran.push(coupe(l.donnees), verdictHtml(r), ...r.verifications.map(tableauVerification));
      notes.push(noteDeCalculHtml(l.donnees, r, entrees, coupe(l.donnees), '2026-10-24'));
      csv.push(resultatsEnCsv(blocsEnTexte([entrees, ...blocsResultat(r)])));
    }
  }
  return { ecran, notes, csv };
}

describe('texte visible : notations, arrondis, accents, phrases types', () => {
  const s = sorties();

  it('ecran et coupe', () => {
    expect(s.ecran.flatMap((h, i) => controler(`ecran ${i}`, h))).toEqual([]);
  });

  it('note de calcul', () => {
    expect(s.notes.flatMap((h, i) => controler(`note ${i}`, h))).toEqual([]);
  });

  it('page (index.html)', () => {
    expect(controler('page', lire('../../app/index.html'))).toEqual([]);
  });

  it('libelles des rugosites (liste deroulante)', () => {
    expect(RUGOSITES.flatMap((r) => constatsAffichage(texteVisible(notationHtml(LIBELLES_RUGOSITE[r]))))).toEqual([]);
  });

  it('messages d erreur affiches (rendus par notationHtml, comme a l ecran)', () => {
    const messages = [
      messageDe(() => verifierInterface({ ...lireOk(), beta: 1.2 }, '2004', P)),
      messageDe(() => verifierInterface({ ...lireOk(), VEd: 0 }, '2004', P)),
    ];
    const lecture = lireSaisie({ ...saisieParDefaut(), z: 'abc' });
    if (!lecture.ok) messages.push(lecture.message);
    expect(messages.flatMap((m) => constatsAffichage(texteVisible(notationHtml(m))))).toEqual([]);
  });

  it('CSV : texte brut, ni « _ » ni nom de lettre grecque ni balise', () => {
    for (const c of s.csv) {
      expect(c).not.toContain('_');
      expect(c).not.toMatch(NOMS_GRECS);
      expect(c).not.toContain('<');
    }
  });
});

function lireOk() {
  const l = lireSaisie(saisieParDefaut());
  if (!l.ok) throw new Error(l.message);
  return l.donnees;
}

describe('titre', () => {
  const page = lire('../../app/index.html');

  it('titre de la page sans tiret, majuscule initiale', () => {
    expect(contenuBalise(page, 'h1')).toBe(TITRE);
    expect(contenuBalise(page, 'title')?.startsWith(TITRE)).toBe(true);
  });

  it('titre en grand', () => {
    const regle = /(^|\n)h1\s*\{([^}]*)\}/.exec(lire('../../app/src/style.css'))?.[2] ?? '';
    expect(regle).toMatch(/font-size:\s*1\.75rem/);
    expect(regle).toMatch(/font-weight:\s*600/);
  });
});

describe('main.ts', () => {
  it('le CSV passe par blocsEnTexte', () => {
    expect(lire('../../app/src/main.ts')).toContain('blocsEnTexte(');
  });
});
