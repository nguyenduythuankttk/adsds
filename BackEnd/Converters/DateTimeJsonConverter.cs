using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Converters
{
    // BackEnd lưu DateTime theo giờ Việt Nam (xem Backend.Helpers.VnTime).
    // Khi serialize JSON, gắn thẳng offset +07:00 để client biết chính xác zone,
    // tránh việc browser tự suy luận local time (sai khi user ở ngoài VN).
    // Khi deserialize, parse ISO 8601 và convert về DateTime Unspecified (VN local)
    // để giữ đúng convention của BackEnd.
    public class DateTimeJsonConverter : JsonConverter<DateTime>
    {
        private const string VnOffset = "+07:00";

        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var s = reader.GetString();
            if (string.IsNullOrEmpty(s))
                return default;
            var dto = DateTimeOffset.Parse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal);
            // Convert sang giờ VN rồi trả về DateTime Unspecified
            var vn = TimeZoneInfo.ConvertTime(dto, TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"));
            return DateTime.SpecifyKind(vn.DateTime, DateTimeKind.Unspecified);
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ss.fff", CultureInfo.InvariantCulture) + VnOffset);
        }
    }

    public class NullableDateTimeJsonConverter : JsonConverter<DateTime?>
    {
        private const string VnOffset = "+07:00";

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null) return null;
            var s = reader.GetString();
            if (string.IsNullOrEmpty(s)) return null;
            var dto = DateTimeOffset.Parse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal);
            var vn = TimeZoneInfo.ConvertTime(dto, TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"));
            return DateTime.SpecifyKind(vn.DateTime, DateTimeKind.Unspecified);
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value == null) { writer.WriteNullValue(); return; }
            writer.WriteStringValue(value.Value.ToString("yyyy-MM-ddTHH:mm:ss.fff", CultureInfo.InvariantCulture) + VnOffset);
        }
    }
}
