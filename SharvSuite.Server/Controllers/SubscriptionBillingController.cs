using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/subscription-billing")]
public sealed class SubscriptionBillingController(
    ITenantEntityRepository<PlanCatalogItem> planRepository,
    ITenantEntityRepository<SubscriptionLifecycleEntry> lifecycleRepository,
    ITenantEntityRepository<BillingCycleConfig> cycleRepository,
    ITenantEntityRepository<InvoiceGenerationEntry> invoiceRepository,
    ITenantEntityRepository<PaymentTrackingEntry> paymentRepository,
    ITenantContext tenantContext) : ControllerBase
{
    [HttpGet("plan-catalog")]
    public async Task<ActionResult<IReadOnlyList<PlanCatalogItem>>> GetPlanCatalog(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        return Ok(await planRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("plan-catalog")]
    public async Task<ActionResult<PlanCatalogItem>> CreatePlanCatalog([FromBody] UpsertPlanCatalogRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;

        var entity = new PlanCatalogItem
        {
            Id = Guid.NewGuid(),
            PlanCode = request.PlanCode.Trim(),
            PlanName = request.PlanName.Trim(),
            Price = request.Price,
            BillingFrequency = request.BillingFrequency.Trim(),
            Status = request.Status.Trim()
        };

        await planRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetPlanCatalogById), new { id = entity.Id }, entity);
    }

    [HttpGet("plan-catalog/{id:guid}")]
    public async Task<ActionResult<PlanCatalogItem>> GetPlanCatalogById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await planRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("plan-catalog/{id:guid}")]
    public async Task<ActionResult<PlanCatalogItem>> UpdatePlanCatalog(Guid id, [FromBody] UpsertPlanCatalogRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;

        var entity = await planRepository.UpdateAsync(id, x =>
        {
            x.PlanCode = request.PlanCode.Trim();
            x.PlanName = request.PlanName.Trim();
            x.Price = request.Price;
            x.BillingFrequency = request.BillingFrequency.Trim();
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("plan-catalog/{id:guid}")]
    public async Task<IActionResult> DeletePlanCatalog(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var deleted = await planRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("subscription-lifecycle")]
    public async Task<ActionResult<IReadOnlyList<SubscriptionLifecycleEntry>>> GetSubscriptionLifecycle(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        return Ok(await lifecycleRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("subscription-lifecycle")]
    public async Task<ActionResult<SubscriptionLifecycleEntry>> CreateSubscriptionLifecycle([FromBody] UpsertSubscriptionLifecycleRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = new SubscriptionLifecycleEntry
        {
            Id = Guid.NewGuid(),
            SubscriberName = request.SubscriberName.Trim(),
            PlanCode = request.PlanCode.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            State = request.State.Trim()
        };

        await lifecycleRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetSubscriptionLifecycleById), new { id = entity.Id }, entity);
    }

    [HttpGet("subscription-lifecycle/{id:guid}")]
    public async Task<ActionResult<SubscriptionLifecycleEntry>> GetSubscriptionLifecycleById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await lifecycleRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("subscription-lifecycle/{id:guid}")]
    public async Task<ActionResult<SubscriptionLifecycleEntry>> UpdateSubscriptionLifecycle(Guid id, [FromBody] UpsertSubscriptionLifecycleRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await lifecycleRepository.UpdateAsync(id, x =>
        {
            x.SubscriberName = request.SubscriberName.Trim();
            x.PlanCode = request.PlanCode.Trim();
            x.StartDate = request.StartDate;
            x.EndDate = request.EndDate;
            x.State = request.State.Trim();
        }, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("subscription-lifecycle/{id:guid}")]
    public async Task<IActionResult> DeleteSubscriptionLifecycle(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var deleted = await lifecycleRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("billing-cycles")]
    public async Task<ActionResult<IReadOnlyList<BillingCycleConfig>>> GetBillingCycles(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        return Ok(await cycleRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("billing-cycles")]
    public async Task<ActionResult<BillingCycleConfig>> CreateBillingCycle([FromBody] UpsertBillingCycleRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = new BillingCycleConfig
        {
            Id = Guid.NewGuid(),
            CycleName = request.CycleName.Trim(),
            Frequency = request.Frequency.Trim(),
            GraceDays = request.GraceDays,
            Status = request.Status.Trim()
        };
        await cycleRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetBillingCycleById), new { id = entity.Id }, entity);
    }

    [HttpGet("billing-cycles/{id:guid}")]
    public async Task<ActionResult<BillingCycleConfig>> GetBillingCycleById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await cycleRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("billing-cycles/{id:guid}")]
    public async Task<ActionResult<BillingCycleConfig>> UpdateBillingCycle(Guid id, [FromBody] UpsertBillingCycleRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await cycleRepository.UpdateAsync(id, x =>
        {
            x.CycleName = request.CycleName.Trim();
            x.Frequency = request.Frequency.Trim();
            x.GraceDays = request.GraceDays;
            x.Status = request.Status.Trim();
        }, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("billing-cycles/{id:guid}")]
    public async Task<IActionResult> DeleteBillingCycle(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var deleted = await cycleRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("invoice-generation")]
    public async Task<ActionResult<IReadOnlyList<InvoiceGenerationEntry>>> GetInvoiceGeneration(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        return Ok(await invoiceRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("invoice-generation")]
    public async Task<ActionResult<InvoiceGenerationEntry>> CreateInvoiceGeneration([FromBody] UpsertInvoiceGenerationRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = new InvoiceGenerationEntry
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = request.InvoiceNumber.Trim(),
            SubscriberName = request.SubscriberName.Trim(),
            InvoiceDate = request.InvoiceDate,
            Amount = request.Amount,
            Status = request.Status.Trim()
        };
        await invoiceRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetInvoiceGenerationById), new { id = entity.Id }, entity);
    }

    [HttpGet("invoice-generation/{id:guid}")]
    public async Task<ActionResult<InvoiceGenerationEntry>> GetInvoiceGenerationById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await invoiceRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("invoice-generation/{id:guid}")]
    public async Task<ActionResult<InvoiceGenerationEntry>> UpdateInvoiceGeneration(Guid id, [FromBody] UpsertInvoiceGenerationRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await invoiceRepository.UpdateAsync(id, x =>
        {
            x.InvoiceNumber = request.InvoiceNumber.Trim();
            x.SubscriberName = request.SubscriberName.Trim();
            x.InvoiceDate = request.InvoiceDate;
            x.Amount = request.Amount;
            x.Status = request.Status.Trim();
        }, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("invoice-generation/{id:guid}")]
    public async Task<IActionResult> DeleteInvoiceGeneration(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var deleted = await invoiceRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("payment-tracking")]
    public async Task<ActionResult<IReadOnlyList<PaymentTrackingEntry>>> GetPaymentTracking(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        return Ok(await paymentRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("payment-tracking")]
    public async Task<ActionResult<PaymentTrackingEntry>> CreatePaymentTracking([FromBody] UpsertPaymentTrackingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = new PaymentTrackingEntry
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = request.ReferenceNumber.Trim(),
            InvoiceNumber = request.InvoiceNumber.Trim(),
            AmountPaid = request.AmountPaid,
            PaidOn = request.PaidOn,
            PaymentStatus = request.PaymentStatus.Trim()
        };
        await paymentRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetPaymentTrackingById), new { id = entity.Id }, entity);
    }

    [HttpGet("payment-tracking/{id:guid}")]
    public async Task<ActionResult<PaymentTrackingEntry>> GetPaymentTrackingById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await paymentRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("payment-tracking/{id:guid}")]
    public async Task<ActionResult<PaymentTrackingEntry>> UpdatePaymentTracking(Guid id, [FromBody] UpsertPaymentTrackingRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var entity = await paymentRepository.UpdateAsync(id, x =>
        {
            x.ReferenceNumber = request.ReferenceNumber.Trim();
            x.InvoiceNumber = request.InvoiceNumber.Trim();
            x.AmountPaid = request.AmountPaid;
            x.PaidOn = request.PaidOn;
            x.PaymentStatus = request.PaymentStatus.Trim();
        }, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("payment-tracking/{id:guid}")]
    public async Task<IActionResult> DeletePaymentTracking(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error)) return error;
        var deleted = await paymentRepository.DeleteAsync(id, cancellationToken);
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

