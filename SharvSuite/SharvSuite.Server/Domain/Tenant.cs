namespace SharvSuite.Server.Domain;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!; // e.g. company-a
    public string? DefaultCurrencyCode { get; set; } // e.g. USD
}


