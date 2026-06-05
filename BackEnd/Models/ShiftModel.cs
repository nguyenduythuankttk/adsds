using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public enum ShiftStatus {
        Scheduled,
        OnTime,
        Late,
        EarlyLeave,
        Absent,
        Completed
    }

    public class Shift{
        [Key]
        public Guid ShiftID {get; set;}
        public Guid EmployeeID {get; set;}
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee {get; set;} = null!;
        [Required]
        public DateTime TimeIn {get; set;}
        [Required]
        public DateTime TimeOut {get; set;}
        public DateTime? CheckIn {get; set;}
        public DateTime? CheckOut {get; set;}
        public ShiftStatus Status {get; set;} = ShiftStatus.Scheduled;
        public DateTime? DeletedAt { get; set; }

    }
}
