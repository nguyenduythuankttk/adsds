using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class AddressCreateRequest{
        public string StreetAddress { get; set; } = null!;

        public string District { get; set; } = null!;

        public string Province { get; set; } = null!;
    }
}