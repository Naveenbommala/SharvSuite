using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IVendorEntryRepository
{
    Task<IReadOnlyList<VendorEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<VendorEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<VendorEntry> AddAsync(VendorEntry entry, CancellationToken cancellationToken);
    Task<VendorEntry?> UpdateAsync(Guid id, Action<VendorEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
