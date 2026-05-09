using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class BillDetail
    {
        public Guid BillID { get; set; }
        [ForeignKey("BillID")]
        public virtual Bill Bill { get; set; } = null!;

        public int ProductVarientID { get; set; }
        [ForeignKey("ProductVarientID")]
        public virtual ProductVarient ProductVarient { get; set; } = null!;
        [Required]
        public decimal Quantity { get; set; }
        [Required]
        public decimal Price { get; set; }
        [Required]
        public decimal InlineTotal { get; set; }
    }
}