using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{

    public enum IngredientUnit
    {
        Unit,
        Gram,
        Kilogram,
        Liter,
        Milliliter
    }

    public class Ingredient
    {
        [Key]
        public int IngredientID { get; set; }

        [Required]
        public string IngredientName { get; set; } = null!;
        [Required]
        public IngredientUnit IngredientUnit { get; set; }
        [Required]
        public decimal CostPerUnit { get; set; }
        public DateTime? DeletedAt { get; set; }

        [JsonIgnore]
        public virtual ICollection<PODetail> PODetail { get; set; } = new List<PODetail>();

        [JsonIgnore]
        public virtual ICollection<ReceiptDetail> ReceiptDetail { get; set; } = new List<ReceiptDetail>();

        [JsonIgnore]
        public virtual ICollection<InventoryBatch> InventoryBatch { get; set; } = new List<InventoryBatch>();

        [JsonIgnore]
        public virtual ICollection<Receipe> Recipe { get; set; } = new List<Receipe>();

        [JsonIgnore]
        public virtual ICollection<StockMovement> StockMovement { get; set; } = new List<StockMovement>();
    }
}