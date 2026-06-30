using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gardrop.Infrastructure.Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                schema: "orders",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentIntentId",
                schema: "orders",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                schema: "orders",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentProvider",
                schema: "orders",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                schema: "orders",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaidAt",
                schema: "orders",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentIntentId",
                schema: "orders",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                schema: "orders",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentProvider",
                schema: "orders",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                schema: "orders",
                table: "Orders");
        }
    }
}
