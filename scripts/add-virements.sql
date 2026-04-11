-- Colle dans Supabase > SQL Editor > New query > Run
-- Crée la table des virements déjà effectués entre vous

CREATE TABLE IF NOT EXISTS virements (
  id BIGSERIAL PRIMARY KEY,
  de TEXT NOT NULL,       -- qui a payé (Régis / Isa / Agathe)
  vers TEXT NOT NULL,     -- qui a reçu
  montant NUMERIC(10,2) NOT NULL,
  date_virement TEXT,
  note TEXT
);

ALTER TABLE virements DISABLE ROW LEVEL SECURITY;
