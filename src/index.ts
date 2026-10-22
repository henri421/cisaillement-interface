/**
 * cisaillement-interface — noyau de calcul.
 *
 * Cisaillement le long des surfaces de reprise de betonnage selon
 * l'EN 1992-1-1, dans ses deux generations (2004 : 6.2.5 ; 2023 : 8.2.6).
 */

export {
  LIBELLES_RUGOSITE,
  RUGOSITES,
  ec2Recommande,
  verifierProfil,
  type Profil2004,
  type Profil2023,
  type ProfilInterface,
  type Rugosite,
  type ValeurSourcee,
} from './profil';
export {
  contrainteInterface,
  tauxArmature,
  verifier2004,
  verifier2023AncrageInsuffisant,
  verifier2023Ancrees,
  verifierInterface,
  type DonneesInterface,
  type Generation,
  type Grandeur,
  type ResultatInterface,
  type Statut,
  type Verification,
} from './interface';
