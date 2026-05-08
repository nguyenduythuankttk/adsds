using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace Backend.Models{

    public class Receipe
    {
        public int IngredientID { get; set; }
        [ForeignKey("IngredientID")]
        public virtual Ingredient Ingredient { get; set; } = null!;
        public int ProductVarientID { get; set; }
        [ForeignKey("ProductVarientID")]
        public virtual ProductVarient ProductVarient { get; set; } = null!;
        [Required]
        public decimal QtyBeforeProcess { get; set; }
        [Required]
        public decimal QtyAfterProcess { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}