using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IExpenseEntryRepository
{
    Task<IReadOnlyList<ExpenseEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<ExpenseEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ExpenseEntry> AddAsync(ExpenseEntry entry, CancellationToken cancellationToken);
    Task<ExpenseEntry?> UpdateAsync(Guid id, Action<ExpenseEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
