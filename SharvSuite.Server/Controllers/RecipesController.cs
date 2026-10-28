using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/recipes")]
public sealed class RecipesController(
    IRecipeDefinitionRepository recipeDefinitionRepository,
    IRecipePlanRepository recipePlanRepository,
    AppDbContext dbContext,
    ITenantContext tenantContext) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [HttpGet("inventory-options")]
    public async Task<ActionResult<IReadOnlyList<InventoryOptionResponse>>> GetInventoryOptions(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entries = await dbContext.InventoryEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == "stock-list")
            .OrderBy(x => x.PrimaryField)
            .ToListAsync(cancellationToken);

        return Ok(entries.Select(ToInventoryOption).ToList());
    }

    [HttpGet("definitions")]
    public async Task<ActionResult<IReadOnlyList<RecipeDefinitionResponse>>> GetDefinitions(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var definitions = await recipeDefinitionRepository.GetAllAsync(cancellationToken);
        return Ok(definitions.Select(ToDefinitionResponse).ToList());
    }

    [HttpPost("definitions")]
    public async Task<ActionResult<RecipeDefinitionResponse>> CreateDefinition(
        [FromBody] UpsertRecipeDefinitionRequest request,
        CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var validationError = await ValidateDefinitionRequest(request, cancellationToken);
        if (validationError is not null)
        {
            return validationError;
        }

        var ingredients = await BuildDefinitionIngredientsAsync(request.Ingredients, cancellationToken);
        var entity = new RecipeDefinition
        {
            Id = Guid.NewGuid(),
            RecipeName = request.RecipeName.Trim(),
            OutputProductName = request.OutputProductName.Trim(),
            OutputSku = request.OutputSku?.Trim(),
            BatchYieldQuantity = request.BatchYieldQuantity,
            YieldUnit = request.YieldUnit.Trim(),
            IngredientsJson = JsonSerializer.Serialize(ingredients, JsonOptions),
            Instructions = request.Instructions?.Trim(),
            Status = request.Status.Trim(),
        };

        await recipeDefinitionRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetDefinitions), new { id = entity.Id }, ToDefinitionResponse(entity));
    }

    [HttpPut("definitions/{id:guid}")]
    public async Task<ActionResult<RecipeDefinitionResponse>> UpdateDefinition(
        Guid id,
        [FromBody] UpsertRecipeDefinitionRequest request,
        CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var validationError = await ValidateDefinitionRequest(request, cancellationToken);
        if (validationError is not null)
        {
            return validationError;
        }

        var ingredients = await BuildDefinitionIngredientsAsync(request.Ingredients, cancellationToken);
        var entity = await recipeDefinitionRepository.UpdateAsync(id, recipe =>
        {
            recipe.RecipeName = request.RecipeName.Trim();
            recipe.OutputProductName = request.OutputProductName.Trim();
            recipe.OutputSku = request.OutputSku?.Trim();
            recipe.BatchYieldQuantity = request.BatchYieldQuantity;
            recipe.YieldUnit = request.YieldUnit.Trim();
            recipe.IngredientsJson = JsonSerializer.Serialize(ingredients, JsonOptions);
            recipe.Instructions = request.Instructions?.Trim();
            recipe.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(ToDefinitionResponse(entity));
    }

    [HttpDelete("definitions/{id:guid}")]
    public async Task<IActionResult> DeleteDefinition(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var hasPlans = await dbContext.RecipePlans.AnyAsync(x => x.RecipeDefinitionId == id, cancellationToken);
        if (hasPlans)
        {
            return BadRequest(new { Error = "Delete recipe plans first before deleting this recipe." });
        }

        var deleted = await recipeDefinitionRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("plans")]
    public async Task<ActionResult<IReadOnlyList<RecipePlanResponse>>> GetPlans(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var plans = await recipePlanRepository.GetAllAsync(cancellationToken);
        return Ok(plans.Select(ToPlanResponse).ToList());
    }

    [HttpPost("plans")]
    public async Task<ActionResult<RecipePlanResponse>> CreatePlan(
        [FromBody] UpsertRecipePlanRequest request,
        CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (request.BatchCount <= 0)
        {
            return BadRequest(new { Error = "Batch count must be greater than zero." });
        }

        var recipe = await dbContext.RecipeDefinitions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.RecipeDefinitionId, cancellationToken);
        if (recipe is null)
        {
            return NotFound(new { Error = "Recipe definition not found." });
        }

        var planIngredients = await BuildPlanIngredientsAsync(recipe, request.BatchCount, cancellationToken);
        var entity = new RecipePlan
        {
            Id = Guid.NewGuid(),
            RecipeDefinitionId = recipe.Id,
            RecipeName = recipe.RecipeName,
            OutputProductName = recipe.OutputProductName,
            BatchCount = request.BatchCount,
            PlannedOutputQuantity = recipe.BatchYieldQuantity * request.BatchCount,
            YieldUnit = recipe.YieldUnit,
            PlannedDateUtc = request.PlannedDateUtc,
            IngredientsSnapshotJson = JsonSerializer.Serialize(planIngredients, JsonOptions),
            Notes = request.Notes?.Trim(),
            ExecutionStatus = "Planned",
            Status = request.Status.Trim(),
        };

        await recipePlanRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetPlans), new { id = entity.Id }, ToPlanResponse(entity));
    }

    [HttpPut("plans/{id:guid}")]
    public async Task<ActionResult<RecipePlanResponse>> UpdatePlan(
        Guid id,
        [FromBody] UpsertRecipePlanRequest request,
        CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        if (request.BatchCount <= 0)
        {
            return BadRequest(new { Error = "Batch count must be greater than zero." });
        }

        var existing = await dbContext.RecipePlans.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (existing is null)
        {
            return NotFound();
        }

        if (string.Equals(existing.ExecutionStatus, "Executed", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { Error = "Executed plans cannot be edited." });
        }

        var recipe = await dbContext.RecipeDefinitions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.RecipeDefinitionId, cancellationToken);
        if (recipe is null)
        {
            return NotFound(new { Error = "Recipe definition not found." });
        }

        var planIngredients = await BuildPlanIngredientsAsync(recipe, request.BatchCount, cancellationToken);
        existing.RecipeDefinitionId = recipe.Id;
        existing.RecipeName = recipe.RecipeName;
        existing.OutputProductName = recipe.OutputProductName;
        existing.BatchCount = request.BatchCount;
        existing.PlannedOutputQuantity = recipe.BatchYieldQuantity * request.BatchCount;
        existing.YieldUnit = recipe.YieldUnit;
        existing.PlannedDateUtc = request.PlannedDateUtc;
        existing.IngredientsSnapshotJson = JsonSerializer.Serialize(planIngredients, JsonOptions);
        existing.Notes = request.Notes?.Trim();
        existing.Status = request.Status.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToPlanResponse(existing));
    }

    [HttpDelete("plans/{id:guid}")]
    public async Task<IActionResult> DeletePlan(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await recipePlanRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("plans/{id:guid}/execute")]
    public async Task<ActionResult<ExecuteRecipePlanResponse>> ExecutePlan(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var plan = await dbContext.RecipePlans.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (plan is null)
        {
            return NotFound();
        }

        if (string.Equals(plan.ExecutionStatus, "Executed", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { Error = "This recipe plan has already been executed." });
        }

        var ingredients = DeserializePlanIngredients(plan.IngredientsSnapshotJson);
        if (ingredients.Count == 0)
        {
            return BadRequest(new { Error = "This recipe plan does not have any ingredient requirements." });
        }

        var ingredientIds = ingredients.Select(x => x.InventoryEntryId).Distinct().ToList();
        var stockEntries = await dbContext.InventoryEntries
            .Where(x => x.ScreenKey == "stock-list" && ingredientIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        foreach (var ingredient in ingredients)
        {
            if (!stockEntries.TryGetValue(ingredient.InventoryEntryId, out var stockEntry))
            {
                return BadRequest(new { Error = $"Inventory item '{ingredient.ItemName}' is missing from stock list." });
            }

            var availableQuantity = ParseDecimal(stockEntry.TertiaryField);
            if (availableQuantity < ingredient.RequiredQuantity)
            {
                return BadRequest(new
                {
                    Error = $"Insufficient inventory for '{ingredient.ItemName}'. Required {ingredient.RequiredQuantity:0.##}, available {availableQuantity:0.##}."
                });
            }
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var movementDate = DateTime.UtcNow;
        var movementReference = $"RECIPE-{movementDate:yyyyMMddHHmmss}-{plan.Id.ToString()[..8]}";
        var adjustments = new List<ExecutedIngredientAdjustment>();

        foreach (var ingredient in ingredients)
        {
            var stockEntry = stockEntries[ingredient.InventoryEntryId];
            var availableQuantity = ParseDecimal(stockEntry.TertiaryField);
            var remainingQuantity = availableQuantity - ingredient.RequiredQuantity;
            stockEntry.TertiaryField = remainingQuantity.ToString("0.##", CultureInfo.InvariantCulture);

            dbContext.InventoryEntries.Add(new InventoryEntry
            {
                Id = Guid.NewGuid(),
                ScreenKey = "stock-movement",
                PrimaryField = movementReference,
                SecondaryField = movementDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                TertiaryField = (-ingredient.RequiredQuantity).ToString("0.##", CultureInfo.InvariantCulture),
                QuaternaryField = $"{plan.RecipeName} -> {ingredient.ItemName}",
                Status = "Posted"
            });

            adjustments.Add(new ExecutedIngredientAdjustment(
                ingredient.ItemName,
                ingredient.RequiredQuantity,
                remainingQuantity,
                ingredient.Unit));
        }

        plan.ExecutionStatus = "Executed";
        plan.ExecutedAtUtc = movementDate;
        plan.Status = "Executed";

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new ExecuteRecipePlanResponse(
            plan.Id,
            plan.RecipeName,
            movementReference,
            movementDate,
            adjustments));
    }

    private async Task<ActionResult?> ValidateDefinitionRequest(
        UpsertRecipeDefinitionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.BatchYieldQuantity <= 0)
        {
            return BadRequest(new { Error = "Batch yield quantity must be greater than zero." });
        }

        if (request.Ingredients.Count == 0)
        {
            return BadRequest(new { Error = "Add at least one ingredient to the recipe." });
        }

        if (request.Ingredients.Any(x => x.QuantityPerBatch <= 0))
        {
            return BadRequest(new { Error = "Each ingredient quantity must be greater than zero." });
        }

        var ingredientIds = request.Ingredients.Select(x => x.InventoryEntryId).ToList();
        var validIds = await dbContext.InventoryEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == "stock-list" && ingredientIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (validIds.Count != ingredientIds.Distinct().Count())
        {
            return BadRequest(new { Error = "One or more selected ingredients do not exist in inventory stock list." });
        }

        return null;
    }

    private async Task<List<RecipeIngredientPayload>> BuildDefinitionIngredientsAsync(
        IReadOnlyList<RecipeIngredientRequest> ingredientRequests,
        CancellationToken cancellationToken)
    {
        var ingredientIds = ingredientRequests.Select(x => x.InventoryEntryId).Distinct().ToList();
        var stockEntries = await dbContext.InventoryEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == "stock-list" && ingredientIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        return ingredientRequests.Select(request =>
        {
            var stockEntry = stockEntries[request.InventoryEntryId];
            return new RecipeIngredientPayload(
                request.InventoryEntryId,
                stockEntry.PrimaryField,
                stockEntry.SecondaryField ?? string.Empty,
                request.Unit.Trim(),
                request.QuantityPerBatch);
        }).ToList();
    }

    private async Task<List<RecipePlanIngredientPayload>> BuildPlanIngredientsAsync(
        RecipeDefinition recipe,
        decimal batchCount,
        CancellationToken cancellationToken)
    {
        var definitionIngredients = DeserializeDefinitionIngredients(recipe.IngredientsJson);
        var ingredientIds = definitionIngredients.Select(x => x.InventoryEntryId).Distinct().ToList();
        var stockEntries = await dbContext.InventoryEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == "stock-list" && ingredientIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        return definitionIngredients.Select(ingredient =>
        {
            var availableQuantity = stockEntries.TryGetValue(ingredient.InventoryEntryId, out var stockEntry)
                ? ParseDecimal(stockEntry.TertiaryField)
                : 0m;

            return new RecipePlanIngredientPayload(
                ingredient.InventoryEntryId,
                ingredient.ItemName,
                ingredient.Sku,
                ingredient.Unit,
                ingredient.QuantityPerBatch,
                ingredient.QuantityPerBatch * batchCount,
                availableQuantity);
        }).ToList();
    }

    private static RecipeDefinitionResponse ToDefinitionResponse(RecipeDefinition definition)
    {
        return new RecipeDefinitionResponse(
            definition.Id,
            definition.RecipeName,
            definition.OutputProductName,
            definition.OutputSku,
            definition.BatchYieldQuantity,
            definition.YieldUnit,
            DeserializeDefinitionIngredients(definition.IngredientsJson)
                .Select(x => new RecipeIngredientResponse(
                    x.InventoryEntryId,
                    x.ItemName,
                    x.Sku,
                    x.Unit,
                    x.QuantityPerBatch))
                .ToList(),
            definition.Instructions,
            definition.Status);
    }

    private static RecipePlanResponse ToPlanResponse(RecipePlan plan)
    {
        return new RecipePlanResponse(
            plan.Id,
            plan.RecipeDefinitionId,
            plan.RecipeName,
            plan.OutputProductName,
            plan.BatchCount,
            plan.PlannedOutputQuantity,
            plan.YieldUnit,
            plan.PlannedDateUtc,
            DeserializePlanIngredients(plan.IngredientsSnapshotJson)
                .Select(x => new RecipePlanIngredientResponse(
                    x.InventoryEntryId,
                    x.ItemName,
                    x.Sku,
                    x.Unit,
                    x.QuantityPerBatch,
                    x.RequiredQuantity,
                    x.AvailableQuantity))
                .ToList(),
            plan.Notes,
            plan.ExecutionStatus,
            plan.ExecutedAtUtc,
            plan.Status);
    }

    private static InventoryOptionResponse ToInventoryOption(InventoryEntry entry)
    {
        return new InventoryOptionResponse(
            entry.Id,
            entry.PrimaryField,
            entry.SecondaryField ?? string.Empty,
            ParseDecimal(entry.TertiaryField),
            entry.QuaternaryField ?? string.Empty);
    }

    private static List<RecipeIngredientPayload> DeserializeDefinitionIngredients(string json)
    {
        return JsonSerializer.Deserialize<List<RecipeIngredientPayload>>(json, JsonOptions) ?? [];
    }

    private static List<RecipePlanIngredientPayload> DeserializePlanIngredients(string json)
    {
        return JsonSerializer.Deserialize<List<RecipePlanIngredientPayload>>(json, JsonOptions) ?? [];
    }

    private static decimal ParseDecimal(string? value)
    {
        return decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : 0m;
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

    private sealed record RecipeIngredientPayload(
        Guid InventoryEntryId,
        string ItemName,
        string Sku,
        string Unit,
        decimal QuantityPerBatch);

    private sealed record RecipePlanIngredientPayload(
        Guid InventoryEntryId,
        string ItemName,
        string Sku,
        string Unit,
        decimal QuantityPerBatch,
        decimal RequiredQuantity,
        decimal AvailableQuantity);
}

