using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IPurchaseEntryRepository
{
    Task<IReadOnlyList<PurchaseEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<PurchaseEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<PurchaseEntry> AddAsync(PurchaseEntry entry, CancellationToken cancellationToken);
    Task<PurchaseEntry?> UpdateAsync(Guid id, Action<PurchaseEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
