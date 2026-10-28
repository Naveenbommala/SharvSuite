using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class InvoicingEntryRepository(AppDbContext dbContext) : IInvoicingEntryRepository
{
    public async Task<IReadOnlyList<InvoicingEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken)
    {
        return await dbContext.InvoicingEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<InvoicingEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.InvoicingEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<InvoicingEntry> AddAsync(InvoicingEntry entry, CancellationToken cancellationToken)
    {
        dbContext.InvoicingEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<InvoicingEntry?> UpdateAsync(Guid id, Action<InvoicingEntry> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.InvoicingEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.InvoicingEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.InvoicingEntries.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
