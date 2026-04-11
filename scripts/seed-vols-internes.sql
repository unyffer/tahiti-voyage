-- Supabase > SQL Editor > New query > Run
-- Ajoute les vols internes Air Tahiti détaillés

-- Vol Paris-Papeete (chacun a payé sa part)
INSERT INTO paiements_autres (description, total, par_personne, reste_par_personne, situation)
VALUES ('Vol Paris ↔ Papeete (ATN)', 6000, 2000, 0, 'Payé par chacun (2 000 € / pers)')
ON CONFLICT (description) DO NOTHING;

-- Vols internes dans la table activites avec détail
INSERT INTO activites (ile, categorie, nom, prix, commentaire, gratuit, statut) VALUES
  ('Moorea',    'transport', 'VT211 · Moorea → Raiatea',              NULL, '10:50 → 11:35 · 14 sept. 2026 · Classe Y', false, 'paye'),
  ('Tahaa',     'transport', 'VT730 · Raiatea → Maupiti',             NULL, '13:30 → 13:55 · 19 sept. 2026 · Classe Y', false, 'paye'),
  ('Maupiti',   'transport', 'VT736 · Maupiti → Raiatea',             NULL, '09:20 → 09:45 · 22 sept. 2026 · Classe Y', false, 'paye'),
  ('Bora Bora', 'transport', 'VT420 · Raiatea → Bora Bora',           NULL, '18:30 → 18:50 · 22 sept. 2026 · Classe Y', false, 'paye'),
  ('Tahiti',    'transport', 'VT462 · Bora Bora → Tahiti (Faaa)',     NULL, '08:00 → 08:50 · 29 sept. 2026 · Classe Y', false, 'paye')
ON CONFLICT (ile, nom) DO NOTHING;
