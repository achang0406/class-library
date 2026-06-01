-- Class Library schema

CREATE SEQUENCE IF NOT EXISTS book_barcode_seq START 1;

CREATE TABLE IF NOT EXISTS books (
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

CREATE INDEX IF NOT EXISTS books_status_idx ON books (status);
CREATE INDEX IF NOT EXISTS books_genre_idx ON books (genre);
CREATE INDEX IF NOT EXISTS books_isbn_idx ON books (isbn) WHERE isbn IS NOT NULL;
CREATE INDEX IF NOT EXISTS books_open_library_key_idx ON books (open_library_key) WHERE open_library_key IS NOT NULL;

CREATE OR REPLACE FUNCTION assign_book_barcode()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
    NEW.barcode := 'LIB-' || lpad(nextval('book_barcode_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_book_barcode ON books;
CREATE TRIGGER trg_assign_book_barcode
  BEFORE INSERT ON books
  FOR EACH ROW
  EXECUTE FUNCTION assign_book_barcode();

CREATE TABLE IF NOT EXISTS borrowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  borrower_type text NOT NULL CHECK (borrower_type IN ('student', 'staff', 'guest')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrowers_type_active_idx ON borrowers (borrower_type, active);

CREATE TABLE IF NOT EXISTS checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books (id) ON DELETE CASCADE,
  borrower_name text NOT NULL,
  borrower_type text NOT NULL CHECK (borrower_type IN ('student', 'staff', 'guest')),
  checked_out_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz
);

CREATE INDEX IF NOT EXISTS checkouts_book_active_idx ON checkouts (book_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS checkouts_active_idx ON checkouts (checked_out_at) WHERE returned_at IS NULL;

-- RLS: classroom app — open read/write via anon key (teacher UI gated client-side)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "books_select" ON books FOR SELECT USING (true);
CREATE POLICY "books_insert" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "books_update" ON books FOR UPDATE USING (true);
CREATE POLICY "books_delete" ON books FOR DELETE USING (true);

CREATE POLICY "borrowers_select" ON borrowers FOR SELECT USING (true);
CREATE POLICY "borrowers_insert" ON borrowers FOR INSERT WITH CHECK (true);
CREATE POLICY "borrowers_update" ON borrowers FOR UPDATE USING (true);
CREATE POLICY "borrowers_delete" ON borrowers FOR DELETE USING (true);

CREATE POLICY "checkouts_select" ON checkouts FOR SELECT USING (true);
CREATE POLICY "checkouts_insert" ON checkouts FOR INSERT WITH CHECK (true);
CREATE POLICY "checkouts_update" ON checkouts FOR UPDATE USING (true);
CREATE POLICY "checkouts_delete" ON checkouts FOR DELETE USING (true);
