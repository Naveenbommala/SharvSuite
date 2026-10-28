namespace SharvSuite.Server.Domain;

public class BusinessPreference : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string InvoicePrefix { get; set; } = default!;
    public string PaymentTerms { get; set; } = default!;
    public string? DefaultLanguage { get; set; }
    public string Status { get; set; } = "Draft";
}
