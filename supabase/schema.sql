-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Schéma PostgreSQL (compatible Supabase)
-- Outil du CHO DIHI Tahidi Denis — source d'autorité de l'arbre du village
-- =====================================================================

-- ─────────────────────────────────────────────
-- 1. QUARTIERS  (les quartiers du village Toa-Zéo)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quartiers (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom     TEXT NOT NULL UNIQUE,
    ordre   INT  DEFAULT 0,
    note    TEXT
);

-- ─────────────────────────────────────────────
-- 2. FAMILLES  (lignées souches par quartier)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS familles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quartier_id UUID REFERENCES quartiers(id) ON DELETE CASCADE,
    nom         TEXT NOT NULL,
    note        TEXT,
    UNIQUE (quartier_id, nom)
);

-- ─────────────────────────────────────────────
-- 3. PERSONNES  (les nœuds du tableau)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personnes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom              TEXT NOT NULL,
    prenom           TEXT,
    surnom           TEXT,
    sexe             TEXT CHECK (sexe IN ('M','F') OR sexe IS NULL),
    date_naissance   TEXT,        -- texte libre : « vers 1890 », « 12/03/1945 »
    date_deces       TEXT,
    lieu_naissance   TEXT,
    lieu_deces       TEXT,
    vivant           BOOLEAN DEFAULT TRUE,
    quartier_id      UUID REFERENCES quartiers(id) ON DELETE SET NULL,
    famille_id       UUID REFERENCES familles(id)   ON DELETE SET NULL,
    photo_url        TEXT,        -- vide → initiales en grand caractère
    est_ancetre      BOOLEAN DEFAULT FALSE,   -- racine du village
    est_fondateur    BOOLEAN DEFAULT FALSE,   -- ancêtre d'un quartier
    biographie       TEXT,
    source           TEXT,        -- témoin oral, document, registre…
    fiabilite        TEXT DEFAULT 'en cours' CHECK (fiabilite IN ('confirmé','probable','en cours')),
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. UNIONS  (couples — le nœud où s'accrochent les enfants)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conjoint_1  UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    conjoint_2  UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    type        TEXT DEFAULT 'mariage' CHECK (type IN ('mariage','union libre')),
    date_union  TEXT,
    lieu        TEXT,
    UNIQUE (conjoint_1, conjoint_2)
);

-- ─────────────────────────────────────────────
-- 5. ENFANTS  (liens parent → enfant ; 2 lignes si 2 parents)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enfants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    enfant_id   UUID NOT NULL REFERENCES personnes(id) ON DELETE CASCADE,
    rang        INT,                          -- ordre de naissance
    type_lien   TEXT DEFAULT 'biologique' CHECK (type_lien IN ('biologique','adoptif','incertain')),
    UNIQUE (parent_id, enfant_id)
);

-- ─────────────────────────────────────────────
-- Index utiles
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_personnes_nom      ON personnes (nom);
CREATE INDEX IF NOT EXISTS idx_personnes_quartier ON personnes (quartier_id);
CREATE INDEX IF NOT EXISTS idx_personnes_famille  ON personnes (famille_id);
CREATE INDEX IF NOT EXISTS idx_enfants_enfant     ON enfants (enfant_id);
CREATE INDEX IF NOT EXISTS idx_unions_conjoint    ON unions (conjoint_1, conjoint_2);

-- ─────────────────────────────────────────────
-- Trigger : updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_personnes_updated ON personnes;
CREATE TRIGGER trg_personnes_updated
    BEFORE UPDATE ON personnes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
