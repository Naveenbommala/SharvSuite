namespace SharvSuite.Server.Domain;

public sealed class RecipePlan : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid RecipeDefinitionId { get; set; }
    public string RecipeName { get; set; } = string.Empty;
    public string OutputProductName { get; set; } = string.Empty;
    public decimal BatchCount { get; set; }
    public decimal PlannedOutputQuantity { get; set; }
    public string YieldUnit { get; set; } = string.Empty;
    public DateTime? PlannedDateUtc { get; set; }
    public string IngredientsSnapshotJson { get; set; } = "[]";
    public string? Notes { get; set; }
    public string ExecutionStatus { get; set; } = "Planned";
    public DateTime? ExecutedAtUtc { get; set; }
    public string Status { get; set; } = "Planned";
}
