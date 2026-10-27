/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui).
 *
 * Module PUR. Les lignes viennent des memes fonctions que l'ecran et le CSV
 * (`blocEntrees`, `blocsResultat`) ; elles ne sont ici que rangees.
 */

import type { BlocResultat, ElementNote, LigneResultat, NoteDeCalcul, VerificationNote } from 'aedificium-ui';
import type { DonneesInterface, Generation, ResultatInterface, Verification } from '../../src/index';
import { blocEntrees, blocsResultat, coupe } from './vue';

export const HYPOTHESES = [
  'Contrainte agissante v_Edi = beta V_Ed / (z b_i), identique dans les deux générations ((6.24), (8.75)).',
  'Effet de goujon (2e génération) : barre supposée à au moins 10 phi du bord libre.',
  'Majoration de c_v2 par 1,2 pour les dalles rapportées non appliquée (sens de la sécurité).',
  '1re génération : surface « très lisse » à c = 0,025 (borne basse) ; « très rugueuse » traitée comme « rugueuse ».',
  'Interface en escalier (6.2.5(3)) et calcul du beta par la section ne sont pas traités : beta est saisi.',
];

export const MENTION_VALEURS = "Valeurs recommandées de l'EN 1992-1-1 ; l'annexe nationale peut les modifier.";

export const ELEMENT_PAR_DEFAUT = 'Interface entre bétons';

export const NORMES: Record<Generation, string> = { '2004': 'EN 1992-1-1:2004', '2023': 'EN 1992-1-1:2023' };

/** Rangement des lignes d'entree par symbole ; un symbole inconnu va en geometrie. */
const RANGEMENT: Record<string, 'materiaux' | 'hypotheses' | 'charges'> = {
  f_ck: 'materiaux',
  f_yk: 'materiaux',
  génération: 'hypotheses',
  charges: 'hypotheses',
  ancrage: 'hypotheses',
  V_Ed: 'charges',
  beta: 'charges',
  sigma_n: 'charges',
};

/** Nom affiche d'une verification : son titre sans la reference du texte. */
export function nomDeVerification(v: Verification): string {
  return v.titre.split(', EN ')[0];
}

/**
 * Taux de la verification. Non applicable : non verifiee (`NaN`, « hors
 * domaine ») ; resistance nulle : 0 si rien n'agit, sinon infini.
 */
function tauxDe(v: Verification): number {
  if (v.statut.etat === 'non-applicable') return NaN;
  if (v.taux !== undefined) return v.taux;
  return (v.sollicitation as number) <= (v.resistance as number) ? 0 : Infinity;
}

export function verificationsDeLaNote(r: ResultatInterface): VerificationNote[] {
  return r.verifications.map((v) => {
    const taux = tauxDe(v);
    return { nom: nomDeVerification(v), clause: v.clauses[0], taux, ok: Number.isFinite(taux) && taux <= 1 };
  });
}

/** Note du calcul courant, pour la generation calculee. */
export function noteDuCalcul(
  d: DonneesInterface,
  r: ResultatInterface,
  cartouche: { projet: string; element: string; date: string }
): NoteDeCalcul {
  const entrees = blocEntrees(d, r.generation);
  const lignes = (section: 'geometrie' | 'materiaux' | 'hypotheses' | 'charges'): LigneResultat[] =>
    entrees.lignes.filter((l) => (RANGEMENT[l.symbole] ?? 'geometrie') === section);
  const bloc = (titre: string, l: LigneResultat[]): ElementNote => ({ type: 'bloc', bloc: { titre, lignes: l, note: null } });

  // Le dernier bloc de `blocsResultat` est le verdict de l'ecran : la note n'en a pas.
  const calculs: ElementNote[] = blocsResultat(r)
    .slice(0, r.verifications.length)
    .map((b: BlocResultat, i): ElementNote => {
      const v = r.verifications[i];
      return { type: 'bloc', bloc: { ...b, note: b.note ?? `Clauses : ${v.clauses.join(', ')}.` } };
    });
  if (r.verdict !== 'non-applicable') calculs.push({ type: 'texte', texte: r.motif });

  return {
    cartouche: {
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? ELEMENT_PAR_DEFAUT : cartouche.element,
      date: cartouche.date,
      norme: NORMES[r.generation],
      outil: 'cisaillement-interface',
    },
    sections: {
      geometrie: [
        bloc('Interface', lignes('geometrie')),
        { type: 'figure', svg: coupe(d), legende: "Coupe schématique de l'interface (pas à l'échelle)" },
      ],
      materiaux: [bloc('Bétons et armatures', lignes('materiaux'))],
      hypotheses: [
        bloc('Texte appliqué', lignes('hypotheses')),
        { type: 'liste', items: HYPOTHESES },
        { type: 'texte', texte: MENTION_VALEURS },
      ],
      charges: [bloc('Sollicitations', lignes('charges'))],
      calculs,
    },
    verifications: verificationsDeLaNote(r),
    avertissements: r.avertissements,
  };
}
