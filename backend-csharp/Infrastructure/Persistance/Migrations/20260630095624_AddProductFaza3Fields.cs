using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gardrop.Infrastructure.Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddProductFaza3Fields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BuyPrice",
                schema: "catalog",
                table: "Products",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                schema: "catalog",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SalesCount",
                schema: "catalog",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Season",
                schema: "catalog",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SeoDescription",
                schema: "catalog",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SeoTitle",
                schema: "catalog",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                schema: "catalog",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Views",
                schema: "catalog",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BuyPrice",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SalesCount",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Season",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SeoDescription",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SeoTitle",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Tags",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Views",
                schema: "catalog",
                table: "Products");
        }
    }
}
