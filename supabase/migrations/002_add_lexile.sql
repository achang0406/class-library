-- Lexile score from Open Library (numeric; BR books stored as negative values)

ALTER TABLE books ADD COLUMN IF NOT EXISTS lexile int;

CREATE INDEX IF NOT EXISTS books_lexile_idx ON books (lexile) WHERE lexile IS NOT NULL;
CREATE INDEX IF NOT EXISTS books_reading_level_idx ON books (reading_level) WHERE reading_level IS NOT NULL;

COMMENT ON COLUMN books.lexile IS 'Lexile measure (L). Below-zero values represent BR scores, e.g. -160 = BR160L.';
COMMENT ON COLUMN books.reading_level IS 'K-12 grade band derived from lexile typical student ranges; may be set manually.';
