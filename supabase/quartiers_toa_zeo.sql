-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Vrais quartiers de Toa-Zéo
-- À exécuter dans Supabase → SQL Editor (ou `node scripts/inserer-quartiers.mjs`)
-- Ordre de lecture = ordre d'affichage (colonne « ordre »).
-- =====================================================================

INSERT INTO quartiers (nom, ordre) VALUES
    ('Gaho',         1),
    ('Bogné',        2),
    ('Bogné-Zagna',  3),
    ('Gbéha',        4),
    ('Zouahé',       5)
ON CONFLICT (nom) DO NOTHING;

-- Re-numérote proprement si des entrées ont été ajoutées dans l'app
-- (met Gaho en premier, préserve les nouveaux après) :
-- UPDATE quartiers SET ordre = ordinal  FROM (SELECT id, row_number() OVER () AS ordinal
--     FROM (SELECT id FROM quartiers ORDER BY CASE nom WHEN 'Gaho' THEN 1 WHEN 'Bogné' THEN 2
--           WHEN 'Bogné-Zagna' THEN 3 WHEN 'Gbéha' THEN 4 WHEN 'Zouahé' THEN 5 ELSE 99 END, nom)) s
-- WHERE quartiers.id = s.id;