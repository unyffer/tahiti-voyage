-- Colle ce SQL dans Supabase > SQL Editor > New query > Run

-- Étape 1 : ajouter la colonne sort_order
ALTER TABLE planning ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Étape 2 : vider et réinsérer avec les bons ordres
TRUNCATE TABLE planning;

INSERT INTO planning (lieu, nuits, date_debut, date_fin, type, notes, sort_order) VALUES
  ('Voyage aller',  NULL, '2026-09-04', '2026-09-04', 'aller',  'Départ 12h05 · Arrivée 21h30', 1),
  ('Tahiti',        3,    '2026-09-04', '2026-09-07', 'sejour', NULL, 2),
  ('Moorea',        7,    '2026-09-07', '2026-09-14', 'sejour', NULL, 3),
  ('Tahaa',         5,    '2026-09-14', '2026-09-19', 'sejour', NULL, 4),
  ('Maupiti',       3,    '2026-09-19', '2026-09-22', 'sejour', NULL, 5),
  ('Bora Bora',     7,    '2026-09-22', '2026-09-29', 'sejour', NULL, 6),
  ('Tahiti',        3,    '2026-09-29', '2026-10-02', 'sejour', NULL, 7),
  ('Voyage retour', NULL, '2026-10-02', '2026-10-04', 'retour', 'Départ 23h45 · Arrivée 9h05', 8);
