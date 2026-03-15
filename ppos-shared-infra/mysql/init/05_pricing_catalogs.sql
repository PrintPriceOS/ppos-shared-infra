-- 05_pricing_catalogs.sql
CREATE TABLE IF NOT EXISTS pricing_catalogs (
    catalog_id VARCHAR(255) PRIMARY KEY,
    specification_key VARCHAR(100) NOT NULL,
    base_mfg_cost DECIMAL(10,2) NOT NULL,
    customer_tier VARCHAR(50),
    effective_from DATETIME(3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_spec (specification_key)
);
