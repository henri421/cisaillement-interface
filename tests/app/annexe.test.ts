// Lot E (audit R4) : annexe luxembourgeoise preremplie, alpha_cc et alpha_ct modifiables.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { noteDeCalculHtml, texteVisible } from 'aedificium-ui';
import { ec2Recommande, verifierInterface } from '../../src/index';
import { profilDeLAnnexe } from '../../app/src/annexe';
import { lireSaisie, profilSaisi, relire, saisieParDefaut, serialiser } from '../../app/src/form';
import { noteDuCalcul } from '../../app/src/note';

const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');

describe('annexe luxembourgeoise', () => {
  it('alpha_cc = 0,85 en 1re generation, source AN-LU ; 2e generation inchangee', () => {
    const lu = profilDeLAnnexe('lu');
    expect(lu.ec2004.alphaCc.valeur).toBe(0.85);
    expect(lu.ec2004.alphaCc.source).toMatch(/^ILNAS-EN 1992-1-1\/AN-LU:2020, 3\.1\.6\(1\)P/);
    expect(lu.ec2004.alphaCt.valeur).toBe(1);
    expect(lu.ec2023).toEqual(ec2Recommande().ec2023);
    expect(profilDeLAnnexe('recommande')).toEqual(ec2Recommande());
  });

  it('saisie : annexe par defaut recommandee, enregistree et relue ; ancien fichier sans annexe accepte', () => {
    expect(saisieParDefaut().annexe).toBe('recommande');
    expect(relire(serialiser({ ...saisieParDefaut(), annexe: 'lu' })).annexe).toBe('lu');
    const ancien = JSON.parse(serialiser(saisieParDefaut())) as Record<string, unknown>;
    delete ancien['annexe'];
    expect(relire(JSON.stringify(ancien)).annexe).toBe('recommande');
  });

  it('note : annexe retenue, sources, avertissement en 1re generation seulement', () => {
    const s = { ...saisieParDefaut(), annexe: 'lu' as const, alphaCc: '0,85' };
    const l = lireSaisie(s);
    if (!l.ok) throw new Error(l.message);
    const profil = profilSaisi(profilDeLAnnexe('lu'), l);
    const r = verifierInterface(l.donnees, '2004', profil);
    const note = noteDuCalcul(l.donnees, r, { projet: 'P', element: 'E', date: '2026-11-17' }, 'lu', profil);
    expect(note.avertissements?.[0]).toMatch(/^Annexe nationale luxembourgeoise/);
    const texte = texteVisible(noteDeCalculHtml(note, ''));
    expect(texte).toContain('Luxembourg (AN-LU:2020');
    expect(texte).toContain('ILNAS-EN 1992-1-1/AN-LU:2020, 3.1.6(1)P');
    const r23 = verifierInterface(l.donnees, '2023', profil);
    const n23 = noteDuCalcul(l.donnees, r23, { projet: 'P', element: 'E', date: '2026-11-17' }, 'lu', profil);
    expect((n23.avertissements ?? []).some((a) => /luxembourgeoise/.test(a))).toBe(false);
  });

  it('pages : selecteur d annexe dans les deux langues', () => {
    for (const p of ['../../app/index.html', '../../app/en/index.html']) {
      expect(lire(p)).toContain('<select data-champ="annexe" data-role="annexe"></select>');
    }
  });
});
