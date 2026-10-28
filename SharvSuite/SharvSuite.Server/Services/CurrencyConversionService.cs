using Microsoft.Extensions.Options;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Services;

public class CurrencyConversionService(IOptions<CurrencyConversionOptions> options) : ICurrencyConversionService
{
    private readonly CurrencyConversionOptions _options = options.Value;

    public Money Convert(Money source, string targetCurrencyCode)
    {
        if (string.IsNullOrWhiteSpace(source.CurrencyCode))
        {
            throw new ArgumentException("Source currency code is required.", nameof(source));
        }

        if (string.IsNullOrWhiteSpace(targetCurrencyCode))
        {
            throw new ArgumentException("Target currency code is required.", nameof(targetCurrencyCode));
        }

        var fromCode = source.CurrencyCode.Trim().ToUpperInvariant();
        var toCode = targetCurrencyCode.Trim().ToUpperInvariant();

        if (fromCode == toCode)
        {
            return new Money(source.Amount, toCode);
        }

        var baseCode = _options.BaseCurrencyCode.Trim().ToUpperInvariant();
        var fromRate = ResolveRate(fromCode, baseCode);
        var toRate = ResolveRate(toCode, baseCode);

        var amountInBase = source.Amount / fromRate;
        var converted = amountInBase * toRate;

        return new Money(decimal.Round(converted, 2, MidpointRounding.AwayFromZero), toCode);
    }

    private decimal ResolveRate(string currencyCode, string baseCode)
    {
        if (currencyCode == baseCode)
        {
            return 1m;
        }

        if (!_options.Rates.TryGetValue(currencyCode, out var rate) || rate <= 0m)
        {
            throw new InvalidOperationException($"No conversion rate configured for currency '{currencyCode}'.");
        }

        return rate;
    }
}
