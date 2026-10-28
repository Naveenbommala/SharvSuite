namespace SharvSuite.Server.Services;

public class CurrencyConversionOptions
{
    public const string SectionName = "CurrencyConversion";

    public string BaseCurrencyCode { get; set; } = "USD";
    public Dictionary<string, decimal> Rates { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
