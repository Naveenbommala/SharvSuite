using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class AccountingEntryRepository(AppDbContext dbContext) : IAccountingEntryRepository
{
    public async Task<IReadOnlyList<AccountingEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken)
    {
        return await dbContext.AccountingEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<AccountingEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.AccountingEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<AccountingEntry> AddAsync(AccountingEntry entry, CancellationToken cancellationToken)
    {
        dbContext.AccountingEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<AccountingEntry?> UpdateAsync(Guid id, Action<AccountingEntry> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.AccountingEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.AccountingEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.AccountingEntries.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
