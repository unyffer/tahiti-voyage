-- ================================================================
-- MIGRATION : Nouveaux champs activités (date_heure, lieu, contact)
-- Colle ce fichier dans Supabase > SQL Editor > New query > Run
-- ================================================================

-- 1. Ajout des colonnes
ALTER TABLE activites ADD COLUMN IF NOT EXISTS date_heure TEXT;
ALTER TABLE activites ADD COLUMN IF NOT EXISTS lieu       TEXT;
ALTER TABLE activites ADD COLUMN IF NOT EXISTS contact    TEXT;

-- ================================================================
-- 2. Pré-remplissage depuis les données existantes (commentaires)
-- ================================================================

-- Vols internes Air Tahiti
-- Commentaires d'origine : "HH:MM → HH:MM · DD mois YYYY · Classe Y"
UPDATE activites SET date_heure = '2026-09-14 10:50'
  WHERE nom = 'VT211 · Moorea → Raiatea';

UPDATE activites SET date_heure = '2026-09-19 13:30'
  WHERE nom = 'VT730 · Raiatea → Maupiti';

UPDATE activites SET date_heure = '2026-09-22 09:20'
  WHERE nom = 'VT736 · Maupiti → Raiatea';

UPDATE activites SET date_heure = '2026-09-22 18:30'
  WHERE nom = 'VT420 · Raiatea → Bora Bora';

UPDATE activites SET date_heure = '2026-09-29 08:00'
  WHERE nom = 'VT462 · Bora Bora → Tahiti (Faaa)';

-- Activités avec date dans le commentaire
-- Baleines Moorea : "Lagoon vibes le 08/09 à 12h30 · 200€/pers"
UPDATE activites
  SET date_heure = '2026-09-08 12:30', lieu = 'Lagoon Vibes'
  WHERE nom = 'Baleines' AND ile = 'Moorea';

-- Activités avec lieu/contact dans le commentaire
-- Raies manta Maupiti : "Pension Téreia · 45€ raies + jardin corail"
UPDATE activites
  SET lieu = 'Pension Téreia', contact = 'Pension Téreia'
  WHERE nom = 'Raies manta' AND ile = 'Maupiti';

-- Kayak Moorea : "À louer à côté, pas de kayak fourni" → lieu évident depuis le nom
UPDATE activites
  SET lieu = 'Tipaniers'
  WHERE nom = 'Kayak + requins + raies (Tipaniers)' AND ile = 'Moorea';

-- Spectacle de danse : "Intercontinental Tahiti ou Moorea Tiki Village"
UPDATE activites
  SET lieu = 'Intercontinental Tahiti ou Moorea Tiki Village'
  WHERE nom = 'Spectacle de danse';

-- Vérification
SELECT id, ile, nom, categorie, statut, date_heure, lieu, contact, commentaire
FROM activites
WHERE date_heure IS NOT NULL OR lieu IS NOT NULL OR contact IS NOT NULL
ORDER BY date_heure NULLS LAST, ile, nom;
