namespace SharvSuite.Server.Domain;

public class RegionalSetting : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Country { get; set; } = default!;
    public string Timezone { get; set; } = default!;
    public string? DateFormat { get; set; }
    public string? NumberFormat { get; set; }
    public string Status { get; set; } = "Draft";
}
