namespace SharvSuite.Server.Domain;

public class InvoiceGenerationEntry : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string InvoiceNumber { get; set; } = default!;
    public string SubscriberName { get; set; } = default!;
    public DateOnly InvoiceDate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Generated";
}
