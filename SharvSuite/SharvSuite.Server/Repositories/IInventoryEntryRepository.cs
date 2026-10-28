using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IInventoryEntryRepository
{
    Task<IReadOnlyList<InventoryEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<InventoryEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<InventoryEntry> AddAsync(InventoryEntry entry, CancellationToken cancellationToken);
    Task<InventoryEntry?> UpdateAsync(Guid id, Action<InventoryEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
