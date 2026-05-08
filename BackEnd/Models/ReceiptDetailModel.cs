using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public class ReceiptDetail{
        public Guid GoodsReceiptID {get; set;}
        [ForeignKey("GoodsReceiptID")]
        public virtual Receipt Receipt {get; set;} = null!;
        public int IngredientID {get; set;}
        [ForeignKey("IngredientID")]
        public virtual Ingredient Ingredient{get; set;} = null!;
        [Required]
        public decimal Quantity { get; set; }
        [Required]
        public decimal GoodQuantity {get; set;}
        [Required]
        public decimal UnitPrice { get; set; }

        [JsonIgnore]
        public virtual ICollection<InventoryBatch> InventoryBatch { get; set; } = new List<InventoryBatch>();
    }
}