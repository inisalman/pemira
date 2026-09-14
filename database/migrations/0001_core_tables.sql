-- PEMIRA core schema per SDD section 3.
-- All times UTC (timestamptz), displayed as Asia/Jakarta in the UI.
-- IDs are random text values that never encode voter identity.

CREATE TABLE departments (
    id   TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);

CREATE TABLE voters (
    id              TEXT PRIMARY KEY,
    voter_type      TEXT NOT NULL CHECK (voter_type IN ('STUDENT', 'LECTURER')),
    identifier_type TEXT NOT NULL CHECK (identifier_type IN ('NIM', 'NIP_LOCAL')),
    identifier_value TEXT NOT NULL,
    name            TEXT NOT NULL,
    department_id   TEXT REFERENCES departments(id),
    active_status   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    -- identifier_type must match voter_type: NIM for STUDENT, NIP_LOCAL for LECTURER
    CONSTRAINT voters_identifier_type_matches CHECK (
        (voter_type = 'STUDENT' AND identifier_type = 'NIM') OR
        (voter_type = 'LECTURER' AND identifier_type = 'NIP_LOCAL')
    ),
    CONSTRAINT voters_unique_identifier UNIQUE (identifier_type, identifier_value)
);

CREATE INDEX voters_department_idx ON voters (department_id);
CREATE INDEX voters_name_idx ON voters (name);

CREATE TABLE users (
    id                 TEXT PRIMARY KEY,
    login_kind         TEXT NOT NULL CHECK (login_kind IN ('STUDENT', 'LECTURER', 'ADMIN')),
    login_identifier   TEXT NOT NULL,
    password_hash      TEXT NOT NULL,
    credential_version INTEGER NOT NULL DEFAULT 1,
    voter_id           TEXT REFERENCES voters(id),
    active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT users_unique_login UNIQUE (login_kind, login_identifier),
    -- voter_id unique when set (NULLs are allowed to repeat in Postgres)
    CONSTRAINT users_unique_voter UNIQUE (voter_id)
);

CREATE INDEX users_voter_idx ON users (voter_id);

CREATE TABLE sessions (
    id_hash            TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL REFERENCES users(id),
    credential_version INTEGER NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    expires_at         TIMESTAMPTZ NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE TABLE role_assignments (
    user_id     TEXT NOT NULL REFERENCES users(id),
    role        TEXT NOT NULL CHECK (role IN ('ADMIN', 'DPT_OFFICER', 'ACCOUNT_OFFICER', 'ELECTION_OFFICER', 'AUDITOR')),
    election_id TEXT,
    CONSTRAINT role_assignments_unique UNIQUE (user_id, role, election_id)
);

CREATE TABLE elections (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'READY', 'OPEN', 'PAUSED', 'CLOSED', 'PUBLISHED', 'ARCHIVED')),
    starts_at      TIMESTAMPTZ,
    ends_at        TIMESTAMPTZ,
    config_version INTEGER NOT NULL DEFAULT 1,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT elections_schedule CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE contests (
    id                  TEXT PRIMARY KEY,
    election_id         TEXT NOT NULL REFERENCES elections(id),
    code                TEXT NOT NULL,
    title               TEXT NOT NULL,
    scope_department_id TEXT REFERENCES departments(id),
    office              TEXT NOT NULL CHECK (office IN ('PAIR', 'CHAIR', 'VICE_CHAIR')),
    option_type         TEXT NOT NULL CHECK (option_type IN ('PAIR', 'SINGLE')),
    -- BEM/MPM are PAIR office + PAIR type; Hima offices are SINGLE
    CONSTRAINT contests_office_type CHECK (
        (office = 'PAIR' AND option_type = 'PAIR') OR
        (office IN ('CHAIR', 'VICE_CHAIR') AND option_type = 'SINGLE')
    ),
    CONSTRAINT contests_unique_code UNIQUE (election_id, code)
);

CREATE INDEX contests_election_idx ON contests (election_id);

-- Composite unique index backing voting_rights composite FK on contests.
CREATE UNIQUE INDEX contests_id_election_idx ON contests (id, election_id);

CREATE TABLE candidate_options (
    id         TEXT PRIMARY KEY,
    contest_id TEXT NOT NULL REFERENCES contests(id),
    number     INTEGER NOT NULL CHECK (number > 0),
    photo_key  TEXT,
    motto      TEXT,
    vision     TEXT,
    mission    TEXT,
    programs   TEXT,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT candidate_options_unique_number UNIQUE (contest_id, number)
);

-- Composite FK for ballots: option must belong to the same contest.
CREATE UNIQUE INDEX candidate_options_contest_id_idx ON candidate_options (contest_id, id);

CREATE TABLE candidate_members (
    id        TEXT PRIMARY KEY,
    option_id TEXT NOT NULL REFERENCES candidate_options(id),
    name      TEXT NOT NULL,
    position  TEXT NOT NULL CHECK (position IN ('CHAIR', 'VICE_CHAIR'))
);

CREATE INDEX candidate_members_option_idx ON candidate_members (option_id);

