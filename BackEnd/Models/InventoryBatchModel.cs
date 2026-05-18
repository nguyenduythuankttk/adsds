using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{

    public enum BatchStatus
    {
        Available,
        Depleted,
        Expired,
        Damaged,
        Locked,
        Cancelled
    }

    public enum BatchType
    {
        Raw,        // Nhập từ NCC — đơn vị kg, dùng trong Processing
        Processed   // Sau sơ chế — đơn vị miếng/Unit, dùng trong Bill
    }

    public class InventoryBatch
    {
        [Key]
        public Guid BatchID { get; set; }
        public int WarehouseID { get; set; }
        [ForeignKey("WarehouseID")]
        public virtual Warehouse Warehouse { get; set; } = null!;

        [Required]
        public DateTime ImportDate { get; set; }
        [Required]
        public DateOnly Exp { get; set; }
        [Required]
        public DateOnly Mfd { get; set; }
        [Required]
        public decimal QuantityOriginal { get; set; }
        [Required]
        public decimal QuantityOnHand { get; set; }
        [Required]
        public BatchStatus Status { get; set; }
        [Required]
        public decimal UnitCost { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? BatchCode { get; set; }
        public string? Note { get; set; }
        public int IngredientID { get; set; }
        [ForeignKey("IngredientID")]
        public virtual Ingredient Ingredient { get; set; } = null!;
        public Guid? GoodsReceiptID { get; set; }
        [Required]
        public BatchType BatchType { get; set; }
        [JsonIgnore]
        public virtual ICollection<StockMovement> StockMovement { get; set; } = new List<StockMovement>();
    }
}