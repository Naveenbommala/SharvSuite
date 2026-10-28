using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Domain;
using SharvSuite.Server.Tenancy;
using System.Linq.Expressions;

namespace SharvSuite.Server.Data;

public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ITenantContext tenantContext) : DbContext(options)
{
    private static readonly Guid AlphaTenantId = Guid.Parse("a2e9f971-44fb-47b6-8ad0-bf7bf33f7145");
    private static readonly Guid BetaTenantId = Guid.Parse("7bd41f55-cbb3-41ef-ace3-eab1d29718c6");
    private readonly ITenantContext _tenantContext = tenantContext;

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Currency> Currencies => Set<Currency>();
    public DbSet<CatalogPrice> CatalogPrices => Set<CatalogPrice>();
    public DbSet<BusinessRecord> BusinessRecords => Set<BusinessRecord>();
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<BusinessPreference> BusinessPreferences => Set<BusinessPreference>();
    public DbSet<RegionalSetting> RegionalSettings => Set<RegionalSetting>();
    public DbSet<FiscalYearSetting> FiscalYearSettings => Set<FiscalYearSetting>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
    public DbSet<UserInvitation> UserInvitations => Set<UserInvitation>();
    public DbSet<RoleDefinition> RoleDefinitions => Set<RoleDefinition>();
    public DbSet<PermissionMatrixEntry> PermissionMatrixEntries => Set<PermissionMatrixEntry>();
    public DbSet<LocalizationEntry> LocalizationEntries => Set<LocalizationEntry>();
    public DbSet<PlanCatalogItem> PlanCatalogItems => Set<PlanCatalogItem>();
    public DbSet<SubscriptionLifecycleEntry> SubscriptionLifecycleEntries => Set<SubscriptionLifecycleEntry>();
    public DbSet<BillingCycleConfig> BillingCycleConfigs => Set<BillingCycleConfig>();
    public DbSet<InvoiceGenerationEntry> InvoiceGenerationEntries => Set<InvoiceGenerationEntry>();
    public DbSet<PaymentTrackingEntry> PaymentTrackingEntries => Set<PaymentTrackingEntry>();
    public DbSet<GlobalSettingEntry> GlobalSettingEntries => Set<GlobalSettingEntry>();
    public DbSet<CustomerEntry> CustomerEntries => Set<CustomerEntry>();
    public DbSet<ReportEntry> ReportEntries => Set<ReportEntry>();
    public DbSet<InventoryEntry> InventoryEntries => Set<InventoryEntry>();
    public DbSet<PaymentEntry> PaymentEntries => Set<PaymentEntry>();
    public DbSet<ExpenseEntry> ExpenseEntries => Set<ExpenseEntry>();
    public DbSet<PurchaseEntry> PurchaseEntries => Set<PurchaseEntry>();
    public DbSet<SalesEntry> SalesEntries => Set<SalesEntry>();
    public DbSet<InvoicingEntry> InvoicingEntries => Set<InvoicingEntry>();
    public DbSet<AccountingEntry> AccountingEntries => Set<AccountingEntry>();
    public DbSet<ProductServiceEntry> ProductServiceEntries => Set<ProductServiceEntry>();
    public DbSet<VendorEntry> VendorEntries => Set<VendorEntry>();
    public DbSet<RecipeDefinition> RecipeDefinitions => Set<RecipeDefinition>();
    public DbSet<RecipePlan> RecipePlans => Set<RecipePlan>();

    private Guid? CurrentTenantId => _tenantContext.TenantId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.Slug).IsUnique();
            entity.Property(t => t.Name).HasMaxLength(200);
            entity.Property(t => t.Slug).HasMaxLength(100);
            entity.Property(t => t.DefaultCurrencyCode).HasMaxLength(3);
            entity.HasData(
                new Tenant
                {
                    Id = AlphaTenantId,
                    Name = "Sharv Alpha",
                    Slug = "alpha",
                    DefaultCurrencyCode = "USD"
                },
                new Tenant
                {
                    Id = BetaTenantId,
                    Name = "Sharv Beta",
                    Slug = "beta",
                    DefaultCurrencyCode = "EUR"
                });
        });

        modelBuilder.Entity<Currency>(entity =>
        {
            entity.HasKey(c => c.Code);
            entity.Property(c => c.Code).HasMaxLength(3).IsFixedLength();
            entity.Property(c => c.Name).HasMaxLength(100);
            entity.Property(c => c.Symbol).HasMaxLength(8);
            entity.HasData(
                new Currency { Code = "USD", Name = "US Dollar", Symbol = "$" },
                new Currency { Code = "EUR", Name = "Euro", Symbol = "EUR" },
                new Currency { Code = "INR", Name = "Indian Rupee", Symbol = "Rs" });
        });

        modelBuilder.Entity<CatalogPrice>(entity =>
        {
            entity.HasKey(cp => cp.Id);
            entity.Property(cp => cp.ItemName).HasMaxLength(200);
            entity.Property(cp => cp.Amount).HasColumnType("decimal(18,2)");
            entity.Property(cp => cp.CurrencyCode).HasMaxLength(3).IsFixedLength();
            entity.HasIndex(cp => new { cp.TenantId, cp.ItemName });
            entity.HasOne<Currency>()
                .WithMany()
                .HasForeignKey(cp => cp.CurrencyCode)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Tenant>()
                .WithMany()
                .HasForeignKey(cp => cp.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BusinessRecord>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.BusinessName).HasMaxLength(200);
            entity.Property(x => x.LegalName).HasMaxLength(200);
            entity.Property(x => x.Email).HasMaxLength(200);
            entity.Property(x => x.Phone).HasMaxLength(40);
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasIndex(x => new { x.TenantId, x.BusinessName });
        });

        modelBuilder.Entity<BusinessProfile>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DisplayName).HasMaxLength(200);
            entity.Property(x => x.Industry).HasMaxLength(120);
            entity.Property(x => x.Website).HasMaxLength(250);
            entity.Property(x => x.Address).HasMaxLength(400);
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasIndex(x => new { x.TenantId, x.DisplayName });
        });

        modelBuilder.Entity<BusinessPreference>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.InvoicePrefix).HasMaxLength(20);
            entity.Property(x => x.PaymentTerms).HasMaxLength(40);
            entity.Property(x => x.DefaultLanguage).HasMaxLength(20);
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasIndex(x => new { x.TenantId, x.InvoicePrefix });
        });

        modelBuilder.Entity<RegionalSetting>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Country).HasMaxLength(120);
            entity.Property(x => x.Timezone).HasMaxLength(120);
            entity.Property(x => x.DateFormat).HasMaxLength(20);
            entity.Property(x => x.NumberFormat).HasMaxLength(20);
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasIndex(x => new { x.TenantId, x.Country });
        });

        modelBuilder.Entity<FiscalYearSetting>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FiscalYear).HasMaxLength(30);
            entity.Property(x => x.BookStatus).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.FiscalYear });
        });

        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FullName).HasMaxLength(120);
            entity.Property(x => x.Email).HasMaxLength(200);
            entity.Property(x => x.RoleName).HasMaxLength(80);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
        });

        modelBuilder.Entity<UserInvitation>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(200);
            entity.Property(x => x.RoleName).HasMaxLength(80);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.Email, x.Status });
        });

        modelBuilder.Entity<RoleDefinition>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(80);
            entity.Property(x => x.Description).HasMaxLength(250);
            entity.Property(x => x.DataScope).HasMaxLength(40);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
        });

        modelBuilder.Entity<PermissionMatrixEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RoleName).HasMaxLength(80);
            entity.Property(x => x.ModuleName).HasMaxLength(80);
            entity.Property(x => x.ActionPermissions).HasMaxLength(250);
            entity.Property(x => x.DataScope).HasMaxLength(40);
            entity.HasIndex(x => new { x.TenantId, x.RoleName, x.ModuleName });
        });

        modelBuilder.Entity<LocalizationEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<PlanCatalogItem>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PlanCode).HasMaxLength(40);
            entity.Property(x => x.PlanName).HasMaxLength(120);
            entity.Property(x => x.Price).HasColumnType("decimal(18,2)");
            entity.Property(x => x.BillingFrequency).HasMaxLength(30);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.PlanCode }).IsUnique();
        });

        modelBuilder.Entity<SubscriptionLifecycleEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SubscriberName).HasMaxLength(120);
            entity.Property(x => x.PlanCode).HasMaxLength(40);
            entity.Property(x => x.State).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.SubscriberName, x.PlanCode });
        });

        modelBuilder.Entity<BillingCycleConfig>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CycleName).HasMaxLength(80);
            entity.Property(x => x.Frequency).HasMaxLength(30);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.CycleName }).IsUnique();
        });

        modelBuilder.Entity<InvoiceGenerationEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.InvoiceNumber).HasMaxLength(40);
            entity.Property(x => x.SubscriberName).HasMaxLength(120);
            entity.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.InvoiceNumber }).IsUnique();
        });

        modelBuilder.Entity<PaymentTrackingEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ReferenceNumber).HasMaxLength(40);
            entity.Property(x => x.InvoiceNumber).HasMaxLength(40);
            entity.Property(x => x.AmountPaid).HasColumnType("decimal(18,2)");
            entity.Property(x => x.PaymentStatus).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ReferenceNumber }).IsUnique();
        });

        modelBuilder.Entity<GlobalSettingEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<CustomerEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<ReportEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<InventoryEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<PaymentEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<ExpenseEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<PurchaseEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<SalesEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.CustomerId);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<InvoicingEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.CustomerId);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<AccountingEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<ProductServiceEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<VendorEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ScreenKey).HasMaxLength(80);
            entity.Property(x => x.PrimaryField).HasMaxLength(200);
            entity.Property(x => x.SecondaryField).HasMaxLength(200);
            entity.Property(x => x.TertiaryField).HasMaxLength(200);
            entity.Property(x => x.QuaternaryField).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.ScreenKey, x.PrimaryField });
        });

        modelBuilder.Entity<RecipeDefinition>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RecipeName).HasMaxLength(200);
            entity.Property(x => x.OutputProductName).HasMaxLength(200);
            entity.Property(x => x.OutputSku).HasMaxLength(80);
            entity.Property(x => x.BatchYieldQuantity).HasColumnType("decimal(18,2)");
            entity.Property(x => x.YieldUnit).HasMaxLength(40);
            entity.Property(x => x.IngredientsJson).HasColumnType("nvarchar(max)");
            entity.Property(x => x.Instructions).HasColumnType("nvarchar(max)");
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.RecipeName });
        });

        modelBuilder.Entity<RecipePlan>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RecipeName).HasMaxLength(200);
            entity.Property(x => x.OutputProductName).HasMaxLength(200);
            entity.Property(x => x.BatchCount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.PlannedOutputQuantity).HasColumnType("decimal(18,2)");
            entity.Property(x => x.YieldUnit).HasMaxLength(40);
            entity.Property(x => x.IngredientsSnapshotJson).HasColumnType("nvarchar(max)");
            entity.Property(x => x.Notes).HasColumnType("nvarchar(max)");
            entity.Property(x => x.ExecutionStatus).HasMaxLength(30);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.HasIndex(x => new { x.TenantId, x.RecipeDefinitionId, x.PlannedDateUtc });
        });

        ApplyTenantQueryFilters(modelBuilder);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyTenantOwnership();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ApplyTenantOwnership();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyTenantOwnership()
    {
        var tenantEntries = ChangeTracker.Entries()
            .Where(e => e.Entity is ITenantOwned &&
                        (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in tenantEntries)
        {
            if (!CurrentTenantId.HasValue)
            {
                throw new InvalidOperationException(
                    $"TenantId is required for '{entry.Entity.GetType().Name}' but no tenant is resolved.");
            }

            var tenantOwned = (ITenantOwned)entry.Entity;
            if (entry.State == EntityState.Added)
            {
                tenantOwned.TenantId = CurrentTenantId.Value;
                continue;
            }

            if (tenantOwned.TenantId != CurrentTenantId.Value)
            {
                throw new InvalidOperationException(
                    $"Cross-tenant write denied for '{entry.Entity.GetType().Name}'.");
            }
        }
    }

    private void ApplyTenantQueryFilters(ModelBuilder modelBuilder)
    {
        var tenantOwnedTypes = modelBuilder.Model.GetEntityTypes()
            .Where(t => typeof(ITenantOwned).IsAssignableFrom(t.ClrType))
            .Select(t => t.ClrType);

        foreach (var clrType in tenantOwnedTypes)
        {
            var parameter = Expression.Parameter(clrType, "entity");
            var tenantIdProperty = Expression.Property(parameter, nameof(ITenantOwned.TenantId));
            var contextTenantId = Expression.Property(Expression.Constant(this), nameof(CurrentTenantId));

            var hasTenantId = Expression.Property(contextTenantId, nameof(Nullable<Guid>.HasValue));
            var tenantIdValue = Expression.Property(contextTenantId, nameof(Nullable<Guid>.Value));
            var tenantMatch = Expression.Equal(tenantIdProperty, tenantIdValue);

            var filterBody = Expression.AndAlso(hasTenantId, tenantMatch);
            var lambda = Expression.Lambda(filterBody, parameter);

            modelBuilder.Entity(clrType).HasQueryFilter(lambda);
        }
    }
}


