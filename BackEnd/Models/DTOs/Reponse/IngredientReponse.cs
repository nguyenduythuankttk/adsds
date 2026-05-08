namespace Backend.Models.DTOs.Reponse {
    public class IngredientReponse{
        public int IngredientID { get; set; }
        public int StoreID {get; set;}
        public string IngredientName { get; set; } = null!;
        public IngredientUnit IngredientUnit { get; set; }
        public decimal CostPerUnit { get; set; }
        public decimal QtyOnHand {get; set;}

    }
}