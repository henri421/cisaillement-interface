/**
 * Annexe nationale (lot E, audit R4). Module PUR.
 *
 * Le Luxembourg ne touche que la 1re generation (ILNAS-EN 1992-1-1/AN-LU:2020) :
 * gamma_C, gamma_S, alpha_cc et alpha_ct, a partir de la table commune `AN_LU`
 * d'aedificium-ui. alpha_cc et alpha_ct sont preremplis et restent modifiables
 * (`profilSaisi` marque une valeur changee imposee).
 */

import { valeurLu, type AnnexeNationale } from 'aedificium-ui';
import { ec2Recommande, type ProfilInterface } from '../../src/index';

export function profilDeLAnnexe(a: AnnexeNationale): ProfilInterface {
  const rec = ec2Recommande();
  if (a !== 'lu') return rec;
  const e = rec.ec2004;
  const lu = (cle: string, v: { valeur: number; source: string }, clause: string) => valeurLu('EN 1992-1-1', cle, v, clause);
  return {
    ...rec,
    nom: 'Luxembourg, ILNAS-EN 1992-1-1/AN-LU:2020 (valeurs présumées, à vérifier) ; 2e génération : valeurs recommandées',
    date: '2026-11-17',
    ec2004: {
      ...e,
      gammaC: lu('gamma_C', e.gammaC, 'tableau 2.1N'),
      gammaS: lu('gamma_S', e.gammaS, 'tableau 2.1N'),
      alphaCc: lu('alpha_cc', e.alphaCc, '3.1.6(1)P'),
      alphaCt: lu('alpha_ct', e.alphaCt, '3.1.6(2)P'),
    },
  };
}
