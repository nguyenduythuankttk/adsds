using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Request
{
    public class TicketCreateRequest
    {
        public DateOnly StartDate {get; set;}
        public DateOnly EndDate {get; set;}
        public decimal Discount {get; set;}
        [Range(1,int.MaxValue)]
        public int Qty {get; set;}
    }
    public class TicketUpdateRequest
    {
        public DateOnly? StartDate {get; set;}
        public DateOnly? EndDate {get; set;}
        public decimal? Discount {get; set;}
    }
}