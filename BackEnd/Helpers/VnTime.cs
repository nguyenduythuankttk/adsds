namespace Backend.Helpers
{
    // Trả về thời gian theo giờ Việt Nam (UTC+7), hoạt động đúng dù server
    // chạy trên Asia/Ho_Chi_Minh, UTC, hay Windows. Dùng cho mọi timestamp
    // lưu DB (CreatedAt, ChangeAt, PaidAt, DeletedAt, ...).
    // KHÔNG dùng cho JWT exp/nbf — JwtBearer.ValidateLifetime so với UtcNow.
    public static class VnTime
    {
        private static readonly TimeZoneInfo Tz = ResolveTz();

        private static TimeZoneInfo ResolveTz()
        {
            foreach (var id in new[] { "Asia/Ho_Chi_Minh", "SE Asia Standard Time" })
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }
            return TimeZoneInfo.CreateCustomTimeZone("ICT", TimeSpan.FromHours(7), "Indochina Time", "ICT");
        }

        public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Tz);

        public static DateOnly Today => DateOnly.FromDateTime(Now);
    }
}
