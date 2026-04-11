-- Supabase > SQL Editor > New query > Run
-- Ajoute le champ "personne" à la checklist (Commun / Régis / Isa / Agathe)

ALTER TABLE checklist ADD COLUMN IF NOT EXISTS personne TEXT DEFAULT 'Commun';

-- Tous les items existants passent en "Commun"
UPDATE checklist SET personne = 'Commun' WHERE personne IS NULL;
