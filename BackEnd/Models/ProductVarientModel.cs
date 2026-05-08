using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{
    public enum ProductSize {
        Default, S, M, L, XL
    }
    public class ProductVarient{
        [Key]
        public int ProductVarientID {get; set;}
        public int ProductID {get; set;}
        [ForeignKey("ProductID")]
        public virtual Product Product {get; set;} = null!;

        [Required]
        public ProductSize Size {get; set;} = ProductSize.Default;
        [Required]
        public decimal Price {get; set;}
        public DateTime? DeletedAt { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<ComboProduct> ComboProduct {get; set;} = new List<ComboProduct>();
        [JsonIgnore]
        public virtual ICollection<BillDetail> BillDetail { get; set; } = new List<BillDetail>();
        [JsonIgnore]
        public virtual ICollection<Receipe> Recipe { get; set; } = new List<Receipe>();
    }
}