-- Rang des unions : ordre des unions d'une même personne.
-- Le premier conjoint déclaré (rang le plus petit) est le « conjoint principal »
-- affiché en couple dans l'arbre ; les suivants sont des conjoints secondaires.
ALTER TABLE public.unions ADD COLUMN IF NOT EXISTS rang INT;