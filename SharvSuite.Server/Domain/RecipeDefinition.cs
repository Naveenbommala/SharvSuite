namespace SharvSuite.Server.Domain;

public sealed class RecipeDefinition : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string RecipeName { get; set; } = string.Empty;
    public string OutputProductName { get; set; } = string.Empty;
    public string? OutputSku { get; set; }
    public decimal BatchYieldQuantity { get; set; }
    public string YieldUnit { get; set; } = string.Empty;
    public string IngredientsJson { get; set; } = "[]";
    public string? Instructions { get; set; }
    public string Status { get; set; } = "Draft";
}
