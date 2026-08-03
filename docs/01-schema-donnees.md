# Généalogie Toa-Zéo — Schéma de données

> Outil personnel du CHO **DIHI Tahidi Denis** pour digitaliser et poursuivre le grand tableau généalogique du village.
> Aligné sur la structuration Racines+ (quartiers → familles → générations) mais **autonome** : c'est la source d'autorité qui alimentera Racines+ plus tard (via GEDCOM / API).

---

## 1. Concepts (vocabulaire du CHO)

| Concept | Définition |
|---------|------------|
| **Quartier** | Un quartier du village Toa-Zéo (Centre, Nord, Sud, Est, Fondateurs, Gbéya, Bonyé…) |
| **Famille** | La famille souche à l'intérieur d'un quartier (nom de famille / lignée) |
| **Personne** | Un individu : vivant ou décédé, avec dates, photo, notes |
| **Ancêtre fondateur** | La racine du village (jamais d'inscription, figure historique certifiée) |
| **Lien de parenté** | parent → enfant ; union (couple) entre deux personnes |
| **Fiabilité** | `confirmé` / `probable` / `en cours` (comme Racines+) |

---

## 2. Tables

### 2.1 `quartiers` — les quartiers du village

| Colonne   | Type                          | Notes                     |
|-----------|-------------------------------|---------------------------|
| `id`      | uuid PK                       |                           |
| `nom`     | text NOT NULL UNIQUE          | « Quartier Gbéya »…       |
| `ordre`   | int                           | affichage dans le tableau |
| `note`    | text                          | histoire du quartier      |

> Base de départ = les quartiers déjà présents dans Racines+ pour Toa-Zéo (Centre, Nord, Sud, Est, Fondateurs + Gbéya, Bonyé visibles dans les seed). Saisie libre ensuite.

### 2.2 `familles` — les lignées / familles souches

| `id`       | uuid PK               |
|------------|------------------------|
| `quartier_id` | uuid → quartiers    |
| `nom`      | text NOT NULL          |
| `note`     | text                   |

> « Famille Souffles », « Famille Diakité »… C'est le regroupement que le CHO gère naturellement dans sa tête.

### 2.3 `personnes` — les nœuds du tableau

| Colonne              | Type                  | Notes                                                       |
|----------------------|-----------------------|-------------------------------------------------------------|
| `id`                 | uuid PK                |                                                             |
| `nom`                | text NOT NULL         | nom de famille                                              |
| `prenom`             | text                  |                                                             |
| `surnom`             | text                  | surnom connu au village                                     |
| `sexe`               | text                  | M / F / `null` si inconnu                                   |
| `date_naissance`     | text                  | texte libre pour rester souple : « vers 1890 », « 12/03/1945 » |
| `date_deces`         | text                  | idem                                                         |
| `lieu_naissance`     | text                  |                                                             |
| `lieu_deces`         | text                  |                                                             |
| `vivant`             | boolean default true  | décédé → badge gris/noir à l'écran                          |
| `quartier_id`        | uuid → quartiers      | quartier de rattachement lors de la voie                     |
| `famille_id`         | uuid → familles       | famille souche                                               |
| `photo_url`       | text                  | lien vers l'image (storage) ; vide → initiales en grand     |
| `est_ancetre`        | boolean default false | la racine du village (1 ou peu)                              |
| `est_fondateur`      | boolean default false | ancêtre d'un quartier                                        |
| `biographie`         | text                  | récit / détails que le CHO veut garder                      |
| `source`             | text                  | témoin, document, oral …                                    |
| `fiabilite`          | text default 'en cours' | `confirmé` / `probable` / `en cours`                      |
| `notes`              | text                  | zone libre                                                  |
| `created_at`         | timestamptz           |                                                             |
| `updated_at`         | timestamptz |                                                             |

> **Dates en texte** : un savant écrit « vers 1885 », « avant l'école », « pendant la crise 2002 » à l'oral comme à l'écrit. Une date stricte casserait la saisie. On ajoutera une colonne `ordre_generation` calculée pour le tri vertical.

### 2.4 `unions` — les couples

| `id`        | uuid PK |
| `homme_id`  | uuid → personnes | conjoint 1        |
| `femme_id`  | uuid → personnes | conjoint 2        |
| `type`      | text default 'mariage' | mariage / union libre |
| `date_union`| text | |
| `lieu`      | text | |

> Une union est le nœud où s'accrochent les enfants.

### 2.5 `enfants` — les appartenances parent → enfant

| `id`        | uuid PK |
| `parent_id` | uuid → personnes | un des 2 parents |
| `enfant_id` | uuid → personnes | l'enfant         |
| `rang`      | int               | ordre de naissance connu |
| `type_lien` | text default 'biologique' | biologique / adoptif / incertain |

> Deux lignes de `enfants` (une par parent) relient l'enfant au couple `homme_id` + `femme_id`.

---

## 3. Garanties (contraintes, cohérence)

- Un enfant a **au moins une ligne** dans `enfants`, sinon il est « orphelin » et l'interface le signale (aide à l'exhaustivité).
- `personnes.famille_id` optionnel sur les épouses/époux « entrés par mariage », qui restent rattachées à leur propre famille.
- Une parenthèse interdit les cycles impossibles : on ne verra qu'en lecture, l'ajout d'un lien parent→enfant vérifie que l'enfant n'est pas déjà ancêtre de la branche.

---

## 4. Fermeture vers Racines+

- Export **GEDCOM 7** (Personnes + Unions + Lien parenté).
- Les quartiers utilisés restent les mêmes que Racines+ pour une future import.
- Le CHO signe les fiches `certifiée` par lui ; niveau de fiabilité compatible avec les `profiles` Racines+.

---

*Ce schéma va évoluer — on le fait simple d'abord, on enrichit selon la pratique de saisie du CHO.*