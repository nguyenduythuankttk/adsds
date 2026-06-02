using System.ComponentModel.DataAnnotations;
namespace Backend.Models {
    public class GuestCustomer {
        [Key]
        [MaxLength(10)]
        public string Phone { get; set; } = null!;
        [MaxLength(100)]
        public string? Name { get; set; }
        public DateTime LastBillAt { get; set; }
    }
}
