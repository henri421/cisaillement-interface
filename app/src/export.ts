/**
 * Les sorties : SVG autonome, CSV, note de calcul. PUR, sans DOM.
 */

import { JETONS, notationHtml, nombreAffiche, type BlocResultat } from 'aedificium-ui';
import type { DonneesInterface, ResultatInterface } from '../../src/index';
import { NOM_GENERATION, tableauVerification, verdictHtml } from './vue';

/**
 * Regles de peinture de la coupe, recopiees de `style.css` : un SVG exporte
 * ne voit pas la feuille de la page, et sortirait en aplat noir.
 */
export const STYLES_TRACE = `${JETONS}
svg { background: var(--surface); color-scheme: light; font-family: var(--sans); }
svg .reprise { fill: var(--beton); stroke: var(--texte); stroke-width: 1.2; }
svg .en-place { fill: var(--surface-appui); stroke: var(--texte); stroke-width: 1.2; }
svg .interface { stroke: var(--traction); stroke-width: 2; stroke-dasharray: 8 5; }
svg .barre { stroke: var(--compression); stroke-width: 3; stroke-linecap: round; }
svg .effort { stroke: var(--texte); stroke-width: 1.5; }
svg .pointe { fill: var(--texte); }
svg .etiquette { fill: var(--texte-doux); font-size: 11px; font-family: var(--sans); }`;

const MENTION_VALEURS =
  "Valeurs recommandées de l'EN 1992-1-1 ; l'annexe nationale peut les modifier.";

export const HYPOTHESES = [
  'Contrainte agissante v_Edi = beta V_Ed / (z b_i), identique dans les deux générations ((6.24), (8.75)).',
  'Effet de goujon (2e génération) : barre supposée à au moins 10 phi du bord libre.',
  'Majoration de c_v2 par 1,2 pour les dalles rapportées non appliquée (sens de la sécurité).',
  '1re génération : surface « très lisse » à c = 0,025 (borne basse) ; « très rugueuse » traitée comme « rugueuse ».',
  'Interface en escalier (6.2.5(3)) et calcul du beta par la section ne sont pas traités : beta est saisi.',
];

const STYLE_NOTE = `
  body { margin: 0; padding: 24px 28px; background: var(--surface); color: var(--texte); font: 13px/1.5 var(--sans); }
  h1 { font-size: 1.15rem; font-weight: normal; margin: 0 0 .2rem; }
  h2 { font-size: .95rem; font-weight: 600; margin: 1.5rem 0 .5rem; border-bottom: 1px solid var(--bordure); padding-bottom: .25rem; }
  h3 { font-size: .85rem; margin: .8rem 0 .2rem; }
  .date, .clause { color: var(--texte-faible); font-size: .8rem; margin: 0 0 .6rem; }
  table { border-collapse: collapse; width: 100%; margin: .3rem 0 .6rem; }
  td, th { border-bottom: 1px solid var(--bordure-douce); padding: .22rem .4rem; text-align: left; font-weight: normal; }
  th { font-family: var(--mono); width: 13rem; background: var(--surface-appui); }
  td.libelle { color: var(--texte-doux); }
  td.valeur { font-family: var(--mono); text-align: right; white-space: nowrap; }
  .verdict { font-weight: 600; font-size: 1rem; margin: .5rem 0 .2rem; padding: .4rem .6rem; border-left: 3px solid; }
  .verdict-conforme { color: var(--ok); background: var(--ok-fond); }
  .verdict-non-conforme { color: var(--refus); background: var(--refus-fond); }
  .verdict-non-applicable { color: var(--alerte); background: var(--alerte-fond); }
  .jauge { display: none; }
  .taux { font-family: var(--mono); }
  .motif { font-size: .85rem; }
  .alerte { border-left: 3px solid var(--alerte); background: var(--alerte-fond); color: var(--alerte); padding: .4rem .6rem; font-size: .82rem; }
  figure { margin: .6rem 0; } figure svg { max-width: 30rem; height: auto; }
  ul { color: var(--texte-doux); font-size: .82rem; }
  .pied { margin-top: 2rem; padding-top: .6rem; border-top: 1px solid var(--bordure); color: var(--texte-doux); font-size: .78rem; }
`;

function tableDuBloc(b: BlocResultat): string {
  return (
    `<h3>${notationHtml(b.titre)}</h3><table><tbody>` +
    b.lignes.map((l) => `<tr><th>${notationHtml(l.symbole)}</th><td class="libelle">${notationHtml(l.libelle)}</td><td class="valeur">${notationHtml(l.valeur)}</td></tr>`).join('') +
    '</tbody></table>'
  );
}

/** La note de calcul : le verdict et les tableaux de l'ecran, produits par les memes fonctions. */
export function noteDeCalculHtml(d: DonneesInterface, r: ResultatInterface, entrees: BlocResultat, coupe: string, date: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Note de calcul — cisaillement à l'interface</title>
<style>${STYLES_TRACE}${STYLE_NOTE}</style></head>
<body>
<h1>Note de calcul — cisaillement à l'interface entre bétons</h1>
<p class="date">${notationHtml(date)} · ${notationHtml(NOM_GENERATION[r.generation])}</p>
<h2>Données d'entrée</h2>${tableDuBloc(entrees)}
<figure>${coupe}</figure>
<h2>Vérification</h2>${verdictHtml(r)}${r.verifications.map(tableauVerification).join('')}
<h2>Hypothèses et limites</h2><ul>${HYPOTHESES.map((h) => `<li>${notationHtml(h)}</li>`).join('')}</ul>
<p class="pied">${notationHtml(`${MENTION_VALEURS} V_Ed = ${nombreAffiche(d.VEd, 1)} kN.`)}</p>
</body></html>`;
}
