CREATE TABLE IF NOT EXISTS login_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ip VARCHAR(64) NOT NULL,
    user_agent VARCHAR(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_histories_user_id ON login_histories (user_id);

