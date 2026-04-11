-- Colle dans Supabase > SQL Editor > New query > Run
-- Nettoie les "Annonce" importés comme placeholder

UPDATE logements
SET lien_annonce = NULL
WHERE lien_annonce IS NOT NULL
  AND lien_annonce NOT LIKE 'http%';

-- Vérifie le résultat :
SELECT ile, periode, lien_annonce FROM logements ORDER BY id;
