/**
 * Cablage de l'interface du cisaillement a l'interface.
 *
 * Ce module ne calcule RIEN : il tient la saisie, appelle le noyau, et confie
 * la mise en forme a `vue` et `export`, purs. La generation n'est qu'un champ
 * de la saisie : la basculer ne touche a aucune valeur saisie.
 */

import { echapper, ouvrirOuTelecharger, resultatsEnCsv, svgAutonome, telecharger } from 'aedificium-ui';
import { LIBELLES_RUGOSITE, RUGOSITES, ec2Recommande, verifierInterface, type Generation, type Rugosite } from '../../src/index';
import { lireSaisie, relire, saisieParDefaut, serialiser, type Saisie } from './form';
import { blocEntrees, blocsResultat, coupe, messageDErreur, tableauVerification, verdictHtml } from './vue';
import { STYLES_TRACE, noteDeCalculHtml } from './export';
import './style.css';

const PROFIL = ec2Recommande();
const CLE_STOCKAGE = 'cisaillement-interface/saisie';

function exige<T extends Element>(selecteur: string): T {
  const e = document.querySelector<T>(selecteur);
  if (e === null) throw new Error(`Element absent de la page : ${selecteur}`);
  return e;
}

const formulaire = exige<HTMLFormElement>('#formulaire');
const zones = {
  erreur: exige<HTMLElement>('[data-role="erreur"]'),
  coupe: exige<HTMLElement>('[data-role="coupe"]'),
  verdict: exige<HTMLElement>('[data-role="verdict"]'),
  details: exige<HTMLElement>('[data-role="details"]'),
};

exige<HTMLSelectElement>('[data-role="rugosite"]').innerHTML = RUGOSITES.map(
  (r) => `<option value="${r}">${echapper(LIBELLES_RUGOSITE[r])}</option>`
).join('');

function charger(): Saisie | null {
  try {
    const t = window.localStorage.getItem(CLE_STOCKAGE);
    return t === null ? null : relire(t);
  } catch {
    return null;
  }
}

function memoriser(): void {
  try {
    window.localStorage.setItem(CLE_STOCKAGE, serialiser(saisie));
  } catch {
    // Stockage indisponible : la page fonctionne sans.
  }
}

let saisie: Saisie = charger() ?? saisieParDefaut();

interface Dernier {
  donnees: ReturnType<typeof lireSaisie> & { ok: true };
  resultat: ReturnType<typeof verifierInterface>;
  coupe: string;
}
let dernier: Dernier | null = null;

function ecrireSaisie(): void {
  for (const e of formulaire.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-champ]')) {
    const v = saisie[e.dataset.champ as keyof Saisie];
    if (e instanceof HTMLInputElement && e.type === 'checkbox') e.checked = v === true;
    else e.value = String(v);
  }
}

function montrerErreur(message: string | null): void {
  zones.erreur.hidden = message === null;
  zones.erreur.textContent = message ?? '';
}

/** Les champs propres a une generation s'affichent avec elle ; leur valeur reste en memoire. */
function ajusterGeneration(): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-generation]')) {
    b.setAttribute('aria-pressed', String(b.dataset.generation === saisie.generation));
  }
  for (const g of formulaire.querySelectorAll<HTMLElement>('[data-groupe]')) g.hidden = g.dataset.groupe !== saisie.generation;
}

function recalculer(): void {
  memoriser();
  ajusterGeneration();
  const lecture = lireSaisie(saisie);
  if (!lecture.ok) return montrerErreur(lecture.message);
  try {
    const resultat = verifierInterface(lecture.donnees, saisie.generation, PROFIL);
    dernier = { donnees: lecture, resultat, coupe: coupe(lecture.donnees) };
  } catch (e) {
    return montrerErreur(messageDErreur(e));
  }
  montrerErreur(null);
  zones.coupe.innerHTML = dernier.coupe;
  zones.verdict.innerHTML = verdictHtml(dernier.resultat);
  zones.details.innerHTML = dernier.resultat.verifications.map(tableauVerification).join('');
}

formulaire.addEventListener('input', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLInputElement || cible instanceof HTMLSelectElement)) return;
  const champ = cible.dataset.champ as keyof Saisie | undefined;
  if (champ === undefined) return;
  if (cible instanceof HTMLInputElement && cible.type === 'checkbox') {
    if (champ === 'dynamique' || champ === 'armaturesAncrees') saisie[champ] = cible.checked;
  } else if (champ === 'rugosite') {
    saisie.rugosite = cible.value as Rugosite;
  } else if (champ !== 'generation' && champ !== 'dynamique' && champ !== 'armaturesAncrees') {
    saisie[champ] = cible.value;
  }
  recalculer();
});
formulaire.addEventListener('change', (e) => {
  if (e.target instanceof HTMLSelectElement || (e.target instanceof HTMLInputElement && e.target.type === 'checkbox')) {
    e.target.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

document.addEventListener('click', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLElement)) return;

  const generation = cible.dataset.generation;
  if (generation === '2004' || generation === '2023') {
    saisie.generation = generation as Generation;
    return recalculer();
  }

  const action = cible.dataset.action;
  if (action === 'enregistrer') return telecharger('cisaillement-interface.json', serialiser(saisie), 'application/json;charset=utf-8');
  if (action === 'reinitialiser') {
    saisie = saisieParDefaut();
    ecrireSaisie();
    return recalculer();
  }
  if (action === undefined || !action.startsWith('exporter-')) return;
  if (dernier === null) return montrerErreur('Aucun calcul valide a exporter : corriger la saisie.');
  const d = dernier.donnees.donnees;
  const entrees = blocEntrees(d, saisie.generation);
  const base = `interface-${saisie.generation}`;
  if (action === 'exporter-coupe') {
    telecharger(`${base}-coupe.svg`, svgAutonome(dernier.coupe, STYLES_TRACE), 'image/svg+xml;charset=utf-8');
  } else if (action === 'exporter-resultats') {
    telecharger(`${base}-resultats.csv`, resultatsEnCsv([entrees, ...blocsResultat(dernier.resultat)]), 'text/csv;charset=utf-8');
  } else if (action === 'exporter-note') {
    ouvrirOuTelecharger(`${base}-note.html`, noteDeCalculHtml(d, dernier.resultat, entrees, dernier.coupe, new Date().toISOString().slice(0, 10)));
  }
});

exige<HTMLInputElement>('[data-role="ouvrir"]').addEventListener('change', async (e) => {
  const entree = e.target as HTMLInputElement;
  const f = entree.files?.[0];
  entree.value = '';
  if (f === undefined) return;
  try {
    saisie = relire(await f.text());
  } catch (err) {
    return montrerErreur(messageDErreur(err));
  }
  ecrireSaisie();
  recalculer();
});

ecrireSaisie();
recalculer();

// Hors navigateur (tests), pas de service worker.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void import('./pwa').then((m) => m.enregistrerServiceWorker());
}
