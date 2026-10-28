namespace SharvSuite.Server.Domain;

public class PaymentTrackingEntry : ITenantOwned
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ReferenceNumber { get; set; } = default!;
    public string InvoiceNumber { get; set; } = default!;
    public decimal AmountPaid { get; set; }
    public DateOnly PaidOn { get; set; }
    public string PaymentStatus { get; set; } = "Pending";
}
