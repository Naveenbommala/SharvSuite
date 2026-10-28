namespace SharvSuite.Server.Domain;

public class BusinessRecord : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string BusinessName { get; set; } = default!;
    public string LegalName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Phone { get; set; }
    public string Status { get; set; } = "Draft";
}
