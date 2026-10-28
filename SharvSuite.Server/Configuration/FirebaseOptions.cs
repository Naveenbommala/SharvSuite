namespace SharvSuite.Server.Configuration;

public sealed class FirebaseOptions
{
    public const string SectionName = "Firebase";

    public string ApiKey { get; init; } = string.Empty;

    public string AuthDomain { get; init; } = string.Empty;

    public string ProjectId { get; init; } = string.Empty;

    public string StorageBucket { get; init; } = string.Empty;

    public string MessagingSenderId { get; init; } = string.Empty;

    public string AppId { get; init; } = string.Empty;
}
