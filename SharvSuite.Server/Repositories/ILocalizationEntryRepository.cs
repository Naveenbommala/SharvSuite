using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface ILocalizationEntryRepository
{
    Task<IReadOnlyList<LocalizationEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<LocalizationEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<LocalizationEntry> AddAsync(LocalizationEntry entry, CancellationToken cancellationToken);
    Task<LocalizationEntry?> UpdateAsync(Guid id, Action<LocalizationEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
