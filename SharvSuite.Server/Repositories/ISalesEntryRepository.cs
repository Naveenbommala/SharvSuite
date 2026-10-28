using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface ISalesEntryRepository
{
    Task<IReadOnlyList<SalesEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<SalesEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<SalesEntry> AddAsync(SalesEntry entry, CancellationToken cancellationToken);
    Task<SalesEntry?> UpdateAsync(Guid id, Action<SalesEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
