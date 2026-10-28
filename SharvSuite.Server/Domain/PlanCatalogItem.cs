namespace SharvSuite.Server.Domain;

public class PlanCatalogItem : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string PlanCode { get; set; } = default!;
    public string PlanName { get; set; } = default!;
    public decimal Price { get; set; }
    public string BillingFrequency { get; set; } = "Monthly";
    public string Status { get; set; } = "Active";
}
