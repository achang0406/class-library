-- Link checkouts to roster for reliable per-student history

ALTER TABLE checkouts
  ADD COLUMN IF NOT EXISTS borrower_id uuid REFERENCES borrowers (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS checkouts_borrower_idx ON checkouts (borrower_id);
CREATE INDEX IF NOT EXISTS checkouts_borrower_history_idx ON checkouts (borrower_id, returned_at);
