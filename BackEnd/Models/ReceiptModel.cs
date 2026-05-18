using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{

    public enum ReceiptStatus
    {
        Preparing,
        Delivering,
        Received,
        Deleted
    }

    public class Receipt
    {
        [Key]
        public Guid ReceiptID { get; set; }
        public DateTime DateReceive {get; set; }
        public DateTime? DeletedAt {get; set; }
        public Guid EmployeeID { get; set; }
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; } = null!;
        public int StoreID { get; set; }
        [ForeignKey("StoreID")]
        public virtual Store Store { get; set; } = null!;
        public int SupplierID { get; set; }
        [ForeignKey("SupplierID")]
        public virtual Supplier Supplier { get; set; } = null!;
        public DateTime? ConfirmedAt { get; set; }
        public Guid? POID { get; set; }
        [ForeignKey("POID")]
        [JsonIgnore]
        public virtual PurchaseOrder? PurchaseOrder { get; set; }

        public virtual ICollection<ReceiptDetail> ReceiptDetail { get; set; } = new List<ReceiptDetail>();
    }


}