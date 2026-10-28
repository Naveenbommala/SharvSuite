using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IProductServiceEntryRepository
{
    Task<IReadOnlyList<ProductServiceEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<ProductServiceEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ProductServiceEntry> AddAsync(ProductServiceEntry entry, CancellationToken cancellationToken);
    Task<ProductServiceEntry?> UpdateAsync(Guid id, Action<ProductServiceEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
