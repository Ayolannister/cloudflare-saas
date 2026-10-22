CREATE TABLE IF NOT EXISTS task_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    clerk_user_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    FOREIGN KEY (file_id)
        REFERENCES files(id)
        ON DELETE CASCADE,

    UNIQUE (task_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id
ON task_attachments (task_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id
ON task_attachments (clerk_user_id);
