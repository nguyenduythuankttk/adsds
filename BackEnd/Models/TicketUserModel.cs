using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models {
    public class TicketUser {
        public Guid UserID { get; set; }
        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;

        public Guid TicketID { get; set; }
        [ForeignKey("TicketID")]
        public virtual Ticket Ticket { get; set; } = null!;
    }
}
