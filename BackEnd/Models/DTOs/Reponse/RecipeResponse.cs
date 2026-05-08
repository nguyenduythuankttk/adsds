namespace Backend.Models.DTOs.Reponse
{
    public class RecipeResponse
    {
        public int IngredientID { get; set; }
        public string IngredientName { get; set; } = null!;
        public string IngredientUnit { get; set; } = null!;
        public decimal CostPerUnit { get; set; }
        
        public int ProductVarientID { get; set; }
        public string ProductVarientSize { get; set; } = null!;
        public decimal ProductVarientPrice { get; set; }
        
        public decimal QtyBeforeProcess { get; set; }
        public decimal QtyAfterProcess { get; set; }
    }
}
