using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public class Category {
        [Key]
        public int CategoryID { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        public string? Image { get; set; }
        public DateTime? DeletedAt { get; set; }

        [JsonIgnore]
        public virtual ICollection<Product> Product { get; set; } = new List<Product>();
    }
}
