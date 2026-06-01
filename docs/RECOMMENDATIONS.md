# Book recommendations

Class Library suggests books for each student based on their checkout history. Recommendations are **teacher-only** — they appear on the student reading profile at `/teacher/students/:id`, linked from **Manage People** on the class roster.

There is **no machine learning or LLM** involved. Everything runs in the browser against your Supabase data (and Open Library for external titles). The logic is rule-based, fast, and explainable: each suggestion includes a short reason string.

## What data feeds recommendations

When a student checks out from the kiosk, the app stores a `checkouts` row linked to their roster entry via `borrower_id` (plus a snapshot of their display name).

From that history the app builds a **reading profile**:

| Stat | Source |
| --- | --- |
| **Top genres** | Most common genres among *returned* checkouts (up to 3) |
| **Top authors** | Most common authors among returned checkouts (up to 3) |
| **Borrowed book IDs** | Every book this student has ever checked out (returned or active) |
| **Books completed** | Count of checkouts with a `returned_at` timestamp |

Genre and author affinity only use **completed** loans (books that were returned). That avoids skew from a book they just grabbed today.

Implementation: [`src/lib/checkouts.js`](../src/lib/checkouts.js) (`computeStudentStats`, `getStudentReadingStats`).

## In-library recommendations

**Goal:** suggest available books from your classroom collection that this student has not already borrowed.

**Code:** [`src/lib/recommendations.js`](../src/lib/recommendations.js)

### Scoring (when the student has 2+ completed checkouts)

Each **available** book (`status = 'available'`) gets a score:

| Signal | Points | Example reason shown |
| --- | --- | --- |
| Genre matches one of the student's top genres | **+3** | "Because you enjoy Fiction" |
| Author matches one of the student's top authors (if genre did not match) | **+2** | "More from Eric Carle" |
| Popularity across all students | **+0 to +1** | Normalized checkout count ÷ highest checkout count in library |
| Student already borrowed this copy | **Excluded** | — |

Genre is checked before author (genre wins if both match). If neither matches but the book is popular, the reason is **"Popular in our library"**. Otherwise **"Available now"**.

Books are sorted by score descending; the top **8** are shown.

### Cold start (fewer than 2 completed checkouts)

New or lightly active readers do not have enough signal for genre/author matching. In that case the app falls back to **class-wide popularity**: the most-checked-out available books the student has not already borrowed.

### What is *not* considered (today)

- Reading level / Lexile (fields exist on books but are not used in scoring)
- Whether a title is currently checked out to someone else (only `available` books are candidates)
- Similar titles by ISBN/Open Library key if the student read a different physical copy of the same book

## External recommendations (Open Library)

**Goal:** suggest titles **outside** your collection for avid readers — e.g. to request from the public library or buy.

**Code:** [`src/lib/externalRecommendations.js`](../src/lib/externalRecommendations.js)

### How it works

1. Load the student's top genres and authors (same profile as above).
2. Search [Open Library](https://openlibrary.org) for each top genre (up to 2) and top author (up to 2).
3. If there is no history, search juvenile Fiction as a default.
4. **Remove** any result that already exists in your catalog (matched by `isbn` or `open_library_key`).
5. Score remaining titles the same way as in-library recs (+3 genre, +2 author).
6. Return the top **8** with cover, title, author, reason, and a link to Open Library.

These are suggestions only — nothing is added to your catalog automatically.

## Where to see it in the app

1. **Whole class** — Teacher login → **Class Reading** (`/teacher/reading`) from the dashboard.
2. **One student** — **Manage People** → click a student name → `/teacher/students/:id`.

### Class reading report includes

- Summary: student count, active readers, total books read, books currently out
- Per-student row: books read, current loans, top genre, last checkout, active/inactive flag
- Genre breakdown across the class (from returned checkouts)
- Inactive students (no checkout in 14 days)
- Most popular books in your library

### Student profile includes

- **Stats** — books read, avg days out, re-reads, etc.
- **Reading interests** — top genre/author badges
- **Recommended from our library** — scored available books with reasons
- **Explore beyond our library** — Open Library picks (when history exists)
- **Checkout history** — full loan timeline

## Privacy

- Recommendations are visible to the teacher only, not on the student kiosk.
- No data is sent to third parties except Open Library search requests for external recs (same API used when adding books).

## Extending the system later

Possible improvements without training a model:

- Filter by `reading_level` or Lexile when those fields are populated
- Boost books the student has **not** read that share an Open Library work key with a favorite
- "Students who read X also read Y" co-occurrence across the class
- Optional LLM-generated blurbs (not implemented; would be a separate API call, not fine-tuning)

For a typical classroom library (50–300 books), rule-based scoring is usually sufficient.
