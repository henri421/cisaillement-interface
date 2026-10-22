# cisaillement-interface

Cisaillement le long des surfaces de reprise de bétonnage (dalle rapportée sur prédalle, reprise
entre deux phases de coulage) selon l'**EN 1992-1-1**, dans ses **deux générations** :
2004, §6.2.5 et 2023, §8.2.6. Un bouton bascule de l'une à l'autre **sans rien ressaisir**.

Fait partie de la suite [Aedificium web](https://henri421.github.io/WebAedificium/).
Page publiée : <https://henri421.github.io/cisaillement-interface/>.

> **Aide au calcul. L'outil constate, il ne prescrit pas.** Valeurs recommandées de
> l'EN 1992-1-1, sans annexe nationale. La 2ᵉ génération n'est applicable qu'une fois son annexe
> nationale publiée. La vérification finale incombe à l'ingénieur du projet.

## Ce que l'outil rend

- v_Edi = β V_Ed / (z b_i), identique dans les deux générations ((6.24), (8.75)).
- **2004** : v_Rdi = c f_ctd + μ σ_n + ρ f_yd (μ sin α + cos α) ≤ 0,5 ν f_cd (6.25) ; c divisé par
  deux sous charges dynamiques ou de fatigue (6.2.5(5)).
- **2023** : armatures ancrées pour f_yd (8.76), ou ancrage insuffisant (8.77) avec l'effet de
  goujon ; classe de surface « très rugueuse ».
- Toutes les grandeurs intermédiaires, la coupe schématique, le verdict et le taux.
- Sorties : coupe (SVG), résultats (CSV), note de calcul HTML produite par les mêmes fonctions
  que l'écran.

## Choix déclarés

- 2004, surface « très lisse » : c = 0,025, borne basse de la plage 0,025 à 0,10.
- 2004, surface « très rugueuse » (absente de 2004) : traitée comme « rugueuse ».
- 2023 : effet de goujon avec la barre à au moins 10 φ du bord libre ; majoration de c_v2 par 1,2
  des dalles rapportées non appliquée (sens de la sécurité).
- β est saisi : son calcul par la section composite n'est pas fait.

## Origine du moteur

Formules reprises du blog [ec2-2e-generation](https://henri421.github.io/blog/) (article
« interfaces »), relues sur les textes ; mêmes cas de validation.

## Développement

```bash
npm install
npm run typecheck
npm test
npm run build
```
