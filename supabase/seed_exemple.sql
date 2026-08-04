-- =====================================================================
-- GÉNÉALOGIE TOA-ZÉO — Seed d'exemple (démo)
-- Quartiers + familles + quelques personnes pour tester l'arbre
-- =====================================================================

-- ── 1. Quartiers de Toa-Zéo (mêmes noms que Racines+)
INSERT INTO quartiers (nom, ordre) VALUES
    ('Quartier Centre',     1),
    ('Quartier Nord',       2),
    ('Quartier Sud',        3),
    ('Quartier Est',        4),
    ('Quartier Fondateurs', 5),
    ('Gbéya',               6),
    ('Bonyé',               7)
ON CONFLICT (nom) DO NOTHING;

-- ── 2. Familles (exemples)
INSERT INTO familles (quartier_id, nom) VALUES
    ((SELECT id FROM quartiers WHERE nom = 'Quartier Fondateurs'), 'Famille DIHI'),
    ((SELECT id FROM quartiers WHERE nom = 'Quartier Fondateurs'), 'Famille KOFFI'),
    ((SELECT id FROM quartiers WHERE nom = 'Gbéya'),               'Famille GBEYA')
ON CONFLICT (quartier_id, nom) DO NOTHING;

-- ── 3. Personnes (générations, du fondateur vers les vivants)
INSERT INTO personnes
    (nom, prenom, sexe, date_naissance, date_deces, vivant, quartier_id, famille_id,
     est_ancetre, fiabilite, source)
VALUES
    -- Ancêtre fondateur du village
    ('TOA-ZEO', 'Zaïé', 'M', 'vers 1700', 'vers 1760', FALSE,
     (SELECT id FROM quartiers WHERE nom = 'Quartier Fondateurs'),
     NULL, TRUE, 'confirmé', 'Témoignage oral transmis par les anciens'),

    -- Ses fils (fondateurs de quartiers)
    ('KOUASSI', 'Nguessan', 'M', 'vers 1730', 'vers 1800', FALSE,
     (SELECT id FROM quartiers WHERE nom = 'Quartier Fondateurs'),
     (SELECT id FROM familles WHERE nom = 'Famille DIHI'),
     FALSE, 'confirmé', 'Tableau généalogique du CHO'),

    -- Génération intermédiaire
    ('DIHI', 'Kouamé', 'M', 'vers 1810', 'vers 1895', FALSE,
     (SELECT id FROM quartiers WHERE nom = 'Quartier Fondateurs'),
     (SELECT id FROM familles WHERE nom = 'Famille DIHI'),
     FALSE, 'confirmé', 'Tableau généalogique du CHO'),

    -- Grands-parents (déclaratifs)
    ('DIHI', 'Gbaya', 'M', 'vers 1890', '1971', FALSE,
     (SELECT id FROM quartiers WHERE nom = 'Quartier Fondateurs'),
     (SELECT id FROM familles WHERE nom = 'Famille DIHI'),
     FALSE, 'confirmé', 'Témoin oral'),

    -- Parents
    ('DIHI', 'Léon', 'M', '1935', '2010', FALSE,
     (SELECT id FROM quartiers WHERE nom = 'Quartier Centre'),
     (SELECT id FROM familles WHERE nom = 'Famille DIHI'),
     FALSE, 'confirmé', 'Registre de la mission'),

    -- Le CHO lui-même
    ('DIHI', 'Tahidi Denis', 'M', '1965', NULL, TRUE,
     (SELECT id FROM quartiers WHERE nom = 'Quartier Centre'),
     (SELECT id FROM familles WHERE nom = 'Famille DIHI'),
     FALSE, 'confirmé', 'Lui-même'),

    -- Mère de Tahidi Denis, arrivée par mariage
    ('INCONNUE', 'Mère de Tahidi', 'F', NULL, NULL, FALSE,
     NULL, NULL,
     FALSE, 'incertain', 'Témoignage oral'),

    -- Génération vivante (enfant)
    ('DIHI', 'Marc Aurèle', 'M', '1995', NULL, TRUE,
     (SELECT id FROM quartiers WHERE nom = 'Quartier Centre'),
     (SELECT id FROM familles WHERE nom = 'Famille DIHI'),
     FALSE, 'confirmé', 'Déclaré par son père'),

    -- Épouse entrée par mariage (autre famille, pas souche du quartier)
    ('GBEYA', 'Aya', 'F', '1970', NULL, TRUE,
     (SELECT id FROM quartiers WHERE nom = 'Gbéya'),
     (SELECT id FROM familles WHERE nom = 'Famille GBEYA'),
     FALSE, 'confirmé', 'Déclarée par son époux')
ON CONFLICT DO NOTHING;

-- ── 4. Unions
INSERT INTO unions (conjoint_1, conjoint_2, date_union) VALUES
    ((SELECT id FROM personnes WHERE prenom = 'Léon'          AND nom = 'DIHI'),
     (SELECT id FROM personnes WHERE prenom = 'Mère de Tahidi' AND nom = 'INCONNUE'),
     'vers 1960'),
    ((SELECT id FROM personnes WHERE prenom = 'Tahidi Denis' AND nom = 'DIHI'),
     (SELECT id FROM personnes WHERE prenom = 'Aya'          AND nom = 'GBEYA'),
     '1992')
ON CONFLICT DO NOTHING;

-- ── 5. Liens parent → enfant
INSERT INTO enfants (parent_id, enfant_id, rang) VALUES
    -- Zaïé (ancêtre) → Nguessan
    ((SELECT id FROM personnes WHERE prenom = 'Zaïé'   AND nom = 'TOA-ZEO'),  (SELECT id FROM personnes WHERE prenom = 'Nguessan' AND nom = 'KOUASSI'), 1),
    -- Nguessan → Kouamé
    ((SELECT id FROM personnes WHERE prenom = 'Nguessan' AND nom = 'KOUASSI'), (SELECT id FROM personnes WHERE prenom = 'Kouamé'   AND nom = 'DIHI'),     1),
    -- Kouamé → Gbaya
    ((SELECT id FROM personnes WHERE prenom = 'Kouamé'   AND nom = 'DIHI'),    (SELECT id FROM personnes WHERE prenom = 'Gbaya'    AND nom = 'DIHI'),     1),
    -- Gbaya → Léon
    ((SELECT id FROM personnes WHERE prenom = 'Gbaya'    AND nom = 'DIHI'),    (SELECT id FROM personnes WHERE prenom = 'Léon'     AND nom = 'DIHI'),     1),
    -- Léon + Mère de Tahidi → Tahidi Denis
    ((SELECT id FROM personnes WHERE prenom = 'Léon'     AND nom = 'DIHI'),    (SELECT id FROM personnes WHERE prenom = 'Tahidi Denis' AND nom = 'DIHI'), 1),
    ((SELECT id FROM personnes WHERE prenom = 'Mère de Tahidi' AND nom = 'INCONNUE'), (SELECT id FROM personnes WHERE prenom = 'Tahidi Denis' AND nom = 'DIHI'), 1),
    -- Tahidi Denis + Aya → Marc Aurèle
    ((SELECT id FROM personnes WHERE prenom = 'Tahidi Denis' AND nom = 'DIHI'),(SELECT id FROM personnes WHERE prenom = 'Marc Aurèle' AND nom = 'DIHI'), 1),
    ((SELECT id FROM personnes WHERE prenom = 'Aya'      AND nom = 'GBEYA'),   (SELECT id FROM personnes WHERE prenom = 'Marc Aurèle' AND nom = 'DIHI'), 1)
ON CONFLICT DO NOTHING;
