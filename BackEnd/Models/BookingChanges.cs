using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models {
    public enum BookingStatus {
        Pending,
        Confirmed,
        Cancelled,
        Completed,
        Noshow
    }
    public class BookingChange{
        [Key]
        public Guid ChangeID {get; set; }
        public BookingStatus BookingStatus {get; set; }
        public string? comment {get; set; }
        public DateTime ChangeAt {get; set; } 
        [ForeignKey("BookingID")]
        public virtual Booking Booking {get; set; } = null!;
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee {get; set; } = null!;
    }
}