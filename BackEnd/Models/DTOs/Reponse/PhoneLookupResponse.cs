namespace Backend.Models.DTOs.Reponse {
    public class PhoneLookupResponse {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public Guid? UserID { get; set; }
        public bool IsRegistered { get; set; }
    }
}
