/**
 * Version anglaise (lot 8.8) : page `en/index.html` de meme squelette que la
 * page francaise, et AUCUN reste de francais dans ce qui s'affiche en anglais
 * (ecran, coupe, note, CSV, messages). Le francais, lui, est couvert par
 * `finitions.test.ts`, inchange.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blocsEnTexte, constatsAffichage, contenuBalise, definirLangue, noteDeCalculHtml, notationHtml, resultatsEnCsv, texteVisible } from 'aedificium-ui';
import { RUGOSITES, ec2Recommande, verifierInterface } from '../../src/index';
import { lireSaisie, relire, saisieParDefaut, type Saisie } from '../../app/src/form';
import { blocEntrees, blocsResultat, coupe, messageDErreur, tableauVerification, verdictHtml } from '../../app/src/vue';
import { STYLES_TRACE } from '../../app/src/export';
import { noteDuCalcul } from '../../app/src/note';
import { textes } from '../../app/src/textes';

const P = ec2Recommande();
const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');
const controler = (nom: string, html: string): string[] => constatsAffichage(texteVisible(html), { langue: 'en' }).map((c) => `${nom} : ${c}`);

/** Squelette d'une page : les attributs que lit le script, dans l'ordre. */
function squelette(html: string): string[] {
  return [...html.matchAll(/\s(id|data-[a-z-]+|type|inputmode|accept)="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
}

const SAISIES: Saisie[] = [
  saisieParDefaut(),
  { ...saisieParDefaut(), dynamique: true },
  { ...saisieParDefaut(), armaturesAncrees: false, Asi: '500' },
  { ...saisieParDefaut(), Asi: '0' },
  { ...saisieParDefaut(), alpha: '30' },
  { ...saisieParDefaut(), sigmaN: '-0,5' },
  { ...saisieParDefaut(), sigmaN: '20' },
  { ...saisieParDefaut(), VEd: '400' },
  ...RUGOSITES.map((rugosite) => ({ ...saisieParDefaut(), rugosite })),
  ...RUGOSITES.map((rugosite) => ({ ...saisieParDefaut(), rugosite, armaturesAncrees: false })),
];

function erreur(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return messageDErreur(e);
  }
  throw new Error('une erreur etait attendue');
}

describe('page anglaise', () => {
  const fr = lire('../../app/index.html');
  const en = lire('../../app/en/index.html');

  it('meme squelette que la page francaise', () => {
    expect(squelette(en)).toEqual(squelette(fr));
  });

  it('langue, script commun, liens entre les deux versions', () => {
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('src="../src/main.ts"');
    expect(en).toMatch(/class="barre-langue" href="\.\.\/"/);
    expect(fr).toMatch(/class="barre-langue" href="en\/"/);
  });

  it('titre anglais, aucun reste de francais', () => {
    expect(contenuBalise(en, 'h1')).toBe('Shear at the interface');
    expect(controler('page', en.replace(/lang="fr"[^>]*>FR</, '>'))).toEqual([]);
  });
});

describe('affichage en anglais', () => {
  beforeEach(() => definirLangue('en'));
  afterEach(() => definirLangue('fr'));

  it('ecran, coupe, note et CSV', () => {
    const constats: string[] = [];
    SAISIES.forEach((s, i) => {
      const l = lireSaisie(s);
      if (!l.ok) throw new Error(l.message);
      for (const g of ['2004', '2023'] as const) {
        const r = verifierInterface(l.donnees, g, P);
        const nom = `cas ${i} ${g}`;
        constats.push(...controler(`${nom} ecran`, [coupe(l.donnees), verdictHtml(r), ...r.verifications.map(tableauVerification)].join('')));
        constats.push(...controler(`${nom} note`, noteDeCalculHtml(noteDuCalcul(l.donnees, r, { projet: 'Floor', element: '', date: '2026-10-29' }), STYLES_TRACE)));
        const csv = resultatsEnCsv(blocsEnTexte([blocEntrees(l.donnees, g), ...blocsResultat(r)]));
        constats.push(...constatsAffichage(csv, { langue: 'en' }).map((c) => `${nom} csv : ${c}`));
      }
    });
    expect(constats).toEqual([]);
  });

  it('nombres a point decimal, CSV a virgule', () => {
    const l = lireSaisie({ ...saisieParDefaut(), sigmaN: '0,5' });
    if (!l.ok) throw new Error(l.message);
    const r = verifierInterface(l.donnees, '2004', P);
    expect(texteVisible(verdictHtml(r))).toMatch(/v_?Edi = \d+\.\d+ MPa/);
    expect(resultatsEnCsv(blocsEnTexte(blocsResultat(r)))).toContain('Block,Symbol,Quantity,Value');
  });

  it('liste des surfaces, messages et erreurs', () => {
    const d = (() => {
      const l = lireSaisie(saisieParDefaut());
      if (!l.ok) throw new Error(l.message);
      return l.donnees;
    })();
    const lecture = lireSaisie({ ...saisieParDefaut(), z: 'abc' });
    const messages = [
      ...RUGOSITES.map((r) => textes().rugosites[r]),
      lecture.ok ? '' : lecture.message,
      erreur(() => relire('{"format":"autre"}')),
      erreur(() => verifierInterface({ ...d, beta: 1.2 }, '2004', P)),
      erreur(() => verifierInterface({ ...d, VEd: 0 }, '2004', P)),
      erreur(() => verifierInterface({ ...d, Asi: -1 }, '2004', P)),
      erreur(() => verifierInterface({ ...d, alpha: Number.NaN }, '2004', P)),
      textes().messages.rienAExporter,
      textes().messages.nouvelleVersion,
    ];
    expect(messages.flatMap((m, i) => controler(`message ${i}`, notationHtml(m)))).toEqual([]);
  });
});
