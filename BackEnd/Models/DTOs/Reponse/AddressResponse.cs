using Backend.Models;
namespace Backend.Models.DTOs.Reponse
{
    public class AddressResponse
    {
        public Guid AddressID { get; set; }

        public string StreetAddress { get; set; } = null!;

        public string District { get; set; } = null!;

        public string Province { get; set; } = null!;

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}