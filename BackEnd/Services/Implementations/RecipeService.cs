using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class RecipeService : IRecipeService
    {
        private readonly AppDbContext _dbContext;

        public RecipeService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Receipe>?> GetAllRecipes() =>
            await _dbContext.Receipe
                .Where(r => r.DeletedAt == null)
                .AsNoTracking()
                .Include(r => r.Ingredient)
                .Include(r => r.ProductVarient)
                .ToListAsync();

        public async Task<Receipe?> GetRecipeByID(int ingredientID, int productVarientID) =>
            await _dbContext.Receipe
                .Where(r => r.DeletedAt == null && r.IngredientID == ingredientID && r.ProductVarientID == productVarientID)
                .AsNoTracking()
                .Include(r => r.Ingredient)
                .Include(r => r.ProductVarient)
                .FirstOrDefaultAsync();


        public async Task AddRecipe(RecipeCreateRequest request)
        {
            var recipe = new Receipe
            {
                IngredientID = request.IngredientID,
                ProductVarientID = request.ProductVarientID,
                QtyBeforeProcess = request.QtyBeforeProcess,
                QtyAfterProcess = request.QtyAfterProcess
            };

            await _dbContext.Receipe.AddAsync(recipe);
            await _dbContext.SaveChangesAsync();
        }

        public async Task UpdateRecipe(int ingredientID, int productVarientID, RecipeUpdateRequest request)
        {
            var recipe = await _dbContext.Receipe
                .FirstOrDefaultAsync(r => r.IngredientID == ingredientID && r.ProductVarientID == productVarientID && r.DeletedAt == null);

            if (recipe == null)
                throw new KeyNotFoundException($"Recipe not found for Ingredient {ingredientID} and Product Varient {productVarientID}");

            if (request.QtyBeforeProcess.HasValue)
                recipe.QtyBeforeProcess = request.QtyBeforeProcess.Value;

            if (request.QtyAfterProcess.HasValue)
                recipe.QtyAfterProcess = request.QtyAfterProcess.Value;

            _dbContext.Receipe.Update(recipe);
            await _dbContext.SaveChangesAsync();
        }

        public async Task DeleteRecipe(int ingredientID, int productVarientID)
        {
            var recipe = await _dbContext.Receipe
                .FirstOrDefaultAsync(r => r.IngredientID == ingredientID && r.ProductVarientID == productVarientID && r.DeletedAt == null);

            if (recipe == null)
                throw new KeyNotFoundException($"Recipe not found for Ingredient {ingredientID} and Product Varient {productVarientID}");

            recipe.DeletedAt = DateTime.UtcNow;
            _dbContext.Receipe.Update(recipe);
            await _dbContext.SaveChangesAsync();
        }
    }
}
