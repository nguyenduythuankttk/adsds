using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models {

    public class Booking {
        [Key]
        public Guid BookingID {get; set;}
        [Required]
        public DateTime ScheduledTime { get; set; }
        [Required, Range(1, 12)]
        public int NumberOfGuess {get; set; } 
        public string? GuestComment {get; set; }
        public Guid UserID { get; set; }
        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;
        public int TableID { get; set; }

        [ForeignKey("TableID")]
        public virtual DiningTable Table { get; set; } = null!;
        public virtual BookingChange BookingChange {get; set; } = null!;
        public DateTime? DeletedAt {get; set;}
    }
}
