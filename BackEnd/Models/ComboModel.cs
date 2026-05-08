using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{
    public class Combo{
        [Key]
        public int ComboID {get; set;}
        [Required]
        public string ComboName {get; set;} = null!;
        [Required]
        public decimal FixedPrice {get; set;}
        public string? Img {get; set;}
        [Required]
        public bool IsActive{get; set;}
        public DateTime? DeletedAt { get; set; }
        [JsonIgnore]
        public virtual ICollection<ComboProduct> ComboProduct {get; set;} = new List<ComboProduct>();
    }
}