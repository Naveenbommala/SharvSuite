using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Tenancy;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/users-roles")]
public sealed class UsersRolesController(
    ITenantEntityRepository<UserAccount> userAccountRepository,
    ITenantEntityRepository<UserInvitation> invitationRepository,
    ITenantEntityRepository<RoleDefinition> roleRepository,
    ITenantEntityRepository<PermissionMatrixEntry> permissionRepository,
    ITenantContext tenantContext) : ControllerBase
{
    [HttpGet("user-list")]
    public async Task<ActionResult<IReadOnlyList<UserAccount>>> GetUsers(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await userAccountRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("user-list")]
    public async Task<ActionResult<UserAccount>> CreateUser([FromBody] UpsertUserAccountRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new UserAccount
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            RoleName = request.RoleName.Trim(),
            Status = request.Status.Trim()
        };

        await userAccountRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetUserById), new { id = entity.Id }, entity);
    }

    [HttpGet("user-list/{id:guid}")]
    public async Task<ActionResult<UserAccount>> GetUserById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await userAccountRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("user-list/{id:guid}")]
    public async Task<ActionResult<UserAccount>> UpdateUser(Guid id, [FromBody] UpsertUserAccountRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await userAccountRepository.UpdateAsync(id, x =>
        {
            x.FullName = request.FullName.Trim();
            x.Email = request.Email.Trim();
            x.RoleName = request.RoleName.Trim();
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("user-list/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await userAccountRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("invite-user")]
    public async Task<ActionResult<IReadOnlyList<UserInvitation>>> GetInvites(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await invitationRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("invite-user")]
    public async Task<ActionResult<UserInvitation>> CreateInvite([FromBody] UpsertUserInvitationRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new UserInvitation
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim(),
            RoleName = request.RoleName.Trim(),
            ExpiresOn = request.ExpiresOn,
            Status = request.Status.Trim()
        };

        await invitationRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetInviteById), new { id = entity.Id }, entity);
    }

    [HttpGet("invite-user/{id:guid}")]
    public async Task<ActionResult<UserInvitation>> GetInviteById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await invitationRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("invite-user/{id:guid}")]
    public async Task<ActionResult<UserInvitation>> UpdateInvite(Guid id, [FromBody] UpsertUserInvitationRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await invitationRepository.UpdateAsync(id, x =>
        {
            x.Email = request.Email.Trim();
            x.RoleName = request.RoleName.Trim();
            x.ExpiresOn = request.ExpiresOn;
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("invite-user/{id:guid}")]
    public async Task<IActionResult> DeleteInvite(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await invitationRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("role-management")]
    public async Task<ActionResult<IReadOnlyList<RoleDefinition>>> GetRoles(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await roleRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("role-management")]
    public async Task<ActionResult<RoleDefinition>> CreateRole([FromBody] UpsertRoleDefinitionRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new RoleDefinition
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DataScope = request.DataScope.Trim(),
            Status = request.Status.Trim()
        };

        await roleRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetRoleById), new { id = entity.Id }, entity);
    }

    [HttpGet("role-management/{id:guid}")]
    public async Task<ActionResult<RoleDefinition>> GetRoleById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await roleRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("role-management/{id:guid}")]
    public async Task<ActionResult<RoleDefinition>> UpdateRole(Guid id, [FromBody] UpsertRoleDefinitionRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await roleRepository.UpdateAsync(id, x =>
        {
            x.Name = request.Name.Trim();
            x.Description = request.Description?.Trim();
            x.DataScope = request.DataScope.Trim();
            x.Status = request.Status.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("role-management/{id:guid}")]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await roleRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("permissions-matrix")]
    public async Task<ActionResult<IReadOnlyList<PermissionMatrixEntry>>> GetPermissions(CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        return Ok(await permissionRepository.GetAllAsync(cancellationToken));
    }

    [HttpPost("permissions-matrix")]
    public async Task<ActionResult<PermissionMatrixEntry>> CreatePermission([FromBody] UpsertPermissionMatrixRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = new PermissionMatrixEntry
        {
            Id = Guid.NewGuid(),
            RoleName = request.RoleName.Trim(),
            ModuleName = request.ModuleName.Trim(),
            ActionPermissions = request.ActionPermissions.Trim(),
            DataScope = request.DataScope.Trim()
        };

        await permissionRepository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetPermissionById), new { id = entity.Id }, entity);
    }

    [HttpGet("permissions-matrix/{id:guid}")]
    public async Task<ActionResult<PermissionMatrixEntry>> GetPermissionById(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await permissionRepository.GetByIdAsync(id, cancellationToken);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("permissions-matrix/{id:guid}")]
    public async Task<ActionResult<PermissionMatrixEntry>> UpdatePermission(Guid id, [FromBody] UpsertPermissionMatrixRequest request, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var entity = await permissionRepository.UpdateAsync(id, x =>
        {
            x.RoleName = request.RoleName.Trim();
            x.ModuleName = request.ModuleName.Trim();
            x.ActionPermissions = request.ActionPermissions.Trim();
            x.DataScope = request.DataScope.Trim();
        }, cancellationToken);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("permissions-matrix/{id:guid}")]
    public async Task<IActionResult> DeletePermission(Guid id, CancellationToken cancellationToken)
    {
        if (!EnsureTenantResolved(out var error))
        {
            return error;
        }

        var deleted = await permissionRepository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private bool EnsureTenantResolved(out ActionResult errorResult)
    {
        if (tenantContext.TenantId.HasValue)
        {
            errorResult = Ok();
            return true;
        }

        errorResult = BadRequest(new
        {
            Error = "Tenant header is required. Set X-Tenant to a valid tenant slug."
        });
        return false;
    }
}

public sealed class UpsertUserAccountRequest
{
    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string RoleName { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active";
}

public sealed class UpsertUserInvitationRequest
{
    [Required]
    [MaxLength(200)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string RoleName { get; set; } = string.Empty;

    [Required]
    public DateOnly ExpiresOn { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Pending";
}

public sealed class UpsertRoleDefinitionRequest
{
    [Required]
    [MaxLength(80)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(40)]
    public string DataScope { get; set; } = "Own";

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active";
}

public sealed class UpsertPermissionMatrixRequest
{
    [Required]
    [MaxLength(80)]
    public string RoleName { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string ModuleName { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string ActionPermissions { get; set; } = string.Empty;

    [Required]
    [MaxLength(40)]
    public string DataScope { get; set; } = "Own";
}
