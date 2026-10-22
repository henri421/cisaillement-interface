# Cas de validation : dalle sur prédalle, interface lisse

V_Ed = 45 kN, β = 1, z = 153 mm, b_i = 1000 mm, f_ck = 25 MPa, f_yk = 500 MPa, α = 90°, σ_n = 0.

v_Edi = 45 000 / (153 × 1000) = **0,2941 MPa** (deux générations).

## 1re génération (2004), surface lisse : c = 0,2, μ = 0,6

- f_ctm = 0,30 × 25^(2/3) = 2,565 MPa ; f_ctd = 0,7 × 2,565 / 1,5 = 1,197 MPa.
- Sans armature : v_Rdi = 0,2 × 1,197 = **0,2394 MPa** → non conforme.
- A_si = 300 mm²/m : ρ = 300 / 10⁶ = 0,0003 ; ρ f_yd μ = 0,0003 × 434,78 × 0,6 = 0,0783 ;
  v_Rdi = 0,2394 + 0,0783 = **0,3177 MPa** → conforme, taux 0,93.
- Charges dynamiques : c / 2, v_Rdi = **0,1197 MPa** sans armature.

## 2e génération (2023), surface lisse : c_v1 = 0,08, μ_v = 0,6

- Sans armature : τ_Rdi = 0,08 × √25 / 1,5 = **0,2667 MPa** → non conforme.
- A_si = 300 mm²/m, ancrées : 0,2667 + 0,0003 × 434,78 × 0,6 = **0,3449 MPa**.
- Ancrage insuffisant (8.77) : c_v2 = 0, k_v = 0,5, k_dowel = 1,1 ;
  f_cd = η_cc k_tc f_ck / γ_C = 1 × 0,85 × 25 / 1,5 = 14,17 MPa ;
  0,5 × 0,0003 × 434,78 × 0,6 + 1,1 × 0,0003 × √(434,78 × 14,17) = 0,0391 + 0,0260 = **0,0650 MPa**.

Tests : `tests/interface.test.ts`.
