using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SharvSuite.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomersCrud : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomerEntries",
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
                    table.PrimaryKey("PK_CustomerEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerEntries_TenantId_ScreenKey_PrimaryField",
                table: "CustomerEntries",
                columns: new[] { "TenantId", "ScreenKey", "PrimaryField" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerEntries");
        }
    }
}
