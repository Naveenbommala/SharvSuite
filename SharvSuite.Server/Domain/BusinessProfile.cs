namespace SharvSuite.Server.Domain;

public class BusinessProfile : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string DisplayName { get; set; } = default!;
    public string? Industry { get; set; }
    public string? Website { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = "Draft";
}
