using Backend.Models;
namespace Backend.Models.DTOs.Reponse
{
    public class AddressResponse
    {
        public Guid AddressID { get; set; }

        public int? HouseNumber { get; set; }

        public string Street { get; set; } = null!;

        public string Ward { get; set; } = null!;

        public string District { get; set; } = null!;

        public string Province { get; set; } = null!;

        public string Country { get; set; } = "Viet Nam";
    }
}