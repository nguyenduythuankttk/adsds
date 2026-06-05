namespace Backend.Models.DTOs.Request {
    public class ShiftTaskCreateRequest {
        public Guid ShiftID { get; set; }
        public string Title { get; set; } = "";
    }
}
