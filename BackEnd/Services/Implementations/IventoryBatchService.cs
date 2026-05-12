using Backend.Data;
using Backend.Models;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class InventoryBatchService : IInventoryBatchService
    {
        private readonly AppDbContext _dbContext;

        public InventoryBatchService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<InventoryBatch?> GetBatchByID(Guid batchID) =>
            await _dbContext.InventoryBatch
                .AsNoTracking()
                .Include(b => b.Ingredient)
                .Include(b => b.Warehouse)
                .FirstOrDefaultAsync(b => b.BatchID == batchID);

        public async Task<List<InventoryBatch>> GetBatchesByWarehouse(int warehouseID) =>
            await _dbContext.InventoryBatch
                .AsNoTracking()
                .Where(b => b.WarehouseID == warehouseID)
                .Include(b => b.Ingredient)
                .Include(b => b.Warehouse)
                .OrderBy(b => b.ImportDate)
                .ToListAsync();

        public async Task<List<InventoryBatch>> GetBatchesByIngredient(int ingredientID) =>
            await _dbContext.InventoryBatch
                .AsNoTracking()
                .Where(b => b.IngredientID == ingredientID)
                .Include(b => b.Ingredient)
                .Include(b => b.Warehouse)
                .OrderBy(b => b.ImportDate)
                .ToListAsync();

        // Raw batches available for processing — optionally filter by ingredient
        public async Task<List<InventoryBatch>> GetAvailableRawBatches(int? ingredientID = null)
        {
            var query = _dbContext.InventoryBatch
                .AsNoTracking()
                .Where(b => b.BatchType == BatchType.Raw
                         && b.Status == BatchStatus.Available
                         && b.QuantityOnHand > 0);

            if (ingredientID.HasValue)
                query = query.Where(b => b.IngredientID == ingredientID.Value);

            return await query
                .Include(b => b.Ingredient)
                .Include(b => b.Warehouse)
                .OrderBy(b => b.Exp)
                .ThenBy(b => b.ImportDate)
                .ToListAsync();
        }

        // Processed batches available for sale — optionally filter by ingredient
        public async Task<List<InventoryBatch>> GetAvailableProcessedBatches(int? ingredientID = null)
        {
            var query = _dbContext.InventoryBatch
                .AsNoTracking()
                .Where(b => b.BatchType == BatchType.Processed
                         && b.Status == BatchStatus.Available
                         && b.QuantityOnHand > 0);

            if (ingredientID.HasValue)
                query = query.Where(b => b.IngredientID == ingredientID.Value);

            return await query
                .Include(b => b.Ingredient)
                .Include(b => b.Warehouse)
                .OrderBy(b => b.ImportDate)
                .ToListAsync();
        }
    }
}
