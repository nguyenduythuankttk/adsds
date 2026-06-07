using System.Security.Claims;

namespace Backend.Helpers
{
    public static class ClaimsPrincipalExtensions
    {
        // StoreID của nhân viên lấy từ JWT claim "StoreID" (chỉ token nhân viên mới có).
        // Trả về null nếu là khách / token chưa có claim ⇒ controller fallback sang storeID client gửi.
        // Dùng để ép phạm vi dữ liệu admin/employee về đúng store của nhân viên đó.
        public static int? GetStoreID(this ClaimsPrincipal? user)
        {
            var raw = user?.FindFirst("StoreID")?.Value;
            return int.TryParse(raw, out var id) ? id : (int?)null;
        }
    }
}
