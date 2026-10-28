using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class ProductServiceEntryRepository(AppDbContext dbContext) : IProductServiceEntryRepository
{
    public async Task<IReadOnlyList<ProductServiceEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken)
    {
        return await dbContext.ProductServiceEntries
            .AsNoTracking()
            .Where(x => x.ScreenKey == screenKey)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductServiceEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.ProductServiceEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<ProductServiceEntry> AddAsync(ProductServiceEntry entry, CancellationToken cancellationToken)
    {
        dbContext.ProductServiceEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<ProductServiceEntry?> UpdateAsync(Guid id, Action<ProductServiceEntry> updateAction, CancellationToken cancellationToken)
    {
        var entity = await dbContext.ProductServiceEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
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
        var entity = await dbContext.ProductServiceEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        dbContext.ProductServiceEntries.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
