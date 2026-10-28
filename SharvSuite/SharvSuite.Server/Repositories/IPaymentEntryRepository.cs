using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IPaymentEntryRepository
{
    Task<IReadOnlyList<PaymentEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<PaymentEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<PaymentEntry> AddAsync(PaymentEntry entry, CancellationToken cancellationToken);
    Task<PaymentEntry?> UpdateAsync(Guid id, Action<PaymentEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
