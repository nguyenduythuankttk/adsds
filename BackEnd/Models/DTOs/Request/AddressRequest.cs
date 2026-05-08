using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class AddressCreateRequest{
        public int? HouseNumber { get; set; }


        public string Street { get; set; } = null!;


        public string Ward { get; set; } = null!;

        public string District { get; set; } = null!;

        public string Province { get; set; } = null!;

        public string Country { get; set; } = "Viet Nam";
    }
}