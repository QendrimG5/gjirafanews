using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GjirafaNewsAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixTrendingArticlesProcReturnTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // CREATE OR REPLACE can't change RETURNS TABLE signature — must DROP first.
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS get_trending_articles(INT, INT);");

            migrationBuilder.Sql(@"
CREATE FUNCTION get_trending_articles(p_days INT DEFAULT 7, p_limit INT DEFAULT 10)
RETURNS TABLE(id INT, title TEXT, category TEXT, source TEXT, read_time INT, published_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.title::TEXT, c.name::TEXT, s.name::TEXT, a.read_time, a.published_at
    FROM articles a
    JOIN categories c ON c.id = a.category_id
    JOIN sources s ON s.id = a.source_id
    WHERE a.is_deleted = false
      AND a.published_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY a.published_at DESC LIMIT p_limit;
END; $$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore the previous (buggy) version so Down is a true inverse.
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS get_trending_articles(INT, INT);");

            migrationBuilder.Sql(@"
CREATE FUNCTION get_trending_articles(p_days INT DEFAULT 7, p_limit INT DEFAULT 10)
RETURNS TABLE(id INT, title TEXT, category TEXT, source TEXT, read_time INT, published_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.title, c.name, s.name, a.read_time, a.published_at
    FROM articles a
    JOIN categories c ON c.id = a.category_id
    JOIN sources s ON s.id = a.source_id
    WHERE a.is_deleted = false
      AND a.published_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY a.published_at DESC LIMIT p_limit;
END; $$;");
        }
    }
}
