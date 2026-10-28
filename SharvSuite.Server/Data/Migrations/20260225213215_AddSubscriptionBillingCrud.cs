using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SharvSuite.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionBillingCrud : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BillingCycleConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CycleName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Frequency = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    GraceDays = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingCycleConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InvoiceGenerationEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    SubscriberName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    InvoiceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceGenerationEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentTrackingEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaidOn = table.Column<DateOnly>(type: "date", nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTrackingEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlanCatalogItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanCode = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    PlanName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BillingFrequency = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanCatalogItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionLifecycleEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubscriberName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    PlanCode = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    State = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionLifecycleEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillingCycleConfigs_TenantId_CycleName",
                table: "BillingCycleConfigs",
                columns: new[] { "TenantId", "CycleName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceGenerationEntries_TenantId_InvoiceNumber",
                table: "InvoiceGenerationEntries",
                columns: new[] { "TenantId", "InvoiceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTrackingEntries_TenantId_ReferenceNumber",
                table: "PaymentTrackingEntries",
                columns: new[] { "TenantId", "ReferenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanCatalogItems_TenantId_PlanCode",
                table: "PlanCatalogItems",
                columns: new[] { "TenantId", "PlanCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionLifecycleEntries_TenantId_SubscriberName_PlanCode",
                table: "SubscriptionLifecycleEntries",
                columns: new[] { "TenantId", "SubscriberName", "PlanCode" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillingCycleConfigs");

            migrationBuilder.DropTable(
                name: "InvoiceGenerationEntries");

            migrationBuilder.DropTable(
                name: "PaymentTrackingEntries");

            migrationBuilder.DropTable(
                name: "PlanCatalogItems");

            migrationBuilder.DropTable(
                name: "SubscriptionLifecycleEntries");
        }
    }
}
