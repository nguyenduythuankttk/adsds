using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models {
    public class PODetail{
        public Guid POID{get; set;}
        [ForeignKey("POID")]
        public virtual PurchaseOrder PurchaseOrder{get; set;} = null!;
        public int IngredientID{get; set;}
        [ForeignKey("IngredientID")]
        public virtual Ingredient Ingredient{get; set;} = null!;
        [Required]
        public decimal Quantity {get; set;}
        [Required]
        public decimal UnitPriceExpected {get; set;}
    }
}