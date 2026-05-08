using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public class ReceiptChange{
        [Key]
        public Guid ReceiptChangeID {get; set;}
        public Guid ReceiptID {get; set;}
        [ForeignKey("ReceiptID")]
        public virtual Receipt Receipt {get; set;} = null!;
        [Required]
        public ReceiptStatus Status {get; set;}
        public Guid EmployeeID {get; set;}
        [ForeignKey("EmployeeID")]
        public Employee Employee {get; set;}
        public DateTime UpdateAt {get; set;} 

    }
}