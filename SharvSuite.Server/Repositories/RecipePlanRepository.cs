using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class RecipePlanRepository(AppDbContext dbContext) : IRecipePlanRepository
{
    public async Task<IReadOnlyList<RecipePlan>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.RecipePlans
            .AsNoTracking()
            .OrderByDescending(x => x.PlannedDateUtc)
            .ThenByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<RecipePlan?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.RecipePlans
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<RecipePlan> AddAsync(RecipePlan entity, CancellationToken cancellationToken)
    {
        dbContext.RecipePlans.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<RecipePlan?> UpdateAsync(Guid id, Action<RecipePlan> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.RecipePlans.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.RecipePlans.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.RecipePlans.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
