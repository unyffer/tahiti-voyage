-- ================================================================
-- SCHEMA SUPABASE - Voyage Tahiti 2026
-- Copie-colle ce fichier entier dans l'éditeur SQL de Supabase
-- (menu "SQL Editor" → "New query" → coller → clic "Run")
-- ================================================================

-- Table 1 : Planning / Itinéraire
CREATE TABLE IF NOT EXISTS planning (
  id BIGSERIAL PRIMARY KEY,
  lieu TEXT NOT NULL,
  nuits INTEGER,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  type TEXT CHECK (type IN ('aller', 'sejour', 'retour')) DEFAULT 'sejour',
  notes TEXT,
  UNIQUE (lieu, date_debut)
);

-- Table 2 : Logements (infos pratiques par île)
CREATE TABLE IF NOT EXISTS logements (
  id BIGSERIAL PRIMARY KEY,
  ile TEXT NOT NULL,
  periode TEXT NOT NULL,
  lien_annonce TEXT,
  commentaires TEXT,
  questions TEXT,
  UNIQUE (ile, periode)
);

-- Table 3 : Paiements des logements (par personne)
CREATE TABLE IF NOT EXISTS paiements_logements (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL UNIQUE,
  regis NUMERIC(10,2),
  isa NUMERIC(10,2),
  agathe NUMERIC(10,2),
  total NUMERIC(10,2),
  date_echeance TEXT,
  reste_a_payer NUMERIC(10,2),
  lien_reservation TEXT
);

-- Table 4 : Paiements hors logements (activités, transports, etc.)
CREATE TABLE IF NOT EXISTS paiements_autres (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL UNIQUE,
  total NUMERIC(10,2),
  par_personne NUMERIC(10,2),
  reste_par_personne NUMERIC(10,2),
  situation TEXT
);

-- Table 5 : Activités par île
CREATE TABLE IF NOT EXISTS activites (
  id BIGSERIAL PRIMARY KEY,
  ile TEXT NOT NULL,
  categorie TEXT CHECK (categorie IN ('activite', 'bouffe', 'transport')) DEFAULT 'activite',
  nom TEXT NOT NULL,
  prix NUMERIC(10,2),
  lien TEXT,
  commentaire TEXT,
  gratuit BOOLEAN DEFAULT FALSE,
  statut TEXT CHECK (statut IN ('a_faire', 'reserve', 'paye')) DEFAULT 'a_faire',
  UNIQUE (ile, nom)
);

-- Table 6 : Checklist à emporter
CREATE TABLE IF NOT EXISTS checklist (
  id BIGSERIAL PRIMARY KEY,
  item TEXT NOT NULL UNIQUE,
  categorie TEXT NOT NULL DEFAULT 'Divers',
  checked BOOLEAN DEFAULT FALSE
);

-- Table 7 : Voitures de location
CREATE TABLE IF NOT EXISTS voitures (
  id BIGSERIAL PRIMARY KEY,
  ile TEXT NOT NULL,
  periode TEXT,
  agence TEXT,
  statut TEXT,
  commentaire TEXT,
  prix NUMERIC(10,2),
  UNIQUE (ile, periode)
);

-- ================================================================
-- Désactiver la sécurité RLS pour usage privé (3 utilisateurs)
-- ================================================================
ALTER TABLE planning DISABLE ROW LEVEL SECURITY;
ALTER TABLE logements DISABLE ROW LEVEL SECURITY;
ALTER TABLE paiements_logements DISABLE ROW LEVEL SECURITY;
ALTER TABLE paiements_autres DISABLE ROW LEVEL SECURITY;
ALTER TABLE activites DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist DISABLE ROW LEVEL SECURITY;
ALTER TABLE voitures DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- Vérification : affiche les tables créées
-- ================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
