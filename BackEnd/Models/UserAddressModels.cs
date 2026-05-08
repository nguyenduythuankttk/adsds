using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{
    public class UserAddress
    {
        public Guid UserID { get; set; }

        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;

        public Guid AddressID { get; set; }

        [ForeignKey("AddressID")]
        public virtual Address Address { get; set; } = null!;

        [Required]
        public bool IsDefault { get; set; }
    }
}
