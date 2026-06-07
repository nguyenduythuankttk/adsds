using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Request
{
    public class TicketCreateRequest
    {
        [Required(ErrorMessage = "Tên chương trình không được để trống")]
        [StringLength(120, MinimumLength = 1)]
        public string Name {get; set;} = "";
        public DateOnly StartDate {get; set;}
        public DateOnly EndDate {get; set;}
        public decimal Discount {get; set;}
        [Range(1,int.MaxValue)]
        public int Qty {get; set;}
    }
    public class TicketUpdateRequest
    {
        public string? Name {get; set;}
        public DateOnly? StartDate {get; set;}
        public DateOnly? EndDate {get; set;}
        public decimal? Discount {get; set;}
    }
}