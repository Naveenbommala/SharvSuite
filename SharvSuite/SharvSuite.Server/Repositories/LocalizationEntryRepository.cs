using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class LocalizationEntryRepository(AppDbContext dbContext) : ILocalizationEntryRepository
{
    public async Task<IReadOnlyList<LocalizationEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken)
    {
        return await dbContext.LocalizationEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<LocalizationEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.LocalizationEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<LocalizationEntry> AddAsync(LocalizationEntry entry, CancellationToken cancellationToken)
    {
        dbContext.LocalizationEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<LocalizationEntry?> UpdateAsync(Guid id, Action<LocalizationEntry> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.LocalizationEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.LocalizationEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.LocalizationEntries.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
