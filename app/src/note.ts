/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui).
 *
 * Module PUR. Les lignes viennent des memes fonctions que l'ecran et le CSV
 * (`blocEntrees`, `blocsResultat`) ; elles ne sont ici que rangees.
 */

import { avertissement2eGeneration, avertissementAnnexeLu, libelleAnnexe, nombreAffiche, traduireSource, type AnnexeNationale } from 'aedificium-ui';
import type { BlocResultat, ElementNote, LigneResultat, NoteDeCalcul, VerificationNote } from 'aedificium-ui';
import type { DonneesInterface, Generation, ProfilInterface, ResultatInterface, Verification } from '../../src/index';
import { phrase, textes } from './textes';
import { blocEntrees, blocsResultat, coupe } from './vue';
import { VERSION_OUTIL } from './version';

/** Hypotheses de la note, en francais (reference des tests). La note lit `textes()`. */
export const HYPOTHESES = textes().note.hypotheses;

export const NORMES: Record<Generation, string> = { '2004': 'EN 1992-1-1:2004', '2023': 'EN 1992-1-1:2023' };

/** Rangement des lignes d'entree par symbole ; un symbole inconnu va en geometrie. */
const RANGEMENT: Record<string, 'materiaux' | 'hypotheses' | 'charges'> = {
  f_ck: 'materiaux',
  f_yk: 'materiaux',
  génération: 'hypotheses',
  generation: 'hypotheses',
  charges: 'hypotheses',
  loads: 'hypotheses',
  ancrage: 'hypotheses',
  anchorage: 'hypotheses',
  V_Ed: 'charges',
  beta: 'charges',
  sigma_n: 'charges',
};

/** Nom affiche d'une verification : son titre sans la reference du texte. */
export function nomDeVerification(v: Verification): string {
  return phrase(v.titre).split(', EN ')[0];
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
    return { nom: nomDeVerification(v), clause: phrase(v.clauses[0]), taux, ok: Number.isFinite(taux) && taux <= 1 };
  });
}

/** Note du calcul courant, pour la generation calculee. */
export function noteDuCalcul(
  d: DonneesInterface,
  r: ResultatInterface,
  cartouche: { projet: string; element: string; date: string },
  annexe: AnnexeNationale = 'recommande',
  profil: ProfilInterface | null = null
): NoteDeCalcul {
  const t = textes().note;
  const bloc = (titre: string, l: LigneResultat[]): ElementNote => ({ type: 'bloc', bloc: { titre, lignes: l, note: null } });
  // Annexe nationale : 1re generation seulement (l'AN-LU:2020 ne couvre pas la 2e).
  const avecAnnexe = r.generation === '2004' && profil !== null;
  const coefsAnnexe: ElementNote[] = avecAnnexe
    ? [
        bloc(
          `${t.annexe} : ${libelleAnnexe(annexe)}`,
          (['gammaC', 'gammaS', 'alphaCc', 'alphaCt'] as const).map((k) => ({
            symbole: { gammaC: 'gamma_C', gammaS: 'gamma_S', alphaCc: 'alpha_cc', alphaCt: 'alpha_ct' }[k],
            libelle: traduireSource(profil.ec2004[k].source),
            valeur: nombreAffiche(profil.ec2004[k].valeur, 3),
          }))
        ),
      ]
    : [];
  const entrees = blocEntrees(d, r.generation);
  const lignes = (section: 'geometrie' | 'materiaux' | 'hypotheses' | 'charges'): LigneResultat[] =>
    entrees.lignes.filter((l) => (RANGEMENT[l.symbole] ?? 'geometrie') === section);

  // Le dernier bloc de `blocsResultat` est le verdict de l'ecran : la note n'en a pas.
  const calculs: ElementNote[] = blocsResultat(r)
    .slice(0, r.verifications.length)
    .map((b: BlocResultat, i): ElementNote => {
      const v = r.verifications[i];
      return { type: 'bloc', bloc: { ...b, note: b.note ?? `${t.clauses} ${v.clauses.map(phrase).join(', ')}.` } };
    });
  if (r.verdict !== 'non-applicable') calculs.push({ type: 'texte', texte: phrase(r.motif) });

  return {
    cartouche: {
      version: VERSION_OUTIL,
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? t.element : cartouche.element,
      date: cartouche.date,
      norme: NORMES[r.generation],
      outil: 'cisaillement-interface',
    },
    sections: {
      geometrie: [
        bloc(t.interface, lignes('geometrie')),
        { type: 'figure', svg: coupe(d), legende: t.legende },
      ],
      materiaux: [bloc(t.materiaux, lignes('materiaux'))],
      hypotheses: [
        bloc(t.texte, lignes('hypotheses')),
        { type: 'liste', items: t.hypotheses },
        ...(avecAnnexe ? coefsAnnexe : [{ type: 'texte' as const, texte: t.mention }]),
      ],
      charges: [bloc(t.sollicitations, lignes('charges'))],
      calculs,
    },
    verifications: verificationsDeLaNote(r),
    avertissements: [
      ...(r.generation === '2023' ? [avertissement2eGeneration()] : []),
      ...(avecAnnexe && annexe === 'lu' ? [avertissementAnnexeLu()].filter((a) => a !== '') : []),
      ...r.avertissements.map(phrase),
    ],
  };
}
