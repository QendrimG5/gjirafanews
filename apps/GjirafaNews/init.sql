-- =============================================================================
-- GjirafaNews — PostgreSQL initialization script
-- Runs automatically when the postgres container starts for the first time.
-- Only contains structures that must exist BEFORE the .NET API starts.
-- =============================================================================

-- Article views table (used in the Dapper bulk-insert demo)
-- Standalone — no FK to articles intentionally, so it exists even before migrations
CREATE TABLE IF NOT EXISTS article_views (
    id          BIGSERIAL PRIMARY KEY,
    article_id  INT          NOT NULL,
    viewed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at  ON article_views(viewed_at);

-- NOTE: The get_trending_articles stored procedure is intentionally NOT defined here.
-- It references the articles, categories, and sources tables which are created by
-- EF Core migrations (not by this init script). Those migrations run when the .NET
-- API starts for the first time via db.Database.MigrateAsync() in Program.cs.
--
-- The stored procedure is created via a separate EF Core migration:
--   dotnet ef migrations add AddTrendingArticlesProc --project GjirafaNewsAPI
-- or via the raw SQL call in Program.cs after MigrateAsync() completes.
--
-- This ordering guarantees:
--   1. postgres container starts → runs this init.sql (article_views only)
--   2. .NET API starts → MigrateAsync() creates all EF Core tables
--   3. Stored procedure is created (references tables that now exist)
