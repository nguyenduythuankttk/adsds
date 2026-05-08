using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface ICategoryService{
        Task <List<Category>?> GetAllCategory();
        Task <List<Product>?> GetProductInCategory(int categoryID);
        Task <Category?> GetCategoryByID(int categoryID);
        Task AddCategory(Category newCategory);
        Task UpdateCategory (int categoryID, string img);
        Task SoftDeletedCategory(int catID);
        Task DeleteCategory (int deleteCategoryID);
    }
}
