namespace SharvSuite.Server.Domain;

public class SubscriptionLifecycleEntry : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string SubscriberName { get; set; } = default!;
    public string PlanCode { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string State { get; set; } = "Active";
}
