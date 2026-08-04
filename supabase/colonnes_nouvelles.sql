-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Nouvelles colonnes personne
-- (retraite, résidence, décès durant la crise 2010-2011)
-- À exécuter dans Supabase → SQL Editor, puis « Run ».
-- S'exécute sans risque plusieurs fois (IF NOT EXISTS).
-- =====================================================================

ALTER TABLE public.personnes
    ADD COLUMN IF NOT EXISTS retraite         BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS residence        TEXT,
    ADD COLUMN IF NOT EXISTS crise_2010_2011  BOOLEAN DEFAULT FALSE;