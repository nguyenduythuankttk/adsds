namespace Backend.Models.DTOs.Request
{
    public class TicketCreateRequest
    {
        public DateTime StartDate {get; set;}
        public DateTime EndDate {get; set;}
        public decimal Discount {get; set;}
    }
    public class TicketUpdateRequest
    {
        public DateTime? StartDate {get; set;}
        public DateTime? EndDate {get; set;}
        public decimal? Discount {get; set;}
    }
}