using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Data;
using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public sealed class TenantEntityRepository<T>(AppDbContext dbContext) : ITenantEntityRepository<T>
    where T : class, ITenantOwned
{
    private readonly DbSet<T> _set = dbContext.Set<T>();

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _set
            .AsNoTracking()
            .OrderByDescending(x => EF.Property<Guid>(x, "Id"))
            .ToListAsync(cancellationToken);
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _set
            .AsNoTracking()
            .SingleOrDefaultAsync(x => EF.Property<Guid>(x, "Id") == id, cancellationToken);
    }

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken)
    {
        _set.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<T?> UpdateAsync(Guid id, Action<T> updateAction, CancellationToken cancellationToken)
    {
        var entity = await _set
            .SingleOrDefaultAsync(x => EF.Property<Guid>(x, "Id") == id, cancellationToken);

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
        var entity = await _set
            .SingleOrDefaultAsync(x => EF.Property<Guid>(x, "Id") == id, cancellationToken);

        if (entity is null)
        {
            return false;
        }

        _set.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
