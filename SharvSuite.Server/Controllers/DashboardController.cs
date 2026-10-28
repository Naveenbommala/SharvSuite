using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Services;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(
    AppDbContext dbContext,
    ITenantContext tenantContext,
    ICurrencyConversionService currencyConversionService) : ControllerBase
{
    private static readonly HashSet<string> AllowedScreens = new(StringComparer.OrdinalIgnoreCase)
    {
        "overview-dashboard",
        "financial-dashboard",
        "sales-dashboard",
        "inventory-dashboard"
    };

    [HttpGet("{screenKey}")]
    public async Task<ActionResult<DashboardResponse>> GetDashboard(string screenKey, CancellationToken cancellationToken)
    {
        if (!tenantContext.TenantId.HasValue)
        {
            return BadRequest(new
            {
                Error = "Tenant header is required. Set X-Tenant to a valid tenant slug."
            });
        }

        if (!AllowedScreens.Contains(screenKey))
        {
            return BadRequest(new
            {
                Error = $"Unsupported dashboard screen '{screenKey}'."
            });
        }

        var sales = await dbContext.InvoiceGenerationEntries.SumAsync(x => x.Amount, cancellationToken);
        var completedPayments = await dbContext.PaymentTrackingEntries
            .Where(x => x.PaymentStatus == "Completed")
            .SumAsync(x => x.AmountPaid, cancellationToken);

        var expenses = 0m;
        var profit = sales - expenses;
        var receivables = sales - completedPayments;
        var payables = expenses;

        var targetCurrency = tenantContext.DefaultCurrencyCode ?? "USD";
        decimal convertedSalesTotal;
        try
        {
            convertedSalesTotal = currencyConversionService
                .Convert(new Money(sales, "USD"), targetCurrency)
                .Amount;
        }
        catch
        {
            convertedSalesTotal = sales;
        }

        var widgets = new List<DashboardWidget>
        {
            new("sales", sales),
            new("expenses", expenses),
            new("profit", profit),
            new("receivables", receivables),
            new("payables", payables),
            new("currency-converted totals", convertedSalesTotal)
        };

        return Ok(new DashboardResponse(
            screenKey,
            targetCurrency,
            widgets));
    }
}

public sealed record DashboardResponse(
    string ScreenKey,
    string CurrencyCode,
    IReadOnlyList<DashboardWidget> Widgets);

public sealed record DashboardWidget(
    string Name,
    decimal Value);
