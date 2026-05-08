using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.Implementations{
    public class IngredientService : IIngredientService{
        private readonly AppDbContext _dbcontext;
        public IngredientService (AppDbContext dbContext){
            _dbcontext = dbContext;
        }
        public async Task<List<Ingredient>?> GetAllIngredient() =>
            await _dbcontext.Ingredient
                    .ToListAsync();
        public async Task <Ingredient?> GetIngredientByID(int id) =>
            await _dbcontext.Ingredient.FirstOrDefaultAsync(i => i.IngredientID == id);
        public async Task AddIngredient (Ingredient ing){
            try {
                _dbcontext.Ingredient.Add(ing);
                await _dbcontext.SaveChangesAsync();
            }catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task SoftDeleteIngredient (int id){
            var ingredient = await _dbcontext.Ingredient
                .FirstOrDefaultAsync(i => i.IngredientID == id &&
                                    i.DeletedAt == null);
            
            if(ingredient == null){
                throw new Exception("Ingredient not found");
            }

            try{
                ingredient.DeletedAt = DateTime.Now;
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine($"Soft delete ingredient error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting ingredient: {ex.Message}");
            }
        }
        public async Task UpdateIngredient (IngredientUpdateRequest request, int id){
            try{
                var ing = await _dbcontext.Ingredient.FirstOrDefaultAsync(i => i.IngredientID == id);
                if (ing != null){
                    ing.IngredientName = request.IngredientName;
                    ing.CostPerUnit = request.CostPerUnit;
                    _dbcontext.Ingredient.Update(ing);
                    await _dbcontext.SaveChangesAsync();
                }
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task <List<IngredientReponse>?> GetQtyAllIngredientInStore(int storeID){
            try {
                var ingList = await _dbcontext.Ingredient
                                .Include(i => i.InventoryBatch)
                                    .ThenInclude (i => i.Warehouse)
                                    .Where(i=> i.InventoryBatch.Any((ib => ib.Warehouse.StoreID == storeID)))
                                .ToListAsync();
                if (!ingList.Any()) return null;
                return ingList.Select(i=> new IngredientReponse{
                    IngredientID = i.IngredientID,
                    IngredientName = i.IngredientName,
                    IngredientUnit = i.IngredientUnit,
                    CostPerUnit = i.CostPerUnit,
                    StoreID = storeID,
                    QtyOnHand = i.InventoryBatch
                                .Where(ib => ib.Warehouse.StoreID == storeID)
                                .Sum(ib => ib.QuantityOnHand)
                }).ToList();
            } catch (Exception e){
                Console.WriteLine(e.Message);
                return null;
            }
        }
    }
}