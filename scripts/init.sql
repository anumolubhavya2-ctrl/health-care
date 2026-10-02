-- CareSync Database Initialization Script
-- This runs on first PostgreSQL container start

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE caresync_db TO caresync;
