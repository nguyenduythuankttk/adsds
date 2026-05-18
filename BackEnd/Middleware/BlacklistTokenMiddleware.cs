using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Middleware
{
    public class BlacklistTokenMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IServiceScopeFactory _scopeFactory;

        public BlacklistTokenMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory)
        {
            _next = next;
            _scopeFactory = scopeFactory;
        }

        private static readonly HashSet<string> _publicPaths = new(StringComparer.OrdinalIgnoreCase)
        {
            "/api/pbl3/auth/customer_login",
            "/api/pbl3/auth/employee_login",
            "/api/pbl3/auth/register",
            "/api/pbl3/auth/verify-otp",
            "/api/pbl3/auth/resend-verify-email",
            "/api/pbl3/auth/forgot-password",
            "/api/pbl3/auth/reset-password",
        };

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value ?? "";
            if (_publicPaths.Contains(path))
            {
                await _next(context);
                return;
            }

            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authHeader["Bearer ".Length..].Trim();
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var isBlacklisted = await db.BlackListedToken.AnyAsync(bt => bt.Token == token);
                if (isBlacklisted)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"message\":\"Token đã bị thu hồi.\"}");
                    return;
                }
            }
            await _next(context);
        }
    }
}
