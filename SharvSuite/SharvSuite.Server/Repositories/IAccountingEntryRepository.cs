using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IAccountingEntryRepository
{
    Task<IReadOnlyList<AccountingEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<AccountingEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<AccountingEntry> AddAsync(AccountingEntry entry, CancellationToken cancellationToken);
    Task<AccountingEntry?> UpdateAsync(Guid id, Action<AccountingEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
