using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{

    public enum StockMovementType
    {
        PurchaseReceipt,
        Consumption,
        Waste,
        TransferIn,
        TransferOut,
        ManualAdjustment,
        Processing
    }

    public enum StockReferenceType
    {
        GoodsReceipt,
        Bill,
        Inspection,
        Transfer,
        Manual
    }

    public class StockMovement
    {
        [Key]
        public Guid StockMovementID { get; set; }
        public Guid BatchID { get; set; }

        [ForeignKey("BatchID")]
        public virtual InventoryBatch Batch { get; set; }

        public Guid EmployeeID { get; set; }

        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; } = null!;
        [Required]
        public decimal QtyChange { get; set; }
        [Required]
        public StockMovementType MovementType { get; set; }
        [Required]
        public StockReferenceType ReferenceType { get; set; }
        [Required]
        public DateTime TimeStamp { get; set; }
        public Guid? ReferenceID { get; set; }
        public string? Reason { get; set; }
        public string? Note { get; set; }
        public DateTime? DeleteAt {get; set;}
    }
}