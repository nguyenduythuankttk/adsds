using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {

    public enum LeaveStatus {
        Pending,   // Đang chờ duyệt
        Approved,  // Đã duyệt
        Rejected   // Từ chối
    }

    public class LeaveRequest {
        [Key]
        public Guid LeaveRequestID { get; set; }

        [Required]
        public Guid EmployeeID { get; set; }
        [ForeignKey(nameof(EmployeeID))]
        [JsonIgnore]
        public virtual Employee Employee { get; set; } = null!;

        [Required]
        public DateOnly LeaveDate { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = "";

        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        // Manager duyệt / từ chối
        public Guid? ReviewedByID { get; set; }
        [ForeignKey(nameof(ReviewedByID))]
        [JsonIgnore]
        public virtual Employee? ReviewedBy { get; set; }

        public DateTime? ReviewedAt { get; set; }

        [MaxLength(300)]
        public string? ReviewNote { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}
