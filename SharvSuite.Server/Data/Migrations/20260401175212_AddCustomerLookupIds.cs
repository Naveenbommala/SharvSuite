using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SharvSuite.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerLookupIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "CustomerEntries",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "InvoicingEntries",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "PaymentEntries",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "ReportEntries",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "SalesEntries",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "CustomerEntries");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "InvoicingEntries");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "PaymentEntries");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "ReportEntries");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "SalesEntries");
        }
    }
}
