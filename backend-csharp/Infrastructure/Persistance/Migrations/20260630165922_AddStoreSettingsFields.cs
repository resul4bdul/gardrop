using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gardrop.Infrastructure.Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreSettingsFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "About",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Banner",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Beneficiary",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Facebook",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Iban",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Instagram",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "NotifyEmail",
                schema: "catalog",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyNewOrder",
                schema: "catalog",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyNewReview",
                schema: "catalog",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "PrepDays",
                schema: "catalog",
                table: "Stores",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReturnDays",
                schema: "catalog",
                table: "Stores",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tiktok",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Url",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Voen",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Whatsapp",
                schema: "catalog",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "About",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "BankName",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Banner",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Beneficiary",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Email",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Facebook",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Iban",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Instagram",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "LegalName",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "NotifyEmail",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "NotifyNewOrder",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "NotifyNewReview",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Phone",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "PrepDays",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "ReturnDays",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Tiktok",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Url",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Voen",
                schema: "catalog",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Whatsapp",
                schema: "catalog",
                table: "Stores");
        }
    }
}
