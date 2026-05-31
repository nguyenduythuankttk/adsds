using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{

    public enum ProductType
    {
        Food,
        Drink,
        Addon,
        Combo
    }

    public class Product
    {
        [Key]
        public int ProductID { get; set; }
        [Required]
        public string ProductName { get; set; } = null!;
        [Required]
        public ProductType ProductType { get; set; }
        public string? Image { get; set; }
        public string? Description { get; set; }
        public DateTime? DeletedAt { get; set; }
        public int SoldCount { get; set; } = 0;
        public virtual ICollection<ProductVarient> ProductVarient { get; set; } = new List<ProductVarient>();
        [JsonIgnore]
        public virtual ICollection<ComboDetail>? ComboDetail {get;set;} = new List<ComboDetail>();
    }
}