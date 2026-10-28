using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IReportEntryRepository
{
    Task<IReadOnlyList<ReportEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<ReportEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ReportEntry> AddAsync(ReportEntry entry, CancellationToken cancellationToken);
    Task<ReportEntry?> UpdateAsync(Guid id, Action<ReportEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
