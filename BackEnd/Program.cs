using Backend.Data;
using Backend.Models;
using Backend.Services.Interface;
using Backend.Services.Implementations;
using Resend;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.JsonWebTokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json.Serialization;
using Backend.Services.Interfaces;

Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
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
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // options.MapInboundClaims = false;
        options.TokenHandlers.Clear();
        options.TokenHandlers.Add(new JwtSecurityTokenHandler());
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

                string? tokenString = context.SecurityToken switch {
                    JsonWebToken jwt => jwt.EncodedToken,
                    JwtSecurityToken legacyJwt => legacyJwt.RawData,
                    _ => null
                };

                logger.LogInformation("[JWT] Token validated. SecurityToken type: {Type}. Claims: {Claims}",
                    context.SecurityToken?.GetType().Name,
                    string.Join(", ", context.Principal!.Claims.Select(c => $"{c.Type}={c.Value}")));

                if (tokenString != null)
                {
                    var isBlacklisted = await dbContext.BlackListedToken
                        .AnyAsync(bt => bt.Token == tokenString);

                    if (isBlacklisted)
                    {
                        logger.LogWarning("[JWT] Token is blacklisted.");
                        context.Fail("This token has been blacklisted.");
                    }
                }
            },
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("[JWT] Authentication failed: {Error}\nStackTrace: {Stack}",
                    context.Exception.ToString(),
                    context.Exception.StackTrace);
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var authHeader = context.Request.Headers["Authorization"].ToString();
                logger.LogWarning("[JWT] 401 Challenge on {Method} {Path} | Authorization header (full): '{AuthHeader}' | Error: {Error} | ErrorDescription: {Desc}",
                    context.Request.Method,
                    context.Request.Path,
                    string.IsNullOrEmpty(authHeader) ? "(missing)" : authHeader,
                    context.Error,
                    context.ErrorDescription);
                return Task.CompletedTask;
            }
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
                return uri.Host == "localhost" || uri.Host == "127.0.0.1";
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var connectionString = builder.Configuration.GetConnectionString("JolibiDatabase");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
    
    builder.Services.AddSingleton<MongoDbContext>();


}

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Register services
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IStoreService, StoreService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IComboService, ComboService>();
builder.Services.AddScoped<IIngredientService, IngredientService>();
builder.Services.AddScoped<IWareHouseService, WarehouseService>();
builder.Services.AddScoped<IBillService, BillService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IDiningTableService, DiningTableService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IDeliveryInfoService, DeliveryService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddScoped<IReceiptService, ReceiptService>();
builder.Services.AddScoped<IShiftService, ShiftService>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHostedService<HardDeleteService>();

builder.Services.AddOptions();
var resendApiKey = builder.Configuration["Resend:ApiKey"];
if (!string.IsNullOrWhiteSpace(resendApiKey)) {
    builder.Services.AddHttpClient<ResendClient>();
    builder.Services.Configure<ResendClientOptions>(o => { o.ApiToken = resendApiKey; });
    builder.Services.AddTransient<IResend, ResendClient>();
    builder.Services.AddScoped<IEmailService, EmailService>();
} else {
    builder.Services.AddScoped<IEmailService, NoOpEmailService>();
}

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
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// app.UseHttpsRedirection(); // Tắt redirect HTTPS khi dev với frontend HTTP
app.UseCors("AllowFrontend");

app.Use(async (context, next) => {
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("[REQ] {Method} {Path}{Query} | Auth: '{Auth}'",
        context.Request.Method,
        context.Request.Path,
        context.Request.QueryString,
        context.Request.Headers["Authorization"].ToString() is { Length: > 0 } h
            ? h[..Math.Min(h.Length, 30)] + "..."
            : "(none)");
    await next();
    logger.LogInformation("[RES] {Method} {Path} => {StatusCode}",
        context.Request.Method,
        context.Request.Path,
        context.Response.StatusCode);
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
