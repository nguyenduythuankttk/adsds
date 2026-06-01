using Backend.Services.Interface;
using System.Text.Json;

namespace Backend.Services.Implementations
{
    public class GeocodingService : IGeocodingService
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public GeocodingService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<(double Lat, double Lng)?> GeocodeAsync(string query)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("Nominatim");
                var url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
                          + Uri.EscapeDataString(query);
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0) return null;

                var first = root[0];
                if (!first.TryGetProperty("lat", out var latEl) ||
                    !first.TryGetProperty("lon", out var lonEl)) return null;

                if (double.TryParse(latEl.GetString(), System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out double lat) &&
                    double.TryParse(lonEl.GetString(), System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out double lng))
                {
                    return (lat, lng);
                }
                return null;
            }
            catch
            {
                return null;
            }
        }
    }
}
