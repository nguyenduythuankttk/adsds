using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
namespace Backend.Services.Interface{
    public interface IIngredientService{
        Task<List<Ingredient>?> GetAllIngredient();
        Task <Ingredient?> GetIngredientByID(int id);
        Task AddIngredient (Ingredient ing);
        Task UpdateIngredient (IngredientUpdateRequest request, int id);
        Task SoftDeleteIngredient (int id);
        Task <List<IngredientReponse>?> GetQtyAllIngredientInStore(int storeID);
    }
}