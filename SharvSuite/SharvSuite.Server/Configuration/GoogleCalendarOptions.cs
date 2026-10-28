namespace SharvSuite.Server.Configuration;

public sealed class GoogleCalendarOptions
{
    public const string SectionName = "GoogleCalendar";

    public string ClientId { get; init; } = string.Empty;
}
