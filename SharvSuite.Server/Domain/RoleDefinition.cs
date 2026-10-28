namespace SharvSuite.Server.Domain;

public class RoleDefinition : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string DataScope { get; set; } = "Own";
    public string Status { get; set; } = "Active";
}
