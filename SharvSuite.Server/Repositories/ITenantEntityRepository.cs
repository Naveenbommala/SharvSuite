using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface ITenantEntityRepository<T> where T : class, ITenantOwned
{
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken);
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken);
    Task<T?> UpdateAsync(Guid id, Action<T> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
