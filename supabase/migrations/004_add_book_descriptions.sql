-- Store book descriptions returned from Open Library metadata lookups

ALTER TABLE books ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN books.description IS 'Book description/synopsis from Open Library or teacher-entered metadata.';
