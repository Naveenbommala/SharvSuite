using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/business-setup")]
public sealed class BusinessSetupController(
    ITenantEntityRepository<BusinessRecord> businessRecordRepository,
    ITenantEntityRepository<BusinessProfile> businessProfileRepository,
    ITenantEntityRepository<BusinessPreference> businessPreferenceRepository,
    ITenantEntityRepository<RegionalSetting> regionalSettingRepository,
    ITenantEntityRepository<FiscalYearSetting> fiscalYearSettingRepository,
    ITenantContext tenantContext) : ControllerBase
{
    [HttpGet("create-business")]
    public async Task<ActionResult<IReadOnlyList<BusinessRecord>>> GetCreateBusinesses(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await businessRecordRepository.GetAllAsync(cancellationToken));
    }

    [HttpGet("create-business/{id:guid}")]
    public async Task<ActionResult<BusinessRecord>> GetCreateBusiness(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var record = await businessRecordRepository.GetByIdAsync(id, cancellationToken);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost("create-business")]
    public async Task<ActionResult<BusinessRecord>> CreateBusiness([FromBody] UpsertBusinessRecordRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new BusinessRecord
        {
            Id = Guid.NewGuid(),
            BusinessName = request.BusinessName.Trim(),
            LegalName = string.IsNullOrWhiteSpace(request.LegalName)
                ? request.BusinessName.Trim()
                : request.LegalName.Trim(),
            Email = request.Email?.Trim() ?? string.Empty,
            Phone = request.Phone?.Trim(),
            Status = request.Status.Trim()
        };

        await businessRecordRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetCreateBusiness), new { id = entity.Id }, entity);
    }

    [HttpPut("create-business/{id:guid}")]
    public async Task<ActionResult<BusinessRecord>> UpdateBusiness(Guid id, [FromBody] UpsertBusinessRecordRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await businessRecordRepository.UpdateAsync(id, x =>
        {
            x.BusinessName = request.BusinessName.Trim();
            x.LegalName = string.IsNullOrWhiteSpace(request.LegalName)
                ? request.BusinessName.Trim()
                : request.LegalName.Trim();
            x.Email = request.Email?.Trim() ?? string.Empty;
            x.Phone = request.Phone?.Trim();
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("create-business/{id:guid}")]
    public async Task<IActionResult> DeleteBusiness(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await businessRecordRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("business-profiles")]
    public async Task<ActionResult<IReadOnlyList<BusinessProfile>>> GetBusinessProfiles(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await businessProfileRepository.GetAllAsync(cancellationToken));
    }

    [HttpGet("business-profiles/{id:guid}")]
    public async Task<ActionResult<BusinessProfile>> GetBusinessProfile(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var record = await businessProfileRepository.GetByIdAsync(id, cancellationToken);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost("business-profiles")]
    public async Task<ActionResult<BusinessProfile>> CreateBusinessProfile([FromBody] UpsertBusinessProfileRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new BusinessProfile
        {
            Id = Guid.NewGuid(),
            DisplayName = request.DisplayName.Trim(),
            Industry = request.Industry?.Trim(),
            Website = request.Website?.Trim(),
            Address = request.Address?.Trim(),
            Status = request.Status.Trim()
        };

        await businessProfileRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetBusinessProfile), new { id = entity.Id }, entity);
    }

    [HttpPut("business-profiles/{id:guid}")]
    public async Task<ActionResult<BusinessProfile>> UpdateBusinessProfile(Guid id, [FromBody] UpsertBusinessProfileRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await businessProfileRepository.UpdateAsync(id, x =>
        {
            x.DisplayName = request.DisplayName.Trim();
            x.Industry = request.Industry?.Trim();
            x.Website = request.Website?.Trim();
            x.Address = request.Address?.Trim();
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("business-profiles/{id:guid}")]
    public async Task<IActionResult> DeleteBusinessProfile(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await businessProfileRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("business-preferences")]
    public async Task<ActionResult<IReadOnlyList<BusinessPreference>>> GetBusinessPreferences(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await businessPreferenceRepository.GetAllAsync(cancellationToken));
    }

    [HttpGet("business-preferences/{id:guid}")]
    public async Task<ActionResult<BusinessPreference>> GetBusinessPreference(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var record = await businessPreferenceRepository.GetByIdAsync(id, cancellationToken);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost("business-preferences")]
    public async Task<ActionResult<BusinessPreference>> CreateBusinessPreference([FromBody] UpsertBusinessPreferenceRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new BusinessPreference
        {
            Id = Guid.NewGuid(),
            InvoicePrefix = request.InvoicePrefix.Trim(),
            PaymentTerms = request.PaymentTerms.Trim(),
            DefaultLanguage = request.DefaultLanguage?.Trim(),
            Status = request.Status.Trim()
        };

        await businessPreferenceRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetBusinessPreference), new { id = entity.Id }, entity);
    }

    [HttpPut("business-preferences/{id:guid}")]
    public async Task<ActionResult<BusinessPreference>> UpdateBusinessPreference(Guid id, [FromBody] UpsertBusinessPreferenceRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await businessPreferenceRepository.UpdateAsync(id, x =>
        {
            x.InvoicePrefix = request.InvoicePrefix.Trim();
            x.PaymentTerms = request.PaymentTerms.Trim();
            x.DefaultLanguage = request.DefaultLanguage?.Trim();
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("business-preferences/{id:guid}")]
    public async Task<IActionResult> DeleteBusinessPreference(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await businessPreferenceRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("regional-settings")]
    public async Task<ActionResult<IReadOnlyList<RegionalSetting>>> GetRegionalSettings(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await regionalSettingRepository.GetAllAsync(cancellationToken));
    }

    [HttpGet("regional-settings/{id:guid}")]
    public async Task<ActionResult<RegionalSetting>> GetRegionalSetting(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var record = await regionalSettingRepository.GetByIdAsync(id, cancellationToken);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost("regional-settings")]
    public async Task<ActionResult<RegionalSetting>> CreateRegionalSetting([FromBody] UpsertRegionalSettingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new RegionalSetting
        {
            Id = Guid.NewGuid(),
            Country = request.Country.Trim(),
            Timezone = request.Timezone.Trim(),
            DateFormat = request.DateFormat?.Trim(),
            NumberFormat = request.NumberFormat?.Trim(),
            Status = request.Status.Trim()
        };

        await regionalSettingRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetRegionalSetting), new { id = entity.Id }, entity);
    }

    [HttpPut("regional-settings/{id:guid}")]
    public async Task<ActionResult<RegionalSetting>> UpdateRegionalSetting(Guid id, [FromBody] UpsertRegionalSettingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await regionalSettingRepository.UpdateAsync(id, x =>
        {
            x.Country = request.Country.Trim();
            x.Timezone = request.Timezone.Trim();
            x.DateFormat = request.DateFormat?.Trim();
            x.NumberFormat = request.NumberFormat?.Trim();
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("regional-settings/{id:guid}")]
    public async Task<IActionResult> DeleteRegionalSetting(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await regionalSettingRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("fiscal-year-settings")]
    public async Task<ActionResult<IReadOnlyList<FiscalYearSetting>>> GetFiscalYearSettings(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await fiscalYearSettingRepository.GetAllAsync(cancellationToken));
    }

    [HttpGet("fiscal-year-settings/{id:guid}")]
    public async Task<ActionResult<FiscalYearSetting>> GetFiscalYearSetting(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var record = await fiscalYearSettingRepository.GetByIdAsync(id, cancellationToken);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost("fiscal-year-settings")]
    public async Task<ActionResult<FiscalYearSetting>> CreateFiscalYearSetting([FromBody] UpsertFiscalYearSettingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new FiscalYearSetting
        {
            Id = Guid.NewGuid(),
            FiscalYear = request.FiscalYear.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            BookStatus = request.BookStatus.Trim()
        };

        await fiscalYearSettingRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetFiscalYearSetting), new { id = entity.Id }, entity);
    }

    [HttpPut("fiscal-year-settings/{id:guid}")]
    public async Task<ActionResult<FiscalYearSetting>> UpdateFiscalYearSetting(Guid id, [FromBody] UpsertFiscalYearSettingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await fiscalYearSettingRepository.UpdateAsync(id, x =>
        {
            x.FiscalYear = request.FiscalYear.Trim();
            x.StartDate = request.StartDate;
            x.EndDate = request.EndDate;
            x.BookStatus = request.BookStatus.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("fiscal-year-settings/{id:guid}")]
    public async Task<IActionResult> DeleteFiscalYearSetting(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await fiscalYearSettingRepository.DeleteAsync(id, cancellationToken);
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
}

public sealed class UpsertBusinessRecordRequest
{
    [Required]
    [MaxLength(200)]
    public string BusinessName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? LegalName { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(40)]
    public string? Phone { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";
}

public sealed class UpsertBusinessProfileRequest
{
    [Required]
    [MaxLength(200)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Industry { get; set; }

    [MaxLength(250)]
    public string? Website { get; set; }

    [MaxLength(400)]
    public string? Address { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";
}

public sealed class UpsertBusinessPreferenceRequest
{
    [Required]
    [MaxLength(20)]
    public string InvoicePrefix { get; set; } = string.Empty;

    [Required]
    [MaxLength(40)]
    public string PaymentTerms { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? DefaultLanguage { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";
}

public sealed class UpsertRegionalSettingRequest
{
    [Required]
    [MaxLength(120)]
    public string Country { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Timezone { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? DateFormat { get; set; }

    [MaxLength(20)]
    public string? NumberFormat { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";
}

public sealed class UpsertFiscalYearSettingRequest
{
    [Required]
    [MaxLength(30)]
    public string FiscalYear { get; set; } = string.Empty;

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    [Required]
    [MaxLength(30)]
    public string BookStatus { get; set; } = string.Empty;
}
