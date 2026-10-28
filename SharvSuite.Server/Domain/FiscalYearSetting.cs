namespace SharvSuite.Server.Domain;

public class FiscalYearSetting : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string FiscalYear { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string BookStatus { get; set; } = default!;
}
