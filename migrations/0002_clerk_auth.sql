ALTER TABLE projects ADD COLUMN clerk_user_id TEXT;

CREATE INDEX idx_projects_clerk_user_id
ON projects (clerk_user_id);
