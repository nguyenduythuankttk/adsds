using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Services.Interface;
using Backend.Services.Implementations;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Backend.Services.Interfaces;
using Backend.Middleware;

DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddHttpClient("Nominatim", c => {
    c.DefaultRequestHeaders.Add("User-Agent", "ChonLibiApp/1.0 (contact@chonlibi.vn)");
    c.Timeout = TimeSpan.FromSeconds(5);
});
builder.Services.AddScoped<Backend.Services.Interface.IGeocodingService, Backend.Services.Implementations.GeocodingService>();
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.Converters.Add(new Backend.Converters.DateOnlyJsonConverter());
        // Cho phép frontend gửi/nhận enum dưới dạng string ("Cash", "Male", "Create"...)
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        // Tránh lỗi vòng lặp tuần hoàn (Product → ProductVarient → Product → ...)
        // Giúp product variants được trả về trong response
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

var jwtSettings = builder.Configuration.GetSection("Jwt");
// Đọc JWT key: ưu tiên Jwt:Key, fallback sang JWT_KEY (env var single underscore)
var jwtKeyValue = jwtSettings["Key"];
if (string.IsNullOrWhiteSpace(jwtKeyValue))
    jwtKeyValue = builder.Configuration["JWT_KEY"] ?? "";
if (string.IsNullOrWhiteSpace(jwtKeyValue))
    throw new Exception("JWT Key chưa được cấu hình. Hãy đặt Jwt__Key hoặc JWT_KEY trong file .env");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // .NET 7+ defaults MapInboundClaims to false, causing ClaimTypes.NameIdentifier
        // to not be found because JWT stores it as "sub". Force mapping on.
        options.MapInboundClaims = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKeyValue))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                var uri = new Uri(origin);
                return uri.Host == "localhost" || uri.Host == "127.0.0.1"
                    || uri.Host == "dhstore.it.com" || uri.Host == "api.dhstore.it.com";
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var connectionString = builder.Configuration.GetConnectionString("JolibiDatabase");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 0))));
}

builder.Services.AddSingleton<MongoDbContext>();

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Register services
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IStoreService, StoreService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IIngredientService, IngredientService>();
builder.Services.AddScoped<IWareHouseService, WarehouseService>();
builder.Services.AddScoped<IBillService, BillService>();
builder.Services.AddScoped<ISePayService, SePayService>();
builder.Services.Configure<SePayOptions>(builder.Configuration.GetSection(SePayOptions.SectionName));
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IDiningTableService, DiningTableService>();
builder.Services.AddScoped<IDeliveryInfoService, DeliveryService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddScoped<IReceiptService, ReceiptService>();
builder.Services.AddScoped<IProcessingService, ProcessingService>();
builder.Services.AddScoped<IInventoryBatchService, InventoryBatchService>();
builder.Services.AddScoped<IShiftService, ShiftService>();
builder.Services.AddScoped<IShiftTaskService, ShiftTaskService>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IComboService, ComboService>();
builder.Services.AddHostedService<HardDeleteService>();

builder.Services.AddOptions();
builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
});

var app = builder.Build();

app.UseResponseCompression();

if (!string.IsNullOrWhiteSpace(connectionString))
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        logger.LogInformation("Applying database migrations...");
        context.Database.Migrate();
        logger.LogInformation("Database migrations completed successfully.");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Cảnh báo nếu SePay đang chạy ở test mode (để tránh nhầm với prod)
{
    var sepayOpts = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<SePayOptions>>().Value;
    var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
    if (sepayOpts.TestMode)
        startupLogger.LogWarning("⚠ SePay đang chạy ở chế độ TEST – không nhận tiền thật. Account={Acc} Bank={Bank}",
            sepayOpts.Account, sepayOpts.Bank);
    if (string.IsNullOrEmpty(sepayOpts.ApiKey))
        startupLogger.LogWarning("⚠ SePay:ApiKey trống – webhook sẽ trả 401 cho mọi request.");
}

// app.UseHttpsRedirection(); // Tắt redirect HTTPS khi dev với frontend HTTP
app.UseCors("AllowFrontend");

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseAuthentication();
app.UseMiddleware<BlacklistTokenMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.Run();
