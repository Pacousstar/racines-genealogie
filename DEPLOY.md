# Déploiement sur Vercel — Généalogie Toa-Zéo

> Objectif : donner à DIHI Tahidi Denis une **adresse web** pour ouvrir son tableau sur
> téléphone / ordinateur où qu'il soit, et saisir ses généalogies.

---

## Étape 1 — Prérequis : l'app existe dans le dépôt

- Le dépôt doit contenir l'application (Next.js), pas seulement les docs.
- Sans app, Vercel ne déploie rien d'utile (il afficherait une page vide).
- **État actuel du dépôt** : docs + schéma SQL + image modèle → l'app reste à construire (étape suivante du projet).

## Étape 2 — Déployer sur Vercel (une fois, ~10 min)

1. Aller sur **https://vercel.com** → **Sign Up** avec ton compte **GitHub** (Pacousstar).
2. Cliquer **Add New… → Project**.
3. **Import Git Repository** → sélectionner `racines-genealogie` (le dépôt privé).
4. Vercel détecte **Next.js** automatiquement → cliquer **Deploy**.
5. En ~2 minutes tu obtiens l'adresse : `racines-genealogie.vercel.app`.

➡️ C'est cette adresse qu'on donne à ton père.

## Étape 3 — Brancher la base de données (Supabase, gratuit)

1. **https://supabase.com** → Sign Up → **New project** (région : proche de la Côte d'Ivoire si possible, ex. Europe).
2. Dans l'éditeur SQL (**SQL Editor**), coller le contenu de `supabase/schema.sql` puis **Run**.
   (Ensuite `supabase/seed_exemple.sql` pour tester avec des données d'exemple.)
3. Dans **Project Settings → API** : copier `Project URL` et `anon public key`.
4. Retour sur **Vercel → Project → Settings → Environment Variables**, ajouter :
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_ANON_KEY` = anon public key
5. **Redeploy** (Vercel le propose automatiquement après chaque `git push`).

## Étape 4 — Chaque mise à jour, automatiquement

- On travaille en local → on **pousse sur GitHub** (`git push`) → **Vercel redéploie tout seul**.
- Le père n'a rien à faire : il rouvre juste son lien.

## Étape 5 — Donner l'accès au CHO

- Lui envoyer : l'adresse `racines-genealogie.vercel.app` + son identifiant de connexion.
- Le lien fonctionne sur téléphone (bouton "Ajouter à l'écran d'accueil" pour un usage type app).

---

## Règles importantes

- **Ne jamais** commiter `SUPABASE_URL` / `SUPABASE_ANON_KEY` dans le code : uniquement
  dans les variables d'environnement Vercel (et dans un fichier `.env.local` local, non commité).
- Dépôt **privé** : les données généalogiques de personnes vivantes restent protégées.
- Le compte Vercel personnel : seuls toi (et qui tu invites) peuvent voir le projet.
