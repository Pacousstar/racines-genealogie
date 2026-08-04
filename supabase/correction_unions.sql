-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Correction des données de démo
-- À exécuter dans le SQL Editor de Supabase (une seule fois).
-- Corrige l'incohérence : Aya GBEYA était déclarée épouse de Léon (1960),
-- mère de Tahidi Denis ET épouse de Tahidi Denis (1992) en même temps.
-- Résultat : Aya est l'épouse de Tahidi Denis et la mère de Marc Aurèle ;
-- Léon a pour épouse la « Mère de Tahidi » (inconnue).
-- =====================================================================

-- ── 1. Supprimer l'union erronée Léon ⚭ Aya (vers 1960)
DELETE FROM unions
WHERE id IN (
    SELECT u.id
    FROM unions u
    JOIN personnes a ON a.id = u.conjoint_1
    JOIN personnes b ON b.id = u.conjoint_2
    WHERE (a.prenom = 'Léon' AND a.nom = 'DIHI' AND b.prenom = 'Aya' AND b.nom = 'GBEYA')
       OR (b.prenom = 'Léon' AND b.nom = 'DIHI' AND a.prenom = 'Aya' AND a.nom = 'GBEYA')
);

-- ── 2. Supprimer le lien erroné Aya → Tahidi Denis (mère)
DELETE FROM enfants
WHERE id IN (
    SELECT e.id
    FROM enfants e
    JOIN personnes p ON p.id = e.parent_id
    JOIN personnes f ON f.id = e.enfant_id
    WHERE p.nom = 'GBEYA'
      AND f.prenom = 'Tahidi Denis' AND f.nom = 'DIHI'
);

-- ── 3. Créer la « Mère de Tahidi » si absente
INSERT INTO personnes (nom, prenom, sexe, vivant, est_ancetre, fiabilite, source)
SELECT 'INCONNUE', 'Mère de Tahidi', 'F', FALSE, FALSE, 'incertain', 'Témoignage oral'
WHERE NOT EXISTS (
    SELECT 1 FROM personnes WHERE prenom = 'Mère de Tahidi' AND nom = 'INCONNUE'
);

-- ── 4. Union Léon ⚭ Mère de Tahidi
INSERT INTO unions (conjoint_1, conjoint_2, date_union)
SELECT l.id, m.id, 'vers 1960'
FROM personnes l, personnes m
WHERE l.prenom = 'Léon' AND l.nom = 'DIHI'
  AND m.prenom = 'Mère de Tahidi' AND m.nom = 'INCONNUE'
ON CONFLICT DO NOTHING;

-- ── 5. Lien Mère de Tahidi → Tahidi Denis
INSERT INTO enfants (parent_id, enfant_id, rang)
SELECT m.id, t.id, 1
FROM personnes m, personnes t
WHERE m.prenom = 'Mère de Tahidi' AND m.nom = 'INCONNUE'
  AND t.prenom = 'Tahidi Denis' AND t.nom = 'DIHI'
ON CONFLICT DO NOTHING;

-- ── 6. Lien Aya → Marc Aurèle (mère), s'il manque
INSERT INTO enfants (parent_id, enfant_id, rang)
SELECT a.id, m.id, 1
FROM personnes a, personnes m
WHERE a.prenom = 'Aya' AND a.nom = 'GBEYA'
  AND m.prenom = 'Marc Aurèle' AND m.nom = 'DIHI'
ON CONFLICT DO NOTHING;
