using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IRecipeDefinitionRepository
{
    Task<IReadOnlyList<RecipeDefinition>> GetAllAsync(CancellationToken cancellationToken);
    Task<RecipeDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<RecipeDefinition> AddAsync(RecipeDefinition entity, CancellationToken cancellationToken);
    Task<RecipeDefinition?> UpdateAsync(Guid id, Action<RecipeDefinition> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
