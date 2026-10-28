namespace SharvSuite.Server.Tenancy;

public class TenantResolutionOptions
{
    public const string SectionName = "TenantResolution";

    public TenantResolutionStrategy Strategy { get; set; } = TenantResolutionStrategy.Header;
    public string HeaderName { get; set; } = "X-Tenant";
    public string PathPrefix { get; set; } = "t";
    public string RootDomain { get; set; } = "localhost";
}
