using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{

    public class PurchaseOrder
    {
        [Key]
        public Guid POID { get; set; }
        public int StoreID { get; set; }
        [ForeignKey("StoreID")]
        public virtual Store Store { get; set; } = null!;
        public int SupplierID { get; set; }
        [ForeignKey("SupplierID")]
        public virtual Supplier Supplier { get; set; } = null!;
        [Required]
        public decimal TaxRate { get; set; }
        [Required]
        public decimal Total {get; set;}
        public DateTime? DeletedAt { get; set; }
        [JsonIgnore]
        public virtual Receipt? Receipt{get; set;}
        [JsonIgnore]
        public virtual ICollection<PODetail> PODetail { get; set; } = new List<PODetail>();
        [JsonIgnore]
        public virtual ICollection<POApproval> POApproval { get; set; } = new List<POApproval>();

    }
}