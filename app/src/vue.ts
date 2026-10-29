/**
 * Mise en forme : verdict, tableaux, coupe schematique. PUR.
 *
 * L'ecran et la note de calcul appellent ces memes fonctions. Les textes
 * viennent de `textes.ts`, dans la langue de la page.
 */

import { notationHtml, notationSvg, nombreAffiche, tauxAffiche, type BlocResultat } from 'aedificium-ui';
import type { DonneesInterface, ResultatInterface, Verification } from '../../src/index';
import { phrase, textes } from './textes';

/** Nombre affiche : trois decimales au plus, sans zeros inutiles. */
const aff = (v: number, d: number): string => nombreAffiche(v, Math.min(d, 3));

/** Message d'une erreur du noyau ou de la lecture, dans la langue de la page. */
export function messageDErreur(e: unknown): string {
  return phrase(e instanceof Error ? e.message : String(e));
}

/** Valeur et unite d'une grandeur intermediaire. */
function valeurDe(g: Verification['intermediaires'][number]): string {
  return `${aff(g.valeur, g.unite === '-' ? 5 : 3)}${g.unite === '-' ? '' : ` ${g.unite}`}`;
}

/** Verdict, motif et jauge du taux. */
export function verdictHtml(r: ResultatInterface): string {
  const t = textes();
  const v = r.verifications[0];
  const taux = v.taux;
  const jauge =
    taux === undefined
      ? ''
      : `<div class="jauge${taux > 1 ? ' depasse' : ''}"><div style="width:${(Math.min(taux, 1) * 100).toFixed(1)}%"></div></div>` +
        `<p class="taux">${t.taux} ${tauxAffiche(taux)}</p>`;
  return (
    `<p class="verdict verdict-${r.verdict}">${t.verdicts[r.verdict]}</p>${jauge}<p class="motif">${notationHtml(phrase(r.motif))}</p>` +
    r.avertissements.map((a) => `<p class="alerte">${notationHtml(phrase(a))}</p>`).join('')
  );
}

/** Les grandeurs du calcul, en tableau. */
export function tableauVerification(v: Verification): string {
  const entete = `<h3>${notationHtml(phrase(v.titre))}</h3><p class="clause">${notationHtml(v.clauses.map(phrase).join(' · '))}</p>`;
  if (v.statut.etat === 'non-applicable') return `${entete}<p class="motif">${notationHtml(phrase(v.statut.motif))}</p>`;
  const lignes = v.intermediaires
    .map(
      (g) =>
        `<tr><th>${notationHtml(phrase(g.symbole))}</th><td class="libelle">${notationHtml(phrase(g.libelle))}</td>` +
        `<td class="valeur">${valeurDe(g)}</td></tr>`
    )
    .join('');
  return `${entete}<table class="grandeurs"><tbody>${lignes}</tbody></table>`;
}

/** Bloc des donnees d'entree, pour la note et le CSV. */
export function blocEntrees(d: DonneesInterface, generation: '2004' | '2023'): BlocResultat {
  const t = textes();
  const e = t.entrees;
  const l = (symbole: string, libelle: string, valeur: string) => ({ symbole, libelle, valeur });
  return {
    titre: e.titre,
    lignes: [
      l(e.generation[0], e.generation[1], t.generations[generation]),
      l('V_Ed', e.VEd, `${aff(d.VEd, 1)} kN`),
      l('beta', e.beta, aff(d.beta, 3)),
      l('z', e.z, `${aff(d.z, 0)} mm`),
      l('b_i', e.bi, `${aff(d.bi, 0)} mm`),
      l(e.surface[0], e.surface[1], t.rugosites[d.rugosite]),
      l('f_ck', e.fck, `${aff(d.fck, 0)} MPa`),
      l('f_yk', e.fyk, `${aff(d.fyk, 0)} MPa`),
      l('A_si', e.Asi, `${aff(d.Asi, 0)} mm2/m`),
      l('alpha', e.alpha, `${aff(d.alpha, 0)} ${t.degres}`),
      l('sigma_n', e.sigmaN, `${aff(d.sigmaN, 2)} MPa`),
      ...(generation === '2004'
        ? [l(e.charges[0], e.charges[1], d.dynamique ? t.oui : t.non)]
        : [l(e.ancrage[0], e.ancrage[1], d.Asi === 0 ? e.sansObjet : d.armaturesAncrees ? t.oui : t.non)]),
    ],
    note: null,
  };
}

