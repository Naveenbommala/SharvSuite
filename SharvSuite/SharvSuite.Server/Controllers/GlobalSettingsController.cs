using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/global-settings")]
public sealed class GlobalSettingsController(
    IGlobalSettingRepository globalSettingRepository,
    ITenantContext tenantContext) : ControllerBase
{
    private static readonly HashSet<string> AllowedScreenKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "numbering-series",
        "document-templates",
        "email-templates",
        "notification-rules",
        "automation"
    };

    [HttpGet("{screenKey}")]
    public async Task<ActionResult<IReadOnlyList<GlobalSettingEntry>>> GetByScreen(string screenKey, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        return Ok(await globalSettingRepository.GetByScreenAsync(screenKey, cancellationToken));
    }

    [HttpGet("{screenKey}/{id:guid}")]
    public async Task<ActionResult<GlobalSettingEntry>> GetById(string screenKey, Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = await globalSettingRepository.GetByIdAsync(id, cancellationToken);
        if (entity is null || !string.Equals(entity.ScreenKey, screenKey, StringComparison.OrdinalIgnoreCase))
        {
            return NotFound();
        }

        return Ok(entity);
    }

    [HttpPost("{screenKey}")]
    public async Task<ActionResult<GlobalSettingEntry>> Create(string screenKey, [FromBody] UpsertGlobalSettingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = new GlobalSettingEntry
        {
            Id = Guid.NewGuid(),
            ScreenKey = screenKey,
            PrimaryField = request.PrimaryField.Trim(),
            SecondaryField = request.SecondaryField?.Trim(),
            TertiaryField = request.TertiaryField?.Trim(),
            Status = request.Status.Trim()
        };

        await globalSettingRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { screenKey, id = entity.Id }, entity);
    }

    [HttpPut("{screenKey}/{id:guid}")]
    public async Task<ActionResult<GlobalSettingEntry>> Update(string screenKey, Guid id, [FromBody] UpsertGlobalSettingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (!EnsureScreenKeyValid(screenKey, out var screenError))
        {
            return screenError;
        }

        var entity = await globalSettingRepository.UpdateAsync(id, x =>
        {
            x.ScreenKey = screenKey;
            x.PrimaryField = request.PrimaryField.Trim();
            x.SecondaryField = request.SecondaryField?.Trim();
            x.TertiaryField = request.TertiaryField?.Trim();
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

        var existing = await globalSettingRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null || !string.Equals(existing.ScreenKey, screenKey, StringComparison.OrdinalIgnoreCase))
        {
            return NotFound();
        }

        var deleted = await globalSettingRepository.DeleteAsync(id, cancellationToken);
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
            Error = $"Unsupported global settings screen '{screenKey}'."
        });
        return false;
    }
}

public sealed class UpsertGlobalSettingRequest
{
    [Required]
    [MaxLength(200)]
    public string PrimaryField { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? SecondaryField { get; set; }

    [MaxLength(200)]
    public string? TertiaryField { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active";
}
