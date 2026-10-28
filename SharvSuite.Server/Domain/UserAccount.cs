namespace SharvSuite.Server.Domain;

public class UserAccount : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string RoleName { get; set; } = default!;
    public string Status { get; set; } = "Active";
}
