using Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models.DTOs.Reponse{
    public class BillReponse{
        public StoreResponse Store {get; set;}
        public List<BillDetailReponse> Detail = new List<BillDetailReponse>();
        public decimal TotalPrice {get; set;}
    }
    public class BillDetailReponse{
        public int ProductVarientID { get; set; }

        [ForeignKey("ProductVarientID")]
        public virtual ProductVarient ProductVarient { get; set; } = null!;
        public decimal Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal InlineTotal { get; set; }
    }
}