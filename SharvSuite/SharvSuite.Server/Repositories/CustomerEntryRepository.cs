using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Models;

namespace SharvSuite.Server.Repositories;

public sealed class CustomerEntryRepository(AppDbContext dbContext) : ICustomerEntryRepository
{
    public async Task<IReadOnlyList<CustomerEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken)
    {
        return await dbContext.CustomerEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<CustomerEntry>> GetByScreenPagedAsync(
        string screenKey,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.CustomerEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomerEntry>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<CustomerEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.CustomerEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<CustomerEntry> AddAsync(CustomerEntry entry, CancellationToken cancellationToken)
    {
        dbContext.CustomerEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<CustomerEntry?> UpdateAsync(Guid id, Action<CustomerEntry> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.CustomerEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.CustomerEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.CustomerEntries.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
