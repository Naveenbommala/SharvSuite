namespace SharvSuite.Server.Domain;

public class Currency
{
    public string Code { get; set; } = default!; // ISO code, e.g. USD
    public string Name { get; set; } = default!;
    public string Symbol { get; set; } = default!;
}


