using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{

    public enum PO_Status
    {
        Submitted,
        Approved,
        Rejected,
        Ordered,
        Received,
        Cancelled
    }

    public class POApproval
    {
        [Key]
        public Guid POApprovalID { get; set; }
        public Guid POID { get; set; }
        [ForeignKey("POID")]
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
        public Guid EmployeeID { get; set; }
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; } = null!;
        [Required]
        public DateTime LastUpdated { get; set; }
        public string? Comment { get; set; }
        [Required]
        public PO_Status Status { get; set; }

    }
}