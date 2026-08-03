# Généalogie Toa-Zéo — Maquettes d'écran

> Maquettes « à plat » (ASCII) de l'application du CHO. Trois écrans clés :
> **1. Le Grand Tableau (arbre cliquable)** → **2. Fiche personne** → **3. Saisie guidée**.

---

## Écran 1 — LE GRAND TABLEAU (vue principale)

Reproduit le tableau mural : générations empilées, chaque personne est une **carte cliquable**.
L'ancêtre fondateur est au sommet (comme Racines+ : sommet = origines).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Généalogie Toa-Zéo                🔍 Rechercher un nom…      [Filtres ▾] │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │  FILTRE QUARTIER : [Tous ▾]  VIVANTS : [Tous ▾]   FIABILITÉ : [Tous▾]│ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                      ┌──────────────┐                                    │
│                      │     ⬛        │   ← photo (ou INITIALES en grand) │
│                      │     ZT       │                                    │
│                      └──────────────┘                                    │
│                      Zaïé TOA-ZEO                                        │
│                      ♂ vers 1700 – 1760   [★ Ancêtre]                   │
│                           │                                              │
│                           │                                              │
│              ┌────────────┴───────────┐                                  │
│              │                        │                                  │
│     ┌──────────────┐        ┌──────────────┐                             │
│     │     ⬛        │        │     ⬛        │   ← 2 fils = 2 lignées     │
│     │     KN       │        │     …        │                             │
│     └──────────────┘        └──────────────┘                             │
│     Nguessan KOUASSI        (autre famille)                              │
│     ♂ vers 1730 – 1800                                                  │
│              │                                                           │
│      ┌───────┴───────┐                                                   │
│      │               │                                                   │
│ ┌───────────┐   ┌───────────┐                                            │
│ │    ⬛     │   │     ⬛     │   ← frères / sœurs (fratrie)               │
│ │    DK     │   │           │                                            │
│ └───────────┘   └───────────┘                                            │
│ Kouamé DIHI    ...                                                       │
│ ♂ vers 1810 – 1895                                                       │
│      │                                                                    │
│   ┌──┴──┐       … la branche continue jusqu'aux vivants                  │
│   │ ⬛  │                                                                 │
│   │ DG  │                                                                 │
│   └─────┘                                                                 │
│ Gbaya DIHI  (décédé → bordure grise/noire)                               │
│      │                                                                    │
│   ┌──┴──┐                                                                │
│   │ ⬛  │      ┌───────┐                                                  │
│   │ DL  │──────│  ⬛   │  ← l'union (conjoint)                            │
│   └─────┘      │  GA   │                                                 │
│ Léon DIHI     Aya GBEYA                                                  │
│ ♂ 1935–2010  ♀ née 1970 (badge violet « mariée »)                        │
│      │            │                                                      │
│      └─────┬──────┘                                                      │
│         ┌───────┐                                                        │
│         │  ⬛    │     ← « nous » : Tahidi Denis DIHI                     │
│         │  TD   │                                                        │
│         └───────┘                                                        │
│   Tahidi Denis DIHI                                                      │
│   ♂ né 1965 · CHO · [✏ Modifier]                                          │
│         │                                                                 │
│      ┌──┴──┐                                                              │
│      │ ⬛  │   ← nouveaux-nés / enfants                                    │
│      │ MA  │                                                              │
│      └─────┘                                                              │
│   Marc Aurèle DIHI                                                        │
│   ♂ né 1995 (vivant)                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Règles d'affichage**
- Chaque carte = **photo carrée** (si absente → **initiales en grandes lettres**, ex. « TD »).
- Nom complet en gras, dates en dessous, icônes : ♂/♀, 🕊 décédé (carte grisée), ★ ancêtre/fondateur.
- Carte cliquable → **Écran 2**.
- Le grand tableau est **illimité** : zoom, défilement (vertical = générations, horizontal = fratries), filtres par quartier / vivants / fiabilité.
- Au sommet : l'ancêtre fondateur (1 seule racine) ; sous lui les lignées par quartier.

---

