/**
 * Classeur Excel du calcul courant (fiche 11.3). Module PUR : la description
 * vient du noyau (`classeurInterface`), la mise en page d'aedificium-ui ; ici,
 * seulement le cartouche et la traduction des libelles du noyau.
 */

import { classeurDeCalcul, nomDeFichierXlsx, type CartoucheXlsx, type ClasseurCalcul } from 'aedificium-ui';
import { classeurInterface, type DonneesInterface, type ProfilInterface, type ResultatInterface } from '../../src/index';
import { NORMES } from './note';
import { phrase, textes } from './textes';
import { VERSION_OUTIL } from './version';

export const TYPE_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Classeur traduit dans la langue courante (les libelles du noyau sont en francais). */
export function classeurDuCalcul(
  d: DonneesInterface,
  r: ResultatInterface,
  p: ProfilInterface,
  infos: { titre: string; projet: string; element: string; date: string; annexe?: string }
): ClasseurCalcul {
  const cartouche: CartoucheXlsx = {
    titre: infos.titre,
    projet: infos.projet,
    element: infos.element.trim() === '' ? textes().note.element : infos.element,
    outil: 'cisaillement-interface',
    version: VERSION_OUTIL,
    norme: NORMES[r.generation],
    annexe: infos.annexe,
    date: infos.date,
  };
  const c = classeurInterface(d, r, p, cartouche);
  const p_ = (t: string | undefined): string | undefined => (t === undefined ? t : phrase(t));
  return {
    ...c,
    donnees: c.donnees.map((g) => ({
      titre: phrase(g.titre),
      lignes: g.lignes.map((l) => ({ ...l, grandeur: phrase(l.grandeur), source: p_(l.source), valeur: typeof l.valeur === 'string' ? phrase(l.valeur) : l.valeur })),
    })),
    calcul: c.calcul.map((g) => ({ titre: phrase(g.titre), lignes: g.lignes.map((l) => ({ ...l, grandeur: phrase(l.grandeur), clause: p_(l.clause) })) })),
    verifications: c.verifications.map((v) => ({ ...v, nom: phrase(v.nom), clause: p_(v.clause) })),
  };
}

/** Octets et nom du fichier. */
export function fichierExcel(c: ClasseurCalcul, generation: string): { nom: string; octets: Uint8Array } {
  return {
    nom: nomDeFichierXlsx('cisaillement-interface', c.cartouche.element, generation, c.cartouche.date),
    octets: classeurDeCalcul(c),
  };
}
