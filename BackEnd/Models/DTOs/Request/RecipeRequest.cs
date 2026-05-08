namespace Backend.Models.DTOs.Request
{
    public class RecipeCreateRequest
    {
        public int IngredientID { get; set; }
        public int ProductVarientID { get; set; }
        public decimal QtyBeforeProcess { get; set; }
        public decimal QtyAfterProcess { get; set; }
    }

    public class RecipeUpdateRequest
    {
        public decimal? QtyBeforeProcess { get; set; }
        public decimal? QtyAfterProcess { get; set; }
    }
}
