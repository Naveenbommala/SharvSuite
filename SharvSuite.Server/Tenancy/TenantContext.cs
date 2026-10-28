namespace SharvSuite.Server.Tenancy;

public class TenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }
    public string? TenantSlug { get; private set; }
    public string? DefaultCurrencyCode { get; private set; }

    public void SetTenant(Guid tenantId, string tenantSlug, string? defaultCurrencyCode)
    {
        TenantId = tenantId;
        TenantSlug = tenantSlug;
        DefaultCurrencyCode = defaultCurrencyCode;
    }
}
