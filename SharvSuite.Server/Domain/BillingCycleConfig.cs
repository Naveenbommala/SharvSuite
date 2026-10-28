namespace SharvSuite.Server.Domain;

public class BillingCycleConfig : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string CycleName { get; set; } = default!;
    public string Frequency { get; set; } = default!;
    public int GraceDays { get; set; }
    public string Status { get; set; } = "Active";
}
