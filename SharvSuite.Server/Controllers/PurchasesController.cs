using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/purchases")]
public sealed class PurchasesController(
    IPurchaseEntryRepository purchaseEntryRepository,
    ITenantContext tenantContext) : ControllerBase
{
    private static readonly HashSet<string> AllowedScreenKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "po-list",
        "create-po",
        "po-detail",
        "bill-list",
        "create-bill",
        "bill-detail"
    };

    [HttpGet("{screenKey}")]
    public async Task<ActionResult<IReadOnlyList<PurchaseEntry>>> GetByScreen(string screenKey, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        return Ok(await purchaseEntryRepository.GetByScreenAsync(screenKey, cancellationToken));
    }

    [HttpGet("{screenKey}/{id:guid}")]
    public async Task<ActionResult<PurchaseEntry>> GetById(string screenKey, Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = await purchaseEntryRepository.GetByIdAsync(id, cancellationToken);
        if (entity is null || !string.Equals(entity.ScreenKey, screenKey, StringComparison.OrdinalIgnoreCase))
        {
            return NotFound();
        }

        return Ok(entity);
    }

    [HttpPost("{screenKey}")]
    public async Task<ActionResult<PurchaseEntry>> Create(string screenKey, [FromBody] UpsertPurchaseEntryRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = new PurchaseEntry
        {
            Id = Guid.NewGuid(),
            ScreenKey = screenKey,
            PrimaryField = request.PrimaryField.Trim(),
            SecondaryField = request.SecondaryField?.Trim(),
            TertiaryField = request.TertiaryField?.Trim(),
            QuaternaryField = request.QuaternaryField?.Trim(),
            Status = request.Status.Trim()
        };

        await purchaseEntryRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { screenKey, id = entity.Id }, entity);
    }

    [HttpPut("{screenKey}/{id:guid}")]
    public async Task<ActionResult<PurchaseEntry>> Update(string screenKey, Guid id, [FromBody] UpsertPurchaseEntryRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = await purchaseEntryRepository.UpdateAsync(id, x =>
        {
            x.ScreenKey = screenKey;
            x.PrimaryField = request.PrimaryField.Trim();
            x.SecondaryField = request.SecondaryField?.Trim();
            x.TertiaryField = request.TertiaryField?.Trim();
            x.QuaternaryField = request.QuaternaryField?.Trim();
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

        var existing = await purchaseEntryRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null || !string.Equals(existing.ScreenKey, screenKey, StringComparison.OrdinalIgnoreCase))
        {
            return NotFound();
        }

        var deleted = await purchaseEntryRepository.DeleteAsync(id, cancellationToken);
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
            Error = $"Unsupported purchases screen '{screenKey}'."
        });
        return false;
    }
}

public sealed class UpsertPurchaseEntryRequest
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

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active";
}
