-- =============================================================
-- Enrichissement Racines+ — à exécuter dans l'éditeur SQL Supabase
-- 1) Nouvelles colonnes sur personnes (profession, religion)
-- 2) Table journal des changements + politiques RLS
-- =============================================================

-- 1) Colonnes complémentaires (relancables sans erreur)
ALTER TABLE personnes ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE personnes ADD COLUMN IF NOT EXISTS religion text;

-- 2) Journal des changements
CREATE TABLE IF NOT EXISTS journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  cible_type text NOT NULL,
  cible_id uuid,
  detail jsonb,
  cree_par uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  cree_le timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_cible_idx ON journal (cible_id, cree_le DESC);
CREATE INDEX IF NOT EXISTS journal_date_idx ON journal (cree_le DESC);

ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_select_authentifie" ON journal
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "journal_insert_authentifie" ON journal
  FOR INSERT TO authenticated WITH CHECK (true);