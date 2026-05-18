using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Request{
    public class ProductCreateRequest {
        public string ProductName { get; set; } = null!;
        public ProductType ProductType { get; set; }
        public string? Image { get; set; }
    }
    public class ProductUpdateRequest{
        public string ProductName { get; set; } = null!;
        public string? Image { get; set; }
    }
    public class ProductVarientUpdateRequest {
        public decimal Price {get; set;}
    }
    public class ProductVarientCreate{
        public int ProductID {get; set;}
        public ProductSize Size {get; set;} = ProductSize.Default;
        public decimal Price {get; set;}
    }
}