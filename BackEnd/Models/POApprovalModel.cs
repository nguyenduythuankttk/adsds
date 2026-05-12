using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{

    public enum PO_Status
    {
        Submitted,   // nhân viên vừa tạo, chờ manager duyệt
        Ordered,     // manager xác nhận → đặt hàng NCC
        Received,    // hàng về, đã tạo Receipt
        Rejected,    // manager từ chối (terminal)
        Cancelled    // manager hủy sau khi đã Ordered (terminal, bắt buộc có lý do)
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
        public string? CancelledReason { get; set; }
        [Required]
        public PO_Status POStatus { get; set; }

    }
}