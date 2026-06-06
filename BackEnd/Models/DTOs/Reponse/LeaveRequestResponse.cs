using Backend.Models;

namespace Backend.Models.DTOs.Reponse {

    public class LeaveRequestResponse {
        public Guid LeaveRequestID { get; set; }
        public Guid EmployeeID { get; set; }
        public string EmployeeName { get; set; } = "";
        public int StoreID { get; set; }
        public DateOnly LeaveDate { get; set; }
        public string Reason { get; set; } = "";
        public LeaveStatus Status { get; set; }
        public Guid? ReviewedByID { get; set; }
        public string? ReviewedByName { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewNote { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
