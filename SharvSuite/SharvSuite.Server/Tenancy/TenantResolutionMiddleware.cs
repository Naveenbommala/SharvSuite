using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SharvSuite.Server.Data;

namespace SharvSuite.Server.Tenancy;

public class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        AppDbContext dbContext,
        TenantContext tenantContext,
        IOptions<TenantResolutionOptions> options)
    {
        var slug = ResolveTenantSlug(context, options.Value);
        if (string.IsNullOrWhiteSpace(slug))
        {
            await next(context);
            return;
        }

        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(t => t.Slug == slug, context.RequestAborted);

        if (tenant is null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new
            {
                Error = $"Unknown tenant '{slug}'."
            }, context.RequestAborted);
            return;
        }

        tenantContext.SetTenant(tenant.Id, tenant.Slug, tenant.DefaultCurrencyCode);

        await next(context);
    }

    private static string? ResolveTenantSlug(HttpContext context, TenantResolutionOptions options)
    {
        return options.Strategy switch
        {
            TenantResolutionStrategy.Header => ResolveFromHeader(context, options.HeaderName),
            TenantResolutionStrategy.Path => ResolveFromPath(context, options.PathPrefix),
            TenantResolutionStrategy.Subdomain => ResolveFromSubdomain(context, options.RootDomain),
            _ => null
        };
    }

    private static string? ResolveFromHeader(HttpContext context, string headerName)
    {
        if (!context.Request.Headers.TryGetValue(headerName, out var values))
        {
            return null;
        }

        var raw = values.FirstOrDefault();
        return string.IsNullOrWhiteSpace(raw) ? null : raw.Trim().ToLowerInvariant();
    }

    private static string? ResolveFromPath(HttpContext context, string pathPrefix)
    {
        var path = context.Request.Path.Value;
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (segments.Length < 2)
        {
            return null;
        }

        if (!string.Equals(segments[0], pathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return segments[1].ToLowerInvariant();
    }

    private static string? ResolveFromSubdomain(HttpContext context, string rootDomain)
    {
        var host = context.Request.Host.Host;
        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        if (!host.EndsWith(rootDomain, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var suffix = $".{rootDomain}";
        if (!host.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var candidate = host[..^suffix.Length];
        return string.IsNullOrWhiteSpace(candidate) ? null : candidate.ToLowerInvariant();
    }
}
