using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{
    public enum BillStatus{
        Create,
        Paid,
        UnPaid,
        Delete
    }
    public class BillChange{
        [Key]
        public Guid BillChangeID { get; set;}
        public Guid BillID{ get; set;}
        [ForeignKey("BillID")]
        public virtual Bill Bill {get; set;} = null!;
        public Guid? EmployeeID {get; set;}
        [ForeignKey("EmployeeID")]
        public virtual Employee? Employee {get; set;} = null!;
        [Required]
        public DateTime ChangeAt {get; set;}
        [Required]
        public BillStatus Status {get; set;}
    }
}