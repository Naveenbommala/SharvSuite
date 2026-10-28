using SharvSuite.Server.Domain;

namespace SharvSuite.Server.Repositories;

public interface IGlobalSettingRepository
{
    Task<IReadOnlyList<GlobalSettingEntry>> GetByScreenAsync(string screenKey, CancellationToken cancellationToken);
    Task<GlobalSettingEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<GlobalSettingEntry> AddAsync(GlobalSettingEntry entry, CancellationToken cancellationToken);
    Task<GlobalSettingEntry?> UpdateAsync(Guid id, Action<GlobalSettingEntry> updateAction, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
