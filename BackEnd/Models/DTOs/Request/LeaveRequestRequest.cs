using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Request {

    public class LeaveRequestCreateRequest {
        [Required]
        public DateOnly LeaveDate { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = "";
    }

    public class LeaveRequestReviewRequest {
        [Required]
        public LeaveStatus Status { get; set; }   // Approved hoặc Rejected

        [MaxLength(300)]
        public string? ReviewNote { get; set; }
    }
}
