using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models {
    public class Supplier{
        [Key]
        public int SupplierID{get; set;}
        [Required, MaxLength(100)]
        public string SupplierName{get; set;} = null!;
        
        [Required, Phone, MaxLength(11)]
        public string Phone{get; set;} = null!;
        [Required, MaxLength(100)]
        public string Email{get; set;} = null!;
        [Required, MaxLength(15)]
        public string TaxCode{get; set;} = null!;
        public DateTime? DeletedAt {get; set; }

        [JsonIgnore]
        public virtual Address? Address { get; set; }
    }
}