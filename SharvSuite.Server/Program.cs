using Microsoft.EntityFrameworkCore;
using SharvSuite.Server.Configuration;
using SharvSuite.Server.Data;
using SharvSuite.Server.Repositories;
using SharvSuite.Server.Services;
using SharvSuite.Server.Tenancy;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Entity Framework Core - configure connection string in appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                         ?? "Server=(localdb)\\mssqllocaldb;Database=SharvSuite;Trusted_Connection=True;TrustServerCertificate=True;";

    options.UseSqlServer(connectionString);
});
builder.Services.Configure<TenantResolutionOptions>(
    builder.Configuration.GetSection(TenantResolutionOptions.SectionName));
builder.Services.Configure<CurrencyConversionOptions>(
    builder.Configuration.GetSection(CurrencyConversionOptions.SectionName));
builder.Services.Configure<FirebaseOptions>(
    builder.Configuration.GetSection(FirebaseOptions.SectionName));
builder.Services.Configure<GoogleCalendarOptions>(
    builder.Configuration.GetSection(GoogleCalendarOptions.SectionName));
builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());
builder.Services.AddScoped<ICurrencyConversionService, CurrencyConversionService>();
builder.Services.AddScoped(typeof(ITenantEntityRepository<>), typeof(TenantEntityRepository<>));
builder.Services.AddScoped<ILocalizationEntryRepository, LocalizationEntryRepository>();
builder.Services.AddScoped<IGlobalSettingRepository, GlobalSettingRepository>();
builder.Services.AddScoped<ICustomerEntryRepository, CustomerEntryRepository>();
builder.Services.AddScoped<IReportEntryRepository, ReportEntryRepository>();
builder.Services.AddScoped<IInventoryEntryRepository, InventoryEntryRepository>();
builder.Services.AddScoped<IPaymentEntryRepository, PaymentEntryRepository>();
builder.Services.AddScoped<IExpenseEntryRepository, ExpenseEntryRepository>();
builder.Services.AddScoped<IPurchaseEntryRepository, PurchaseEntryRepository>();
builder.Services.AddScoped<ISalesEntryRepository, SalesEntryRepository>();
builder.Services.AddScoped<IInvoicingEntryRepository, InvoicingEntryRepository>();
builder.Services.AddScoped<IAccountingEntryRepository, AccountingEntryRepository>();
builder.Services.AddScoped<IProductServiceEntryRepository, ProductServiceEntryRepository>();
builder.Services.AddScoped<IVendorEntryRepository, VendorEntryRepository>();
builder.Services.AddScoped<IRecipeDefinitionRepository, RecipeDefinitionRepository>();
builder.Services.AddScoped<IRecipePlanRepository, RecipePlanRepository>();

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseMiddleware<TenantResolutionMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