public sealed class UpsertRecipeDefinitionRequest
{
    [Required]
    [MaxLength(200)]
    public string RecipeName { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string OutputProductName { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? OutputSku { get; set; }

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal BatchYieldQuantity { get; set; }

    [Required]
    [MaxLength(40)]
    public string YieldUnit { get; set; } = string.Empty;

    [Required]
    public List<RecipeIngredientRequest> Ingredients { get; set; } = [];

    public string? Instructions { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Draft";
}

public sealed class RecipeIngredientRequest
{
    [Required]
    public Guid InventoryEntryId { get; set; }

    [Required]
    [MaxLength(40)]
    public string Unit { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal QuantityPerBatch { get; set; }
}

public sealed class UpsertRecipePlanRequest
{
    [Required]
    public Guid RecipeDefinitionId { get; set; }

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal BatchCount { get; set; }

    public DateTime? PlannedDateUtc { get; set; }

    public string? Notes { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Planned";
}

public sealed record InventoryOptionResponse(
    Guid Id,
    string ItemName,
    string Sku,
    decimal AvailableQuantity,
    string ValuationLabel);

public sealed record RecipeIngredientResponse(
    Guid InventoryEntryId,
    string ItemName,
    string Sku,
    string Unit,
    decimal QuantityPerBatch);

public sealed record RecipeDefinitionResponse(
    Guid Id,
    string RecipeName,
    string OutputProductName,
    string? OutputSku,
    decimal BatchYieldQuantity,
    string YieldUnit,
    IReadOnlyList<RecipeIngredientResponse> Ingredients,
    string? Instructions,
    string Status);

public sealed record RecipePlanIngredientResponse(
    Guid InventoryEntryId,
    string ItemName,
    string Sku,
    string Unit,
    decimal QuantityPerBatch,
    decimal RequiredQuantity,
    decimal AvailableQuantity);

public sealed record RecipePlanResponse(
    Guid Id,
    Guid RecipeDefinitionId,
    string RecipeName,
    string OutputProductName,
    decimal BatchCount,
    decimal PlannedOutputQuantity,
    string YieldUnit,
    DateTime? PlannedDateUtc,
    IReadOnlyList<RecipePlanIngredientResponse> Ingredients,
    string? Notes,
    string ExecutionStatus,
    DateTime? ExecutedAtUtc,
    string Status);

public sealed record ExecutedIngredientAdjustment(
    string ItemName,
    decimal ConsumedQuantity,
    decimal RemainingQuantity,
    string Unit);

public sealed record ExecuteRecipePlanResponse(
    Guid PlanId,
    string RecipeName,
    string MovementReference,
    DateTime ExecutedAtUtc,
    IReadOnlyList<ExecutedIngredientAdjustment> Adjustments);
