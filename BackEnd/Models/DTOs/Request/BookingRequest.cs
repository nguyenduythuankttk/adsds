using Backend.Models;

namespace Backend.Models.DTOs.Request
{
    public class BookingCreateRequest
    {
        public DateTime ScheduledTime { get; set; }
        public int NumberOfGuess {get; set; } 
        public string? GuestComment {get; set; }
    }

    public class BookingUpdateRequest
    {
        public DateTime? ScheduledTime { get; set; }
        public int? NumberOfGuess {get; set; } 
        public string? GuestComment {get; set; }

    }
}