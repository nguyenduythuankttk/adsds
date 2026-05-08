using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class IngredientUpdateRequest{
        public string IngredientName { get; set; } = null!;
        public decimal CostPerUnit { get; set; }
    }
}