namespace SharvSuite.Server.Domain;

public class CustomerEntry : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ScreenKey { get; set; } = default!;
    public string PrimaryField { get; set; } = default!;
    public string? SecondaryField { get; set; }
    public string? TertiaryField { get; set; }
    public string? QuaternaryField { get; set; }
    public Guid? CustomerId { get; set; }
    public string Status { get; set; } = "Active";
}
