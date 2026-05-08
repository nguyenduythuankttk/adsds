using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{

    public class Store
    {
        [Key]
        public int StoreID { get; set; }
        [Required, MaxLength(255)]
        public string StoreName {get; set; } = null!;
        [Required, Phone, MaxLength(255)]

        public string Phone { get; set; } = null!;
        [Required, MaxLength(100)]
        public string Email { get; set; } = null!;
        
        public int TotalReviews { get; set; }
        [Required]
        public int TotalPoints { get; set; }
        [Required]
        public int SeatingCapacity { get; set; }
        public DateTime? DeletedAt {get; set; }

        public virtual Address Address { get; set; } = null!;

        [JsonIgnore]
        public virtual ICollection<Employee> Employee { get; set; } = new List<Employee>();

        [JsonIgnore]
        public virtual ICollection<Warehouse> Warehouse { get; set; } = new List<Warehouse>();

        [JsonIgnore]
        public virtual ICollection<DiningTable> DiningTable { get; set; } = new List<DiningTable>();
    }
}