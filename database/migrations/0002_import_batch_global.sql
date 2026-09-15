-- PH-4 (P4-03): voter registry imports are global (voters is not scoped to an
-- election), so import_batches.election_id becomes nullable; roll imports may
-- later reference an election but voter imports do not need one.
ALTER TABLE import_batches ALTER COLUMN election_id DROP NOT NULL;
