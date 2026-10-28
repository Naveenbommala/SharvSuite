using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Services;

public interface ICurrencyConversionService
{
    Money Convert(Money source, string targetCurrencyCode);
}
