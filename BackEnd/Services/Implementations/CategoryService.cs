using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.Implementations{
    public class CategoryService : ICategoryService{
        private readonly AppDbContext _dbcontext;
        public CategoryService (AppDbContext dbContext){
            _dbcontext = dbContext;
        }
        public async Task <List<Category>?> GetAllCategory() =>
            await _dbcontext.Category
            .AsNoTracking()
            .Include(c => c.Product)
            .ToListAsync();
        public async Task <List<Product>?> GetProductInCategory(int categoryID) =>
            await _dbcontext.Product
            .AsNoTracking()
            .Where (p => p.CategoryID == categoryID)
            .Include (p => p.Category)
            .ToListAsync();
        public async Task <Category?> GetCategoryByID(int categoryID) =>
            await _dbcontext.Category
                .AsNoTracking()
                .Where (c => c.CategoryID == categoryID)
                .Include(c => c.Product)
                .FirstOrDefaultAsync();
        public async Task AddCategory(Category newCategory){
            try{
                _dbcontext.Category.Add(newCategory);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task UpdateCategory (int categoryID, string img){
            try {
                var category = await _dbcontext.Category.FirstOrDefaultAsync(c =>c.CategoryID == categoryID);
                if (category != null){
                    category.Image = img;
                    _dbcontext.Category.Update(category);
                    await _dbcontext.SaveChangesAsync(); 
                }
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task DeleteCategory (int deleteCategoryID){
            try {
                var cat = await _dbcontext.Category.FirstOrDefaultAsync(c => c.CategoryID == deleteCategoryID);
                if (cat != null){
                _dbcontext.Category.Remove(cat);
                await _dbcontext.SaveChangesAsync();}
            }catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task SoftDeletedCategory(int catID){
                var category = await _dbcontext.Category.FirstOrDefaultAsync(c => c.CategoryID == catID
                                                                        && c.DeletedAt == null);
                if (category == null)
                {
                    throw new Exception("Category not found!");
                }

                try {
                    category.DeletedAt = DateTime.UtcNow;
                    await _dbcontext.SaveChangesAsync();
                }catch(Exception ex)
                {
                    Console.WriteLine($"Soft delete category error {ex.Message}");
                    throw new Exception($"An error occurred whie soft deleting Category {ex.Message}");
                }
        }
    }
}
