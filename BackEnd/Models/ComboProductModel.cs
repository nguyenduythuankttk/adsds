using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models{
    public class ComboProduct {
        public int ComboID {get; set;}
        [ForeignKey("ComboID")]
        public virtual Combo Combo {get; set;} = null!;
        public int ProductVarientID {get; set;}
        [ForeignKey("ProductVarientID")]
        public virtual ProductVarient ProductVarient {get; set;} = null;
        [Required]
        public decimal Quantity{get; set;}

    }
}