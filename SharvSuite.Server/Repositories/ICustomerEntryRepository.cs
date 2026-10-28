using SharvSuite.Server.Domain;
using SharvSuite.Server.Models;

namespace SharvSuite.Server.Repositories;

public interface ICustomerEntryRepository
{
    Task<IReadOnlyList<CustomerEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<PagedResult<CustomerEntry>> GetByScreenPagedAsync(string screenKey, int page, int pageSize, CancellationToken cancellationToken);
    Task<CustomerEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<CustomerEntry> AddAsync(CustomerEntry entry, CancellationToken cancellationToken);
    Task<CustomerEntry?> UpdateAsync(Guid id, Action<CustomerEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
