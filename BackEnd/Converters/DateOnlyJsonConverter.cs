using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Converters {
    public class DateOnlyJsonConverter : JsonConverter<DateOnly> {
        private static readonly string[] Formats = { "yyyy-MM-dd", "yyyy/MM/dd", "dd-MM-yyyy", "dd/MM/yyyy" };

        public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
            var value = reader.GetString()!;
            foreach (var format in Formats) {
                if (DateOnly.TryParseExact(value, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                    return date;
            }
            throw new JsonException($"Unable to convert \"{value}\" to DateOnly. Supported formats: yyyy-MM-dd, yyyy/MM/dd");
        }

        public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options) {
            writer.WriteStringValue(value.ToString("yyyy-MM-dd"));
        }
    }
}
