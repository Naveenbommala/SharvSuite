using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class GlobalSettingRepository(AppDbContext dbContext) : IGlobalSettingRepository
{
    public async Task<IReadOnlyList<GlobalSettingEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken)
    {
        return await dbContext.GlobalSettingEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<GlobalSettingEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.GlobalSettingEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<GlobalSettingEntry> AddAsync(GlobalSettingEntry entry, CancellationToken cancellationToken)
    {
        dbContext.GlobalSettingEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<GlobalSettingEntry?> UpdateAsync(Guid id, Action<GlobalSettingEntry> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.GlobalSettingEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.GlobalSettingEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.GlobalSettingEntries.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
