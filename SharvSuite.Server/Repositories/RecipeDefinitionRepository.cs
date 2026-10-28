using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class RecipeDefinitionRepository(AppDbContext dbContext) : IRecipeDefinitionRepository
{
    public async Task<IReadOnlyList<RecipeDefinition>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.RecipeDefinitions
            .AsNoTracking()
            .OrderBy(x => x.RecipeName)
            .ToListAsync(cancellationToken);
    }

    public async Task<RecipeDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.RecipeDefinitions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<RecipeDefinition> AddAsync(RecipeDefinition entity, CancellationToken cancellationToken)
    {
        dbContext.RecipeDefinitions.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<RecipeDefinition?> UpdateAsync(Guid id, Action<RecipeDefinition> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.RecipeDefinitions.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        updateAction(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await dbContext.RecipeDefinitions.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.RecipeDefinitions.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
