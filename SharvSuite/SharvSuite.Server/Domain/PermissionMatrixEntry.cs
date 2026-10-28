namespace SharvSuite.Server.Domain;

public class PermissionMatrixEntry : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string RoleName { get; set; } = default!;
    public string ModuleName { get; set; } = default!;
    public string ActionPermissions { get; set; } = default!;
    public string DataScope { get; set; } = "Own";
}
