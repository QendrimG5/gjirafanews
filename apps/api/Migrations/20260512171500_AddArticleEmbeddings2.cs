using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace GjirafaNewsAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleEmbeddings2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "article_embeddings",
                type: "vector(1024)",
                nullable: false,
                oldClrType: typeof(Vector),
                oldType: "vector(1536)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "article_embeddings",
                type: "vector(1536)",
                nullable: false,
                oldClrType: typeof(Vector),
                oldType: "vector(1024)");
        }
    }
}