CREATE TABLE voter_roll_entries (
    id                     TEXT PRIMARY KEY,
    election_id            TEXT NOT NULL REFERENCES elections(id),
    voter_id               TEXT NOT NULL REFERENCES voters(id),
    voter_type_snapshot    TEXT NOT NULL CHECK (voter_type_snapshot IN ('STUDENT', 'LECTURER')),
    department_id_snapshot TEXT REFERENCES departments(id),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT voter_roll_unique UNIQUE (election_id, voter_id)
);

CREATE INDEX voter_roll_election_idx ON voter_roll_entries (election_id);

-- Composite unique index backing voting_rights composite FK.
CREATE UNIQUE INDEX voter_roll_id_election_idx ON voter_roll_entries (id, election_id);

CREATE TABLE voting_rights (
    id            TEXT PRIMARY KEY,
    roll_entry_id TEXT NOT NULL REFERENCES voter_roll_entries(id),
    contest_id    TEXT NOT NULL REFERENCES contests(id),
    election_id   TEXT NOT NULL REFERENCES elections(id),
    source        TEXT NOT NULL DEFAULT 'DEFAULT' CHECK (source IN ('DEFAULT', 'ADMIN')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT voting_rights_unique UNIQUE (roll_entry_id, contest_id),
    -- Composite FKs ensure DPT entry and contest belong to the same election.
    CONSTRAINT voting_rights_roll_election_fk
        FOREIGN KEY (roll_entry_id, election_id)
        REFERENCES voter_roll_entries (id, election_id),
    CONSTRAINT voting_rights_contest_election_fk
        FOREIGN KEY (contest_id, election_id)
        REFERENCES contests (id, election_id)
);

CREATE INDEX voting_rights_election_idx ON voting_rights (election_id);
CREATE INDEX voting_rights_contest_idx ON voting_rights (contest_id);

-- Composite unique index backing participations composite FK.
CREATE UNIQUE INDEX voting_rights_id_contest_idx ON voting_rights (id, contest_id);

CREATE TABLE participations (
    voting_right_id TEXT PRIMARY KEY REFERENCES voting_rights(id),
    contest_id      TEXT NOT NULL REFERENCES contests(id),
    receipt_code    TEXT NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    -- participation contest must match the right's contest
    CONSTRAINT participations_contest_fk
        FOREIGN KEY (voting_right_id, contest_id)
        REFERENCES voting_rights (id, contest_id)
);

CREATE INDEX participations_contest_idx ON participations (contest_id);

CREATE TABLE ballots (
    id         TEXT PRIMARY KEY,
    contest_id TEXT NOT NULL REFERENCES contests(id),
    option_id  TEXT NOT NULL,
    -- No voter_id, right_id, receipt_code, or precise vote time here by design
    -- (SDD section 3): ballots stay unlinkable to identity.
    CONSTRAINT ballots_option_fk
        FOREIGN KEY (contest_id, option_id)
        REFERENCES candidate_options (contest_id, id)
);

CREATE INDEX ballots_contest_idx ON ballots (contest_id);
CREATE INDEX ballots_option_idx ON ballots (option_id);

CREATE TABLE admin_actions (
    id             TEXT PRIMARY KEY,
    election_id    TEXT REFERENCES elections(id),
    type           TEXT NOT NULL,
    payload        JSONB NOT NULL,
    config_version INTEGER,
    proposer_id    TEXT NOT NULL REFERENCES users(id),
    approver_id    TEXT REFERENCES users(id),
    status         TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    decided_at     TIMESTAMPTZ,
    -- Proposer must differ from approver (SDD section 3 / D-10)
    CONSTRAINT admin_actions_self_approve CHECK (approver_id IS NULL OR approver_id <> proposer_id)
);

CREATE INDEX admin_actions_election_idx ON admin_actions (election_id);
CREATE INDEX admin_actions_status_idx ON admin_actions (status);

CREATE TABLE result_snapshots (
    id           TEXT PRIMARY KEY,
    election_id  TEXT NOT NULL REFERENCES elections(id),
    version      INTEGER NOT NULL,
    totals       JSONB NOT NULL,
    checksum     TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    published_at TIMESTAMPTZ,
    CONSTRAINT result_snapshots_unique_version UNIQUE (election_id, version)
);

CREATE TABLE audit_events (
    id               TEXT PRIMARY KEY,
    actor_id         TEXT REFERENCES users(id),
    election_id      TEXT REFERENCES elections(id),
    action           TEXT NOT NULL,
    target           TEXT,
    redacted_changes JSONB,
    occurred_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX audit_events_election_idx ON audit_events (election_id);
CREATE INDEX audit_events_actor_idx ON audit_events (actor_id);
CREATE INDEX audit_events_time_idx ON audit_events (occurred_at);

CREATE TABLE import_batches (
    id          TEXT PRIMARY KEY,
    election_id TEXT NOT NULL REFERENCES elections(id),
    state       TEXT NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING', 'VALIDATED', 'COMMITTED', 'FAILED', 'EXPIRED')),
    counts      JSONB,
    errors      JSONB,
    created_by  TEXT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    expires_at  TIMESTAMPTZ
);

CREATE INDEX import_batches_election_idx ON import_batches (election_id);
