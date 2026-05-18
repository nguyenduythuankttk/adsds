using System.Security.Claims;

namespace Backend.Utils
{
    public static class ClaimsHelper
    {
        public static Guid GetUserId(ClaimsPrincipal user)
        {
            var value = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("user_id")?.Value;
            if (string.IsNullOrWhiteSpace(value))
                throw new UnauthorizedAccessException("Không xác định được người dùng từ token.");
            return Guid.Parse(value);
        }

        public static string GetRole(ClaimsPrincipal user)
            => user.FindFirst(ClaimTypes.Role)?.Value ?? "Customer";

        public static bool IsEmployee(ClaimsPrincipal user)
            => GetRole(user) != "Customer";
    }
}
