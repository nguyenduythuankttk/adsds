using Backend.Models;

namespace Backend.Models.DTOs.Reponse {
    // Phản hồi phẳng cho 1 ca (không kéo nguyên entity Employee để tránh vòng lặp).
    public class ShiftResponse {
        public Guid ShiftID { get; set; }
        public Guid EmployeeID { get; set; }
        public string EmployeeName { get; set; } = "";
        public int StoreID { get; set; }
        public string? StoreName { get; set; }
        public DateTime TimeIn { get; set; }
        public DateTime TimeOut { get; set; }
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public ShiftStatus Status { get; set; }
    }

    // Kết quả khi nhân viên đăng nhập / bấm check-in
    public class ShiftCheckInResponse {
        public Guid? ShiftID { get; set; }
        public DateTime? TimeIn { get; set; }
        public DateTime? TimeOut { get; set; }
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public ShiftStatus Status { get; set; }
        public int MinutesDiff { get; set; }   // âm: sớm, dương: trễ
        public string Message { get; set; } = "";
        public bool HasShift { get; set; }
    }
}
