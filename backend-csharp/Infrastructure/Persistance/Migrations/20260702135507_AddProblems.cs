using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gardrop.Infrastructure.Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddProblems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProblemEvents",
                schema: "orders",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProblemId = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ActorRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Note = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProblemEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Problems",
                schema: "orders",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<long>(type: "bigint", nullable: false),
                    OrderNo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    StoreId = table.Column<int>(type: "integer", nullable: true),
                    Reason = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Photos = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    StoreDeadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StoreResponseNote = table.Column<string>(type: "text", nullable: false),
                    StoreRespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReturnRequired = table.Column<bool>(type: "boolean", nullable: false),
                    ReturnCostPayer = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReturnStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReturnReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Resolution = table.Column<string>(type: "text", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Problems", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProblemEvents_ProblemId",
                schema: "orders",
                table: "ProblemEvents",
                column: "ProblemId");

            migrationBuilder.CreateIndex(
                name: "IX_Problems_OrderId",
                schema: "orders",
                table: "Problems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Problems_Status",
                schema: "orders",
                table: "Problems",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Problems_StoreId",
                schema: "orders",
                table: "Problems",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Problems_UserId",
                schema: "orders",
                table: "Problems",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProblemEvents",
                schema: "orders");

            migrationBuilder.DropTable(
                name: "Problems",
                schema: "orders");
        }
    }
}
