using Backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request
{
    public class ComboCreateRequest
    {
        public List<ProductInCombo> Products{get; set;} = new List<ProductInCombo>();
        public decimal Price {get; set;}
    }
    public class ProductInCombo
    {
        public int ProductID {get; set;}
        public decimal qty {get; set;}
    }
}