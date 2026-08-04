-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Photos visibles par tous les membres connectés
-- À exécuter dans le SQL Editor de Supabase (une seule fois).
-- Le bucket « photos » est privé : l'écriture reste réservée aux éditeurs,
-- mais la lecture est ouverte à tout membre authentifié (sinon les photos
-- apparaissent cassées pour les lecteurs).
-- =====================================================================

CREATE POLICY "photos_lecteur_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'photos' AND auth.role() = 'authenticated');