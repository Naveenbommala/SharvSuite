using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class PurchaseEntryRepository(AppDbContext dbContext) : IPurchaseEntryRepository
{
    public async Task<IReadOnlyList<PurchaseEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken)
    {
        return await dbContext.PurchaseEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<PurchaseEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.PurchaseEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PurchaseEntry> AddAsync(PurchaseEntry entry, CancellationToken cancellationToken)
    {
        dbContext.PurchaseEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<PurchaseEntry?> UpdateAsync(Guid id, Action<PurchaseEntry> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.PurchaseEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.PurchaseEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.PurchaseEntries.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
