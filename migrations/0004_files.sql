CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clerk_user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    size INTEGER NOT NULL CHECK (size >= 0),
    content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (clerk_user_id, filename)
);

CREATE INDEX IF NOT EXISTS idx_files_clerk_user_id
ON files (clerk_user_id);
