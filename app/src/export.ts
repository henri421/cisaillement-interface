/**
 * Styles du SVG autonome de la coupe. PUR, sans DOM.
 */

import { JETONS } from 'aedificium-ui';

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
