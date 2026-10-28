namespace SharvSuite.Server.Domain;

public class UserInvitation : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = default!;
    public string RoleName { get; set; } = default!;
    public DateOnly ExpiresOn { get; set; }
    public string Status { get; set; } = "Pending";
}
