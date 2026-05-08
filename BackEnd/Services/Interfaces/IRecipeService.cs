using Backend.Models;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface
{
    public interface IRecipeService
    {
        Task<List<Receipe>?> GetAllRecipes();
        Task<Receipe?> GetRecipeByID(int ingredientID, int productVarientID);
        Task AddRecipe(RecipeCreateRequest request);
        Task UpdateRecipe(int ingredientID, int productVarientID, RecipeUpdateRequest request);
        Task DeleteRecipe(int ingredientID, int productVarientID);
    }
}
