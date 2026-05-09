using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models {
    public class Ticket{
        [Key]
        public Guid TicketID {get; set;} 
        public DateTime StartDate {get; set;}
        public DateTime EndDate {get; set;}
        public decimal Discount {get; set;}
        public DateTime? DeletedAt {get; set;}
        public DateTime? UsedAt {get; set;}
        public Guid? UsedBy {get; set;}
        [ForeignKey("UsedBy")]
        [JsonIgnore]
        public virtual User? UsedByUser {get; set;}
        public Guid? UserID{get; set;}
        [ForeignKey("UserID")]
        [JsonIgnore]
        public virtual User? User {get; set;}
        [JsonIgnore]
        public virtual ICollection<TicketUser> TicketUser {get;set;} = new List<TicketUser>();
    }
}