using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class ComboChangeRequest{
        public string ComboName {get; set;}
        public decimal FixedPrice {get; set;}
        public bool IsActive {get; set;}
    }
}