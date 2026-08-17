-- ═══════════════════════════════════════════════════════════════════
-- Journal du voyage — SQL Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────
-- 1. POSTS DU JOURNAL
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Auteur (identifié par localStorage côté client)
  auteur        TEXT        NOT NULL CHECK (auteur IN ('Régis', 'Isa', 'Agathe')),

  -- Contenu
  texte         TEXT,
  date_voyage   DATE        NOT NULL DEFAULT CURRENT_DATE,

  -- Localisation
  ile           TEXT,          -- slug : tahiti, moorea, tahaa, maupiti, bora-bora
  lieu          TEXT,          -- lieu libre ex: "Plage de Matira"
  lat           FLOAT8,        -- latitude GPS
  lng           FLOAT8,        -- longitude GPS

  -- Météo au moment de la publication (Open-Meteo, stockée historiquement)
  meteo_temp    INT,           -- température en °C
  meteo_code    INT,           -- WMO weather code
  meteo_emoji   TEXT,          -- ☀️ 🌧️ etc.

  -- Lien optionnel vers une activité
  activite_id   INT REFERENCES activites(id) ON DELETE SET NULL,

  -- Ordre d'affichage à même date
  sort_order    INT DEFAULT 0,

  -- Extensible (futur : humeur, tags, etc.)
  metadata      JSONB DEFAULT '{}'
);

-- ───────────────────────────────────────────
-- 2. PHOTOS ATTACHÉES AUX POSTS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  post_id        UUID NOT NULL REFERENCES journal_posts(id) ON DELETE CASCADE,

  -- Chemins dans le bucket "journal" (ex: Régis/2026-09-06/uuid.webp)
  storage_path   TEXT NOT NULL,
  thumb_path     TEXT,          -- miniature 600px

  -- Dimensions (utile pour éviter le layout shift)
  width          INT,
  height         INT,
  taille_ko      INT,           -- taille après compression (monitoring)

  -- Ordre dans le carousel
  sort_order     INT DEFAULT 0
);

-- ───────────────────────────────────────────
-- 3. COMMENTAIRES
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  post_id     UUID NOT NULL REFERENCES journal_posts(id) ON DELETE CASCADE,
  auteur      TEXT NOT NULL CHECK (auteur IN ('Régis', 'Isa', 'Agathe')),
  texte       TEXT NOT NULL
);

-- ───────────────────────────────────────────
-- 4. LIKES (1 par personne par post)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  post_id     UUID NOT NULL REFERENCES journal_posts(id) ON DELETE CASCADE,
  auteur      TEXT NOT NULL CHECK (auteur IN ('Régis', 'Isa', 'Agathe')),
  UNIQUE (post_id, auteur)
);

-- ───────────────────────────────────────────
-- 5. TRACÉ DES DÉPLACEMENTS
--    Positions GPS enregistrées manuellement
--    (ou automatiquement à chaque post)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_tracks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  auteur      TEXT NOT NULL CHECK (auteur IN ('Régis', 'Isa', 'Agathe')),
  lat         FLOAT8 NOT NULL,
  lng         FLOAT8 NOT NULL,
  ile         TEXT,
  note        TEXT           -- optionnel ex: "Arrivée aéroport Faaa"
);

-- ───────────────────────────────────────────
-- 6. INDEX PERFORMANCES
-- ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journal_posts_date    ON journal_posts (date_voyage DESC, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_journal_posts_ile     ON journal_posts (ile);
CREATE INDEX IF NOT EXISTS idx_journal_posts_coords  ON journal_posts (lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_photos_post   ON journal_photos (post_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_journal_comments_post ON journal_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_journal_likes_post    ON journal_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_journal_tracks_date   ON journal_tracks (created_at ASC);

-- ───────────────────────────────────────────
-- 7. STORAGE BUCKET + POLICIES
--    À exécuter séparément si les buckets 
--    ne s'appliquent pas via SQL standard.
--    Alternative : Supabase Dashboard → Storage → New Bucket
-- ───────────────────────────────────────────

-- Créer le bucket "journal" (public = les URLs sont publiques sans token)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal',
  'journal',
  true,
  52428800,  -- 50 MB max par fichier (on compresse avant, donc jamais atteint)
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Politique : tout le monde peut lire (bucket public de toute façon)
CREATE POLICY "journal_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'journal');

-- Politique : insert autorisé (notre auth est par cookie, pas Supabase Auth)
CREATE POLICY "journal_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'journal');

-- Politique : delete autorisé (pour supprimer les photos avec un post)
CREATE POLICY "journal_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'journal');
