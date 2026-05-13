using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GjirafaNewsAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleCategoryPublishedIdIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_articles_category_id_published_at_id",
                table: "articles",
                columns: new[] { "category_id", "published_at", "id" },
                descending: new[] { false, true, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_articles_category_id_published_at_id",
                table: "articles");
        }
    }
}