public sealed class UpsertPlanCatalogRequest
{
    [Required, MaxLength(40)] public string PlanCode { get; set; } = string.Empty;
    [Required, MaxLength(120)] public string PlanName { get; set; } = string.Empty;
    [Required] public decimal Price { get; set; }
    [Required, MaxLength(30)] public string BillingFrequency { get; set; } = "Monthly";
    [Required, MaxLength(30)] public string Status { get; set; } = "Active";
}

public sealed class UpsertSubscriptionLifecycleRequest
{
    [Required, MaxLength(120)] public string SubscriberName { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string PlanCode { get; set; } = string.Empty;
    [Required] public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    [Required, MaxLength(30)] public string State { get; set; } = "Active";
}

public sealed class UpsertBillingCycleRequest
{
    [Required, MaxLength(80)] public string CycleName { get; set; } = string.Empty;
    [Required, MaxLength(30)] public string Frequency { get; set; } = string.Empty;
    [Required] public int GraceDays { get; set; }
    [Required, MaxLength(30)] public string Status { get; set; } = "Active";
}

public sealed class UpsertInvoiceGenerationRequest
{
    [Required, MaxLength(40)] public string InvoiceNumber { get; set; } = string.Empty;
    [Required, MaxLength(120)] public string SubscriberName { get; set; } = string.Empty;
    [Required] public DateOnly InvoiceDate { get; set; }
    [Required] public decimal Amount { get; set; }
    [Required, MaxLength(30)] public string Status { get; set; } = "Generated";
}

public sealed class UpsertPaymentTrackingRequest
{
    [Required, MaxLength(40)] public string ReferenceNumber { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string InvoiceNumber { get; set; } = string.Empty;
    [Required] public decimal AmountPaid { get; set; }
    [Required] public DateOnly PaidOn { get; set; }
    [Required, MaxLength(30)] public string PaymentStatus { get; set; } = "Pending";
}
