# Généalogie Toa-Zéo — Guide complet de mise en place

> Objectif : donner à DIHI Tahidi Denis une **adresse web** pour ouvrir son tableau sur
> téléphone / ordinateur, se connecter et saisir ses généalogies.
> Ce guide couvre : **GitHub** → **Supabase** → **Vercel** → **local** (dev).

---

## 1. Dépôt GitHub

- Dépôt privé : `https://github.com/Pacousstar/racines-genealogie` (déjà créé).
- **Doit d'abord contenir le code** (c'est fait : app Next.js dans `src/`). Les fichiers actuels
  (`src/`, `package.json`, `eslint.config.mjs`, `next.config.ts`, etc.) **ne sont pas encore commités** :

```bash
git add -A
git commit -m "feat: base app + login (auth Supabase)"
git push origin main
```

Puis à **chaque évolution** : `git add -A && git commit -m "..." && git push` → Vercel redéploie seul.
- **Ne jamais** commiter `.env.local` (déjà ignoré par `.gitignore`), ni les vraies clés.

---

## 2. Supabase — tout le schéma de données

### 2.1 Créer le projet
1. **https://supabase.com** → **Sign Up** → **New project** (gratuit).
2. Donner un nom (ex. `genealogie-toa-zeo`), mot de passe database, **région proche de la Côte d'Ivoire**
   (ex. `Frankfurt / eu-central-1`).
3. Attendre la création (~1 min).

### 2.2 Créer les tables (une seule commande)
1. **SQL Editor** → coller le contenu de **`supabase/schema.sql`** → **Run**.

Ce script crée **tout**, en une fois :

| Table / objet | Rôle |
|---|---|
| `profiles` | liaison avec `auth.users` + rôle (`admin` / `editeur` / `lecteur`) |
| `quartiers` | les quartiers du village |
| `familles` | lignées souches par quartier |
| `personnes` | les nœuds de l'arbre (identité, dates libres, quartier, fiabilité…) |
| `unions` | couples (mariage / union libre) |
| `enfants` | liens parent → enfant |
| `v_arbre` (vue) | personne + quartier/famille prêt pour l'affichage |
| Trigger `handle_new_user` | tout nouveau compte = rôle `lecteur` auto |
| Trigger `set_updated_at` | met à jour `updated_at` |
| RLS (Row Level Security) | lecture pour tout connecté, **écriture = editeur/admin uniquement** |
| Bucket storage `photos` | privé, édition réservée editeur/admin |

2. **Vérifier** — dans **SQL Editor** :

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```
Vous devez voir : `profiles, quartiers, familles, personnes, unions, enfants` (+ `v_arbre`).

### 2.3 Données d'exemple (optionnel mais conseillé)
- **SQL Editor** → coller **`supabase/seed_exemple.sql`** → *Run*.
  Insère 7 quartiers, 3 familles et plusieurs générations (fondateur → vivants).

### 2.4 Activer l'authentification
1. **Authentication → Providers → Email** : c'est **activé par défaut**. Rien à changer.
2. **Authentication → Users → Add user** : créer le **1er compte (le fils / opérateur technique)**.
   → Ce compte sera automatiquement **`lecteur`**.

### 2.5 Donner les rôles (étape CRUCIALE)
Depuis le **SQL Editor**, promouvoir les comptes :

```sql
-- Voir chaque compte et prendre son id :
SELECT id, email FROM auth.users;

-- L'opérateur technique (toi) → administrateur (tout pouvoir, gestion comptes) :
UPDATE public.profiles SET role = 'admin' WHERE id = '<ID_TOI>';

-- Tahiti Denis (cho) → éditeur (écrit la généalogie) :
UPDATE public.profiles SET role = 'editeur' WHERE id = '<ID_CHO>';
```

Sans cette étape, tout le monde est **lecteur** = ne peut **rien saisir** (c'est voulu).

### 2.6 Récupérer les clés (pour Vercel)
**Project Settings → API** → copier :
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (côté serveur seulement ; sert plus tard
  pour servir les photos et créer les comptes publique)

---

## 3. Vercel — déploiement

1. **https://vercel.com** → **Sign Up** avec le compte **GitHub** `Pacousstar`.
2. **Add New… → Project** → **Import Git Repository** → choisir `racines-genealogie`.
3. Next.js détecté automatiquement → **Deploy**.
4. Dans **Project → Settings → Environment Variables**, ajouter les **3** variables :
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (optionnelle maintenant, nécessaire plus tard)
5. **Redeploy** (onglet **Deployments** → bouton **Redeploy**, produits).
6. Adresse obtenue : `https://racines-genealogie.vercel.app` — c'est **à donner à Tahiti**.

> Rappel : la clé **service_role** ne doit **jamais** apparaître dans le navigateur.
> Elle est utilisée uniquement par des Server Actions / API route (côté serveur).

---

## 4. En local (développement)

1. Copier `.env.example` → `.env.local` et remplir les mêmes valeurs.
2. Installer et lancer :

```bash
npm install
npm run dev
```
3. Ouvrir **http://localhost:3000** → lancer vous rediriger vers `/login`.
4. Se connecter avec le compte éditeur/admin.

L'application protège déjà toutes les pages : non connecté → `/login`, connecté → `/tableau`.

---

## 5. Vérification finale (applicative)

| Étape | Attendu |
|---|---|
| Visiter l'URL Vercel | → redirection `/login` |
| Se connecter avec un compte | → arrive sur `/tableau` avec chiffres du village |
| Cliquer « Se déconnecter » | → retour `/login` |
| (après le seed) | compteurs : 17 personnes, 7 quartiers, 3 familles |

> Astuce Tahiti : sur son téléphone, « Partager → Ajouter à l'écran d'accueil » → l'app se comporte comme une application.

---

## Règles absolues

- **Jamais** de clés dans le code ou Commit Git : uniquement env vars Vercel + `.env.local`.
- Dépôt **privé** : les données généalogiques de personnes vivantes restent **confidentielles**.
- Comptes par défaut **lecteur** : seule la personne avec le rôle **editeur/admin** peut changer les données.
- Prochaines applications en construction : **Le Grand Tableau** (arbre), **Fiche personne**, **Saisie guidée**, **Aides**, **Export GEDCOM**.