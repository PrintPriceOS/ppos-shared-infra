-- Migration: AI Cache Table

CREATE TABLE IF NOT EXISTS ai_cache (
    cache_key VARCHAR(64) PRIMARY KEY,
    file_hash VARCHAR(64) NOT NULL,
    finding_code VARCHAR(32) NOT NULL,
    payload JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_hash (file_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
