namespace SharvSuite.Server.Tenancy;

public interface ITenantContext
{
    Guid? TenantId { get; }
    string? TenantSlug { get; }
    string? DefaultCurrencyCode { get; }
}
