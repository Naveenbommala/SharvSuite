using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IRecipePlanRepository
{
    Task<IReadOnlyList<RecipePlan>> GetAllAsync(CancellationToken cancellationToken);
    Task<RecipePlan?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<RecipePlan> AddAsync(RecipePlan entity, CancellationToken cancellationToken);
    Task<RecipePlan?> UpdateAsync(Guid id, Action<RecipePlan> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
