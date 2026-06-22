-- Wave 2: Class Library app schema on shared Supabase hub.
-- Combines migrations 001–003 under lyanne_library (set VITE_SUPABASE_DB_SCHEMA=lyanne_library).

CREATE SCHEMA IF NOT EXISTS lyanne_library;
GRANT USAGE ON SCHEMA lyanne_library TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA lyanne_library TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA lyanne_library TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA lyanne_library TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA lyanne_library GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA lyanne_library GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA lyanne_library GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

CREATE SEQUENCE IF NOT EXISTS lyanne_library.book_barcode_seq START 1;

CREATE TABLE IF NOT EXISTS lyanne_library.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  title text NOT NULL,
  author text,
  genre text,
  cover_url text,
  isbn text,
  publish_year int,
  open_library_key text,
  lexile int,
  reading_level text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'checked_out')),
  label_printed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS books_status_idx ON lyanne_library.books (status);
CREATE INDEX IF NOT EXISTS books_genre_idx ON lyanne_library.books (genre);
CREATE INDEX IF NOT EXISTS books_isbn_idx ON lyanne_library.books (isbn) WHERE isbn IS NOT NULL;
CREATE INDEX IF NOT EXISTS books_open_library_key_idx ON lyanne_library.books (open_library_key) WHERE open_library_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS books_lexile_idx ON lyanne_library.books (lexile) WHERE lexile IS NOT NULL;
CREATE INDEX IF NOT EXISTS books_reading_level_idx ON lyanne_library.books (reading_level) WHERE reading_level IS NOT NULL;

COMMENT ON COLUMN lyanne_library.books.lexile IS 'Lexile measure (L). Below-zero values represent BR scores, e.g. -160 = BR160L.';
COMMENT ON COLUMN lyanne_library.books.reading_level IS 'K-12 grade band derived from lexile typical student ranges; may be set manually.';

CREATE OR REPLACE FUNCTION lyanne_library.assign_book_barcode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = lyanne_library
AS $$
BEGIN
  IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
    NEW.barcode := 'LIB-' || lpad(nextval('lyanne_library.book_barcode_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_book_barcode ON lyanne_library.books;
CREATE TRIGGER trg_assign_book_barcode
  BEFORE INSERT ON lyanne_library.books
  FOR EACH ROW
  EXECUTE FUNCTION lyanne_library.assign_book_barcode();

CREATE TABLE IF NOT EXISTS lyanne_library.borrowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  borrower_type text NOT NULL CHECK (borrower_type IN ('student', 'staff', 'guest')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrowers_type_active_idx ON lyanne_library.borrowers (borrower_type, active);

CREATE TABLE IF NOT EXISTS lyanne_library.checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES lyanne_library.books (id) ON DELETE CASCADE,
  borrower_name text NOT NULL,
  borrower_type text NOT NULL CHECK (borrower_type IN ('student', 'staff', 'guest')),
  borrower_id uuid REFERENCES lyanne_library.borrowers (id) ON DELETE SET NULL,
  checked_out_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz
);

CREATE INDEX IF NOT EXISTS checkouts_book_active_idx ON lyanne_library.checkouts (book_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS checkouts_active_idx ON lyanne_library.checkouts (checked_out_at) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS checkouts_borrower_idx ON lyanne_library.checkouts (borrower_id);
CREATE INDEX IF NOT EXISTS checkouts_borrower_history_idx ON lyanne_library.checkouts (borrower_id, returned_at);

ALTER TABLE lyanne_library.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE lyanne_library.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lyanne_library.checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "books_select" ON lyanne_library.books FOR SELECT USING (true);
CREATE POLICY "books_insert" ON lyanne_library.books FOR INSERT WITH CHECK (true);
CREATE POLICY "books_update" ON lyanne_library.books FOR UPDATE USING (true);
CREATE POLICY "books_delete" ON lyanne_library.books FOR DELETE USING (true);

CREATE POLICY "borrowers_select" ON lyanne_library.borrowers FOR SELECT USING (true);
CREATE POLICY "borrowers_insert" ON lyanne_library.borrowers FOR INSERT WITH CHECK (true);
CREATE POLICY "borrowers_update" ON lyanne_library.borrowers FOR UPDATE USING (true);
CREATE POLICY "borrowers_delete" ON lyanne_library.borrowers FOR DELETE USING (true);

CREATE POLICY "checkouts_select" ON lyanne_library.checkouts FOR SELECT USING (true);
CREATE POLICY "checkouts_insert" ON lyanne_library.checkouts FOR INSERT WITH CHECK (true);
CREATE POLICY "checkouts_update" ON lyanne_library.checkouts FOR UPDATE USING (true);
CREATE POLICY "checkouts_delete" ON lyanne_library.checkouts FOR DELETE USING (true);
