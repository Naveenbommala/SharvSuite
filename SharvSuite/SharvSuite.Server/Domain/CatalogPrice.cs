namespace SharvSuite.Server.Domain;

public class CatalogPrice : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ItemName { get; set; } = default!;
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = default!;
}
