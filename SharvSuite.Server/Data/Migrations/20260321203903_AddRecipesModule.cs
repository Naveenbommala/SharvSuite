using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SharvSuite.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipesModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountingEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScreenKey = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    PrimaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SecondaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TertiaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    QuaternaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountingEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InvoicingEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScreenKey = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    PrimaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SecondaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TertiaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    QuaternaryField = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoicingEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecipeDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipeName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OutputProductName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OutputSku = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    BatchYieldQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    YieldUnit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    IngredientsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Instructions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecipePlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipeDefinitionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipeName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OutputProductName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    BatchCount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlannedOutputQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    YieldUnit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    PlannedDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IngredientsSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExecutionStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ExecutedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipePlans", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountingEntries_TenantId_ScreenKey_PrimaryField",
                table: "AccountingEntries",
                columns: new[] { "TenantId", "ScreenKey", "PrimaryField" });

            migrationBuilder.CreateIndex(
                name: "IX_InvoicingEntries_TenantId_ScreenKey_PrimaryField",
                table: "InvoicingEntries",
                columns: new[] { "TenantId", "ScreenKey", "PrimaryField" });

            migrationBuilder.CreateIndex(
                name: "IX_RecipeDefinitions_TenantId_RecipeName",
                table: "RecipeDefinitions",
                columns: new[] { "TenantId", "RecipeName" });

            migrationBuilder.CreateIndex(
                name: "IX_RecipePlans_TenantId_RecipeDefinitionId_PlannedDateUtc",
                table: "RecipePlans",
                columns: new[] { "TenantId", "RecipeDefinitionId", "PlannedDateUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountingEntries");

            migrationBuilder.DropTable(
                name: "InvoicingEntries");

            migrationBuilder.DropTable(
                name: "RecipeDefinitions");

            migrationBuilder.DropTable(
                name: "RecipePlans");
        }
    }
}
