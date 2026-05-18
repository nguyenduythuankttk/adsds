using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
namespace Backend.Models
{
    [PrimaryKey(nameof(ProductID),nameof(ComboID))]
    public class ComboDetail
    {   
        public int ComboID{get; set;}
        [ForeignKey("ComboID")]
        public virtual Product Combo{get; set;} = null!;
        public int ProductID {get; set;}
        [ForeignKey("ProductID")]
        public virtual Product Product {get; set;} = null!;
        public decimal qty {get; set;} 
    }
}