## Écran 2 — FICHE PERSONNE (au clic sur une carte)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ‹ Retour au tableau                               [✏ Modifier] [🗑 ]      │
│                                                                          │
│  ┌──────────┐   DIHI Tahidi Denis          Badge : ✅ confirmé           │
│  │          │   Surnom : « le Savant »                                  │
│  │    ⬛     │   Sexe : ♂ Homme                                          │
│  │    TD    │   Naissance : 1965 · Toa-Zéo                              │
│  │          │   Décès : — (vivant)                                      │
│  └──────────┘   Quartier : Quartier Centre                              │
│   (photo ou    Famille : Famille DIHI                                   │
│   initiales)    Source : lui-même / tableau du CHO                      │
│                                                                          │
│  ─── AFFILIATIONS ───────────────────────────────────────────────────── │
│  👴 Père :      Léon DIHI (1935–2010)          → clic ouvre sa fiche    │
│  👵 Mère :      Aya GBEYA (née 1970)           → clic ouvre sa fiche    │
│  💍 Épouse :    Aya GBEYA (union en 1992)      → clic ouvre sa fiche    │
│  👶 Enfants :   Marc Aurèle DIHI (né 1995)                               │
│                 [ + Déclarer un enfant ]                                 │
│  👴 Frères :    (liste s'il y en a)                                      │
│                                                                          │
│  ─── HISTOIRE ────────────────────────────────────────────────────────── │
│  Biographie : (récits du CHO)                                            │
│  …                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Principe : tout est cliquable** — chaque personne citée ouvre sa fiche. Le CHO navigue « au doigt » dans le village.

---

## Écran 3 — SAISIE GUIDÉE (« Je déclare »)

Conçue pour la rapidité : gros boutons, peu de champs obligatoires (nom + prénom), le reste optionnel.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ + DÉCLARER UNE PERSONNE                                                   │
│                                                                          │
│  1. QUI ?  Nom* ▓▓▓▓▓▓▓▓   Prénom ▓▓▓▓▓▓   Surnom ▓▓▓▓▓▓                │
│            Sexe : ( ♂ ) ( ♀ )                                            │
│            Vivant : ( ✓ Oui ) ( Décédé )                                 │
│  2. DATES (texte libre)  Naissance ▓▓▓▓▓  (ex. « vers 1890 »)           │
│                          Décès ▓▓▓▓▓  (si décédé)                       │
│  3. LIEU : Quartier [Quartier Centre ▾]  Famille [Famille DIHI ▾]       │
│  4. LIENS :                                                              │
│     Père  ▓▓▓▓▓▓ [Chercher…]   Mère ▓▓▓▓▓▓ [Chercher…]                  │
│     Conjoint ▓▓▓▓▓▓ [Chercher…]                                          │
│     ☐ Je n'ai pas encore la personne → créer la carte provisoire        │
│  5. SOURCE (pour la fiabilité) :                                         │
│     ( • Témoignage du CHO ) ( Registre ) ( Document ) ( Autre )         │
│     Fiabilité : [confirmé ▾]                                             │
│                                                                          │
│                      [ + AJOUTER ]   [ Réinitialiser ]                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Astuce du « nœud provisoire »** (reprise de la logique Racines+) :
- le CHO déclare un enfant dont le père n'est pas encore saisi → le système crée une carte « Père inconnu » en pointillés, complétée plus tard ;
- l'écran **Aides** liste les cartes en pointillés et les « orphelins » (personnes sans parents) → le CHO reconstitue les liens au fur et à mesure.

---

## Écran 4 — AIDES À LA RECONSTITUTION (bonus)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ AIDES                                                                     │
│  ⚠ 12 cartes en pointillés (personne déclarée, parent absent)            │
│  ⚠ 3 personnes sans parents connus (orphelines)                         │
│  ⚠ 5 personnes vivantes sans date de naissance                          │
│                                                                          │
│  [ Reconstruire les liens ▸ ]  [ Voir les fratries incomplètes ▸ ]      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Écran 5 — EXPORT (pour Racines+)

- Bouton **« Exporter GEDCOM 7 »** → fichier `.ged` compatible Racines+ et logiciels de généalogie.
- Bouton **« Imprimer le tableau »** → PDF agrandissable du grand tableau (retrouver la version papier !).

---

*Prochaine étape proposée : prototype fonctionnel (b) — on construit l'app sur ce schéma et ces écrans.*
