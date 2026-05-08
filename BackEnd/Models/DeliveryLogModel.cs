using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public enum DeliveryStatus {
        Create,
        Pending,        
        Confirmed,   
        Preparing,  
        OnTheWay,   
        Delivered,   
        Cancelled,
        Failed     
    }
    public class DeliveryLog {
        [Key]
        public Guid LogID { get; set; }
        public Guid DeliveryID { get; set; }
        [ForeignKey("DeliveryID")]
        public virtual DeliveryInfo DeliveryInfo { get; set; } = null!;
        public Guid EmployeeID { get; set; }
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; } = null!;
        [Required]
        public DeliveryStatus Status { get; set;}
        [Required]
        public DateTime ChangeAt { get; set; }
        public string? Note { get; set; }
    }
}
