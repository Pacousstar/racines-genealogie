-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Vider toutes les données de test
-- À exécuter dans Supabase → SQL Editor, puis « Run ».
--
-- Attention : supprime TOUTES les personnes, unions, enfants,
-- familles et quartiers. Les comptes (profiles) sont conservés.
-- Les photos déjà téléversées dans le bucket « photos » sont aussi
-- supprimées.
-- =====================================================================

BEGIN;

DELETE FROM public.storage.objects
WHERE bucket_id = 'photos';

DELETE FROM public.enfants;
DELETE FROM public.unions;
DELETE FROM public.personnes;
DELETE FROM public.familles;
DELETE FROM public.quartiers;

COMMIT;