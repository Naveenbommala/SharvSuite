using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/reports")]
public sealed class ReportsController(
    IReportEntryRepository reportEntryRepository,
    ITenantContext tenantContext) : ControllerBase
{
    private static readonly HashSet<string> AllowedScreenKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "profit-loss",
        "balance",
        "cashflow",
        "sales-by-period",
        "sales-by-product",
        "sales-by-currency",
        "tax-summary",
        "gst-vat-report",
        "region-tax",
        "customer-ledger",
        "vendor-ledger"
    };

    [HttpGet("{screenKey}")]
    public async Task<ActionResult<IReadOnlyList<ReportEntry>>> GetByScreen(string screenKey, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        return Ok(await reportEntryRepository.GetByScreenAsync(screenKey, cancellationToken));
    }

    [HttpGet("{screenKey}/{id:guid}")]
    public async Task<ActionResult<ReportEntry>> GetById(string screenKey, Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = await reportEntryRepository.GetByIdAsync(id, cancellationToken);
        if (entity is null || !string.Equals(entity.ScreenKey, screenKey, StringComparison.OrdinalIgnoreCase))
        {
            return NotFound();
        }

        return Ok(entity);
    }

    [HttpPost("{screenKey}")]
    public async Task<ActionResult<ReportEntry>> Create(string screenKey, [FromBody] UpsertReportEntryRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = new ReportEntry
        {
            Id = Guid.NewGuid(),
            ScreenKey = screenKey,
            PrimaryField = request.PrimaryField.Trim(),
            SecondaryField = request.SecondaryField?.Trim(),
            TertiaryField = request.TertiaryField?.Trim(),
            QuaternaryField = request.QuaternaryField?.Trim(),
            CustomerId = request.CustomerId,
            Status = request.Status.Trim()
        };

        await reportEntryRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { screenKey, id = entity.Id }, entity);
    }

    [HttpPut("{screenKey}/{id:guid}")]
    public async Task<ActionResult<ReportEntry>> Update(string screenKey, Guid id, [FromBody] UpsertReportEntryRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = await reportEntryRepository.UpdateAsync(id, x =>
        {
            x.ScreenKey = screenKey;
            x.PrimaryField = request.PrimaryField.Trim();
            x.SecondaryField = request.SecondaryField?.Trim();
            x.TertiaryField = request.TertiaryField?.Trim();
            x.QuaternaryField = request.QuaternaryField?.Trim();
            x.CustomerId = request.CustomerId;
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("{screenKey}/{id:guid}")]
    public async Task<IActionResult> Delete(string screenKey, Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var existing = await reportEntryRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null || !string.Equals(existing.ScreenKey, screenKey, StringComparison.OrdinalIgnoreCase))
        {
            return NotFound();
        }

        var deleted = await reportEntryRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private bool EnsureTenantResolved(out ActionResult errorResult)
    {
        if (tenantContext.TenantId.HasValue)
        {
            errorResult = Ok();
            return true;
        }

        errorResult = BadRequest(new
        {
            Error = "Tenant header is required. Set X-Tenant to a valid tenant slug."
        });
        return false;
    }

    private static bool EnsureScreenKeyValid(string screenKey, out ActionResult errorResult)
    {
        if (AllowedScreenKeys.Contains(screenKey))
        {
            errorResult = new OkResult();
            return true;
        }

        errorResult = new BadRequestObjectResult(new
        {
            Error = $"Unsupported report screen '{screenKey}'."
        });
        return false;
    }
}

public sealed class UpsertReportEntryRequest
{
    [Required]
    [MaxLength(200)]
    public string PrimaryField { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? SecondaryField { get; set; }

    [MaxLength(200)]
    public string? TertiaryField { get; set; }

    [MaxLength(200)]
    public string? QuaternaryField { get; set; }

    public Guid? CustomerId { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active";
}