/** Blocs des resultats, pour le CSV : les memes grandeurs que le tableau a l'ecran. */
export function blocsResultat(r: ResultatInterface): BlocResultat[] {
  const t = textes();
  return [
    ...r.verifications.map((v) => ({
      titre: phrase(v.titre),
      lignes: v.intermediaires.map((g) => ({ symbole: phrase(g.symbole), libelle: phrase(g.libelle), valeur: valeurDe(g) })),
      note: v.statut.etat === 'non-applicable' ? phrase(v.statut.motif) : null,
    })),
    {
      titre: t.verdict.titre,
      lignes: [
        { symbole: t.verdict.constat[0], libelle: t.verdict.constat[1], valeur: t.verdicts[r.verdict] },
        ...(r.verifications[0].taux === undefined
          ? []
          : [{ symbole: t.verdict.taux[0], libelle: t.verdict.taux[1], valeur: tauxAffiche(r.verifications[0].taux) }]),
      ],
      note: [r.motif, ...r.avertissements].map(phrase).join(' '),
    },
  ];
}

/**
 * Coupe schematique (pas a l'echelle) : beton de reprise sur le beton en
 * place, interface en tirets, armature de couture inclinee de alpha, effort
 * de glissement.
 */
export function coupe(d: DonneesInterface): string {
  const t = textes();
  const L = 360;
  const x0 = 40;
  const yHaut = 40;
  const yInterface = 110;
  const yBas = 170;
  const a = (Math.min(Math.max(d.alpha, 10), 170) * Math.PI) / 180;
  const longueur = 80;
  const barres =
    d.Asi > 0
      ? [120, 200, 280]
          .map((x) => {
            const dx = (Math.cos(a) * longueur) / 2;
            const dy = (Math.sin(a) * longueur) / 2;
            return `<line class="barre" x1="${(x + dx).toFixed(1)}" y1="${(yInterface - dy).toFixed(1)}" x2="${(x - dx).toFixed(1)}" y2="${(yInterface + dy).toFixed(1)}" />`;
          })
          .join('')
      : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 220" role="img" aria-label="${t.coupe.aria}">
<rect class="reprise" x="${x0}" y="${yHaut}" width="${L}" height="${yInterface - yHaut}" />
<rect class="en-place" x="${x0}" y="${yInterface}" width="${L}" height="${yBas - yInterface}" />
<line class="interface" x1="${x0}" y1="${yInterface}" x2="${x0 + L}" y2="${yInterface}" />
${barres}
<line class="effort" x1="${x0 + 70}" y1="${yInterface - 14}" x2="${x0 + 190}" y2="${yInterface - 14}" />
<path class="pointe" d="M ${x0 + 190} ${yInterface - 19} L ${x0 + 202} ${yInterface - 14} L ${x0 + 190} ${yInterface - 9} Z" />
<text class="etiquette" x="${x0 + 6}" y="${yHaut + 16}">${notationSvg(t.coupe.reprise)}</text>
<text class="etiquette" x="${x0 + 6}" y="${yBas - 8}">${notationSvg(t.coupe.enPlace)}</text>
<text class="etiquette" x="${x0 + L - 6}" y="${yInterface - 6}" text-anchor="end">${notationSvg(`${t.coupe.interface}, ${t.rugosites[d.rugosite]}`)}</text>
<text class="etiquette" x="${x0 + 70}" y="${yInterface - 22}">${notationSvg('v_Edi = beta V_Ed / (z b_i)')}</text>
<text class="etiquette" x="${x0 + L}" y="${yBas + 20}" text-anchor="end">${notationSvg(d.Asi > 0 ? `A_si = ${aff(d.Asi, 0)} mm2/m, alpha = ${aff(d.alpha, 0)}°` : t.coupe.sansArmature)}</text>
</svg>`;
}
