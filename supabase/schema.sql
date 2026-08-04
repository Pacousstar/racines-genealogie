-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Schéma PostgreSQL (compatible Supabase) + SÉCURITÉ
-- Source d'autorité de l'arbre du village — piloté par le CHO
-- =====================================================================

-- =====================================================================
-- 0. SÉCURITÉ : PROFILS / RÔLES
---------------------------------------------------------------------
-- rôles :
--   'admin'   → gestion des comptes + tout (le fils, l'opérateur technique)
--   'editeur' → le CHO : lecture + écriture de la généalogie
--   'lecteur' → membres : lecture seule
-- =====================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role              TEXT NOT NULL DEFAULT 'lecteur'
                      CHECK (role IN ('admin','editeur','lecteur')),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- À l'inscription, tout nouveau compte = lecteur (aucun privilège par défaut)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'lecteur')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper : l'utilisateur a-t-il un rôle éditeur/admin ?
CREATE OR REPLACE FUNCTION public.is_editeur()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('editeur','admin')
    );
$$;

-- Helper : l'utilisateur est-il admin ?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- =====================================================================
-- 1. QUARTIERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS quartiers (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom     TEXT NOT NULL UNIQUE,
    ordre   INT  DEFAULT 0,
    note    TEXT
);

-- =====================================================================
-- 2. FAMILLES
-- =====================================================================
CREATE TABLE IF NOT EXISTS familles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quartier_id UUID REFERENCES quartiers(id) ON DELETE CASCADE,
    nom         TEXT NOT NULL,
    note        TEXT,
    UNIQUE (quartier_id, nom)
);

-- =====================================================================
-- 3. PERSONNES
-- =====================================================================
CREATE TABLE IF NOT EXISTS personnes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom              TEXT NOT NULL,
    prenom           TEXT,
    surnom           TEXT,
    sexe             TEXT CHECK (sexe IN ('M','F') OR sexe IS NULL),
    date_naissance   TEXT,
    date_deces       TEXT,
    lieu_naissance   TEXT,
    lieu_deces       TEXT,
    vivant           BOOLEAN DEFAULT TRUE,
    quartier_id      UUID REFERENCES quartiers(id) ON DELETE SET NULL,
    famille_id       UUID REFERENCES familles(id)   ON DELETE SET NULL,
    photo_url        TEXT,
    retraite         BOOLEAN DEFAULT FALSE,
    residence        TEXT,
    crise_2010_2011  BOOLEAN DEFAULT FALSE,
    est_ancetre      BOOLEAN DEFAULT FALSE,
    est_fondateur    BOOLEAN DEFAULT FALSE,
    biographie       TEXT,
    source           TEXT,
    fiabilite        TEXT DEFAULT 'en cours' CHECK (fiabilite IN ('confirmé','probable','en cours')),
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. UNIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS unions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conjoint_1  UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    conjoint_2  UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    type        TEXT DEFAULT 'mariage' CHECK (type IN ('mariage','union libre')),
    date_union  TEXT,
    lieu        TEXT,
    UNIQUE (conjoint_1, conjoint_2)
);

-- =====================================================================
-- 5. ENFANTS (liens parent → enfant)
-- =====================================================================
CREATE TABLE IF NOT EXISTS enfants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    enfant_id   UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    rang        INT,
    type_lien   TEXT DEFAULT 'biologique' CHECK (type_lien IN ('biologique','adoptif','incertain')),
    UNIQUE (parent_id, enfant_id)
);

-- =====================================================================
-- Index
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_personnes_nom      ON personnes (nom);
CREATE INDEX IF NOT EXISTS idx_personnes_quartier ON personnes (quartier_id);
CREATE INDEX IF NOT EXISTS idx_personnes_famille  ON personnes (famille_id);
CREATE INDEX IF NOT EXISTS idx_enfants_enfant     ON enfants (enfant_id);
CREATE INDEX IF NOT EXISTS idx_enfants_parent     ON enfants (parent_id);
CREATE INDEX IF NOT EXISTS idx_unions_conjoint    ON unions (conjoint_1, conjoint_2);

-- =====================================================================
-- Trigger updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_personnes_updated ON personnes;
CREATE TRIGGER trg_personnes_updated
    BEFORE UPDATE ON personnes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- 6. RLS — ROW LEVEL SECURITY (la sécurité la plus importante)
-- Principe : LECTURE pour tout connecté ; ÉCRITURE seulement édition/admin.
-- =====================================================================

ALTER TABLE public.quartiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.familles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enfants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;

-- Quartiers : lecture pour tout connecté, écriture éditeur/admin
CREATE POLICY "quartiers_select"  ON public.quartiers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quartiers_write"   ON public.quartiers FOR ALL USING (public.is_editeur());
CREATE POLICY "quartiers_insert"  ON public.quartiers FOR INSERT WITH CHECK (public.is_editeur());

-- Familles : idem
CREATE POLICY "familles_select"   ON public.familles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "familles_write"    ON public.familles FOR ALL USING (public.is_editeur());
CREATE POLICY "familles_insert"   ON public.familles FOR INSERT WITH CHECK (public.is_editeur());

-- Personnes : idem
CREATE POLICY "personnes_select"  ON public.personnes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "personnes_write"   ON public.personnes FOR ALL USING (public.is_editeur());
CREATE POLICY "personnes_insert"  ON public.personnes FOR INSERT WITH CHECK (public.is_editeur());

-- Unions : idem
CREATE POLICY "unions_select"     ON public.unions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "unions_write"      ON public.unions FOR ALL USING (public.is_editeur());
CREATE POLICY "unions_insert"     ON public.unions FOR INSERT WITH CHECK (public.is_editeur());

-- Enfants : idem
CREATE POLICY "enfants_select"    ON public.enfants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "enfants_write"     ON public.enfants FOR ALL USING (public.is_editeur());
CREATE POLICY "enfants_insert"    ON public.enfants FOR INSERT WITH CHECK (public.is_editeur());

-- Profiles : chacun lit SONT role ; admin lit tout ; écriture admin only
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update"      ON public.profiles FOR UPDATE USING (public.is_admin());

-- =====================================================================
-- 7. STOCKAGE PHOTOS (bucket privé « photos »)
-- Les photos sont SERVIES via l'API (signées côté serveur), jamais publiques.
-- =====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Lecture fiche technique : éditeur/admin gère ; le reste est servi via API service role
CREATE POLICY "photos_editeur_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'photos' AND public.is_editeur());
CREATE POLICY "photos_editeur_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos' AND public.is_editeur());
CREATE POLICY "photos_editeur_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'photos' AND public.is_editeur());
CREATE POLICY "photos_editeur_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'photos' AND public.is_editeur());

-- =====================================================================
-- 8. VUE — arbre complet (personne + infos lien)
-- =====================================================================
CREATE OR REPLACE VIEW v_arbre AS
SELECT
    p.id,
    p.nom,
    p.prenom,
    p.surnom,
    p.sexe,
    p.date_naissance,
    p.date_deces,
    p.vivant,
    p.photo_url,
    p.est_ancetre,
    p.est_fondateur,
    p.fiabilite,
    q.nom AS quartier,
    f.nom AS famille
FROM public.personnes p
LEFT JOIN public.quartiers q ON q.id = p.quartier_id
LEFT JOIN public.familles  f ON f.id  = p.famille_id;