namespace SharvSuite.Server.Domain;

public interface ITenantOwned
{
    Guid TenantId { get; set; }
}
