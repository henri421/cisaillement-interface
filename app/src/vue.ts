/**
 * Mise en forme : verdict, tableaux, coupe schematique. PUR.
 *
 * L'ecran et la note de calcul appellent ces memes fonctions.
 */

import { notationHtml, notationSvg, nombreFr, tauxFr, type BlocResultat } from 'aedificium-ui';
import { LIBELLES_RUGOSITE, type DonneesInterface, type ResultatInterface, type Verification } from '../../src/index';

const TITRES = { conforme: 'Conforme', 'non-conforme': 'Non conforme', 'non-applicable': 'Non applicable' } as const;

export const NOM_GENERATION = {
  '2004': '1re generation — EN 1992-1-1:2004, 6.2.5',
  '2023': '2e generation — EN 1992-1-1:2023, 8.2.6',
} as const;

export function messageDErreur(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Verdict, motif et jauge du taux. */
export function verdictHtml(r: ResultatInterface): string {
  const v = r.verifications[0];
  const taux = v.taux;
  const jauge =
    taux === undefined
      ? ''
      : `<div class="jauge${taux > 1 ? ' depasse' : ''}"><div style="width:${(Math.min(taux, 1) * 100).toFixed(1)}%"></div></div>` +
        `<p class="taux">Taux ${tauxFr(taux, 2)}</p>`;
  return (
    `<p class="verdict verdict-${r.verdict}">${TITRES[r.verdict]}</p>${jauge}<p class="motif">${notationHtml(r.motif)}</p>` +
    r.avertissements.map((a) => `<p class="alerte">${notationHtml(a)}</p>`).join('')
  );
}

/** Les grandeurs du calcul, en tableau. */
export function tableauVerification(v: Verification): string {
  const entete = `<h3>${notationHtml(v.titre)}</h3><p class="clause">${notationHtml(v.clauses.join(' · '))}</p>`;
  if (v.statut.etat === 'non-applicable') return `${entete}<p class="motif">${notationHtml(v.statut.motif)}</p>`;
  const lignes = v.intermediaires
    .map(
      (g) =>
        `<tr><th>${notationHtml(g.symbole)}</th><td class="libelle">${notationHtml(g.libelle)}</td>` +
        `<td class="valeur">${nombreFr(g.valeur, g.unite === '-' ? 5 : 3)}${g.unite === '-' ? '' : ` ${g.unite}`}</td></tr>`
    )
    .join('');
  return `${entete}<table class="grandeurs"><tbody>${lignes}</tbody></table>`;
}

/** Bloc des donnees d'entree, pour la note et le CSV. */
export function blocEntrees(d: DonneesInterface, generation: '2004' | '2023'): BlocResultat {
  const l = (symbole: string, libelle: string, valeur: string) => ({ symbole, libelle, valeur });
  return {
    titre: 'Donnees d entree',
    lignes: [
      l('generation', 'texte applique', NOM_GENERATION[generation]),
      l('V_Ed', 'effort tranchant de calcul', `${nombreFr(d.VEd, 1)} kN`),
      l('beta', 'part de l effort longitudinal dans le beton de reprise', nombreFr(d.beta, 3)),
      l('z', 'bras de levier de la section composite', `${nombreFr(d.z, 0)} mm`),
      l('b_i', 'largeur de l interface', `${nombreFr(d.bi, 0)} mm`),
      l('surface', 'etat de surface', LIBELLES_RUGOSITE[d.rugosite]),
      l('f_ck', 'plus faible des deux betons', `${nombreFr(d.fck, 0)} MPa`),
      l('f_yk', 'armatures', `${nombreFr(d.fyk, 0)} MPa`),
      l('A_si', 'armatures traversant l interface', `${nombreFr(d.Asi, 0)} mm2/m`),
      l('alpha', 'angle des armatures avec l interface', `${nombreFr(d.alpha, 0)} degres`),
      l('sigma_n', 'contrainte normale, positive en compression', `${nombreFr(d.sigmaN, 2)} MPa`),
      ...(generation === '2004'
        ? [l('charges', 'dynamiques ou de fatigue', d.dynamique ? 'oui' : 'non')]
        : [l('ancrage', 'armatures ancrees pour f_yd', d.Asi === 0 ? 'sans objet (A_si = 0)' : d.armaturesAncrees ? 'oui' : 'non')]),
    ],
    note: null,
  };
}

/** Blocs des resultats, pour le CSV : les memes grandeurs que le tableau a l'ecran. */
export function blocsResultat(r: ResultatInterface): BlocResultat[] {
  return [
    ...r.verifications.map((v) => ({
      titre: v.titre,
      lignes: v.intermediaires.map((g) => ({
        symbole: g.symbole,
        libelle: g.libelle,
        valeur: `${nombreFr(g.valeur, g.unite === '-' ? 5 : 3)}${g.unite === '-' ? '' : ` ${g.unite}`}`,
      })),
      note: v.statut.etat === 'non-applicable' ? v.statut.motif : null,
    })),
    {
      titre: 'Verdict',
      lignes: [
        { symbole: 'constat', libelle: 'verdict', valeur: TITRES[r.verdict] },
        ...(r.verifications[0].taux === undefined ? [] : [{ symbole: 'taux', libelle: 'sollicitation / resistance', valeur: tauxFr(r.verifications[0].taux, 2) }]),
      ],
      note: [r.motif, ...r.avertissements].join(' '),
    },
  ];
}

/**
 * Coupe schematique (pas a l'echelle) : beton de reprise sur le beton en
 * place, interface en tirets, armature de couture inclinee de alpha, effort
 * de glissement.
 */
export function coupe(d: DonneesInterface): string {
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 220" role="img" aria-label="coupe de l interface">
<rect class="reprise" x="${x0}" y="${yHaut}" width="${L}" height="${yInterface - yHaut}" />
<rect class="en-place" x="${x0}" y="${yInterface}" width="${L}" height="${yBas - yInterface}" />
<line class="interface" x1="${x0}" y1="${yInterface}" x2="${x0 + L}" y2="${yInterface}" />
${barres}
<line class="effort" x1="${x0 + 70}" y1="${yInterface - 14}" x2="${x0 + 190}" y2="${yInterface - 14}" />
<path class="pointe" d="M ${x0 + 190} ${yInterface - 19} L ${x0 + 202} ${yInterface - 14} L ${x0 + 190} ${yInterface - 9} Z" />
<text class="etiquette" x="${x0 + 6}" y="${yHaut + 16}">${notationSvg('beton de reprise')}</text>
<text class="etiquette" x="${x0 + 6}" y="${yBas - 8}">${notationSvg('beton en place')}</text>
<text class="etiquette" x="${x0 + L - 6}" y="${yInterface - 6}" text-anchor="end">interface, ${notationSvg(d.rugosite.replace('-', ' '))}</text>
<text class="etiquette" x="${x0 + 70}" y="${yInterface - 22}">${notationSvg('v_Edi = beta V_Ed / (z b_i)')}</text>
<text class="etiquette" x="${x0 + L}" y="${yBas + 20}" text-anchor="end">${notationSvg(d.Asi > 0 ? `A_si = ${nombreFr(d.Asi, 0)} mm2/m, alpha = ${nombreFr(d.alpha, 0)}°` : "sans armature d interface")}</text>
</svg>`;
}
