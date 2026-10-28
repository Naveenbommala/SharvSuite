using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IInvoicingEntryRepository
{
    Task<IReadOnlyList<InvoicingEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<InvoicingEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<InvoicingEntry> AddAsync(InvoicingEntry entry, CancellationToken cancellationToken);
    Task<InvoicingEntry?> UpdateAsync(Guid id, Action<InvoicingEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
