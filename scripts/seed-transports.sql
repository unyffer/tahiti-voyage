-- Colle ce SQL dans Supabase > SQL Editor > New query > Run
-- Il ajoute les données de transport dans la table activites

INSERT INTO activites (ile, categorie, nom, prix, lien, commentaire, gratuit, statut) VALUES
  ('Tahiti',     'transport', 'Vol Paris → Papeete (ATN)',          6000, NULL, 'Aller-retour · 3 personnes', false, 'paye'),
  ('Tahiti',     'transport', 'Pass inter-îles haute saison',       1860, NULL, '585€/pers · Papeete → Tahaa → Maupiti → Bora → Papeete · Attention horaires mouvants', false, 'paye'),
  ('Tahiti',     'transport', 'Ferry Tahiti → Moorea',               96,  NULL, '32€/pers · payé par Régis', false, 'paye'),
  ('Maupiti',    'transport', 'Maupiti Express (Bora ↔ Maupiti)',    50,  NULL, 'Départ Bora le mardi, retour le jeudi', false, 'a_faire'),
  ('Tahiti',     'transport', 'Voiture Papeete Faaa (3 jours)',      180, NULL, '~50€/j · début de séjour Tahiti', false, 'a_faire'),
  ('Moorea',     'transport', 'Voiture Moorea (10 jours)',           550, NULL, 'Location au port', false, 'a_faire'),
  ('Bora Bora',  'transport', 'Voiture Bora Bora (4 jours)',         285, NULL, 'AVIS · 25-29/09 · à confirmer', false, 'a_faire'),
  ('Tahiti',     'transport', 'Voiture Tahiti fin (3 jours)',        339, NULL, 'Fin de séjour', false, 'a_faire'),
  ('Moorea',     'transport', 'Taxi Moorea',                          25, NULL, NULL, false, 'a_faire')
ON CONFLICT (ile, nom) DO NOTHING;
