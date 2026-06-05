using Backend.Data;
using Backend.Helpers;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
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

        // Tất cả lô hàng nằm trong các kho thuộc storeID — dùng cho "Kiểm tra kho"
        // của admin. Trả về DTO phẳng để tránh nạp lại Warehouse/Store cho từng lô.
        public async Task<List<InventoryBatchResponse>> GetBatchesByStore(int storeID) {
            return await _dbContext.InventoryBatch
                .AsNoTracking()
                .Where(b => b.Warehouse.StoreID == storeID && b.Warehouse.DeletedAt == null)
                .OrderBy(b => b.ImportDate)
                .Select(b => new InventoryBatchResponse {
                    BatchID = b.BatchID,
                    BatchCode = b.BatchCode,
                    WarehouseID = b.WarehouseID,
                    StoreID = b.Warehouse.StoreID,
                    StoreName = b.Warehouse.Store != null ? b.Warehouse.Store.StoreName : null,
                    IngredientID = b.IngredientID,
                    IngredientName = b.Ingredient.IngredientName,
                    IngredientUnit = b.Ingredient.IngredientUnit.ToString(),
                    BatchType = b.BatchType,
                    Status = b.Status,
                    QuantityOriginal = b.QuantityOriginal,
                    QuantityOnHand = b.QuantityOnHand,
                    UnitCost = b.UnitCost,
                    ImportDate = b.ImportDate,
                    Mfd = b.Mfd,
                    Exp = b.Exp
                })
                .ToListAsync();
        }

        public async Task<StoreInventoryReport> GetStoreInventoryReport(int storeID) {
            var today = VnTime.Today;
            var sevenDays = today.AddDays(7);

            var store = await _dbContext.Store
                .AsNoTracking()
                .Where(s => s.StoreID == storeID)
                .Select(s => new { s.StoreID, s.StoreName })
                .FirstOrDefaultAsync();
            if (store == null)
                throw new Exception("Không tìm thấy cửa hàng.");

            var warehouses = await _dbContext.Warehouse
                .AsNoTracking()
                .Where(w => w.StoreID == storeID && w.DeletedAt == null)
                .Select(w => new WarehouseUsageResponse {
                    WarehouseID = w.WarehouseID,
                    StoreID = w.StoreID,
                    StoreName = store.StoreName,
                    Capacity = w.Capacity,
                    CurrentLoad = w.InventoryBatch.Where(b => b.Status == BatchStatus.Available).Sum(b => b.QuantityOnHand),
                    BatchCount = w.InventoryBatch.Count
                })
                .ToListAsync();

            var batches = await _dbContext.InventoryBatch
                .AsNoTracking()
                .Where(b => b.Warehouse.StoreID == storeID && b.Warehouse.DeletedAt == null)
                .Select(b => new {
                    b.BatchID, b.Status, b.QuantityOnHand, b.UnitCost, b.Exp,
                    b.IngredientID,
                    IngredientName = b.Ingredient.IngredientName,
                    IngredientUnit = b.Ingredient.IngredientUnit
                })
                .ToListAsync();

            var ingredients = batches
                .GroupBy(b => new { b.IngredientID, b.IngredientName, b.IngredientUnit })
                .Select(g => new InventoryIngredientSummary {
                    IngredientID = g.Key.IngredientID,
                    IngredientName = g.Key.IngredientName,
                    IngredientUnit = g.Key.IngredientUnit.ToString(),
                    TotalOnHand = g.Where(x => x.Status == BatchStatus.Available).Sum(x => x.QuantityOnHand),
                    BatchCount = g.Count(),
                    ExpiringCount = g.Count(x => x.Status == BatchStatus.Available && x.Exp >= today && x.Exp <= sevenDays),
                    ExpiredCount = g.Count(x => x.Status == BatchStatus.Expired || x.Exp < today),
                    TotalValue = g.Where(x => x.Status == BatchStatus.Available).Sum(x => x.QuantityOnHand * x.UnitCost)
                })
                .OrderByDescending(x => x.TotalOnHand)
                .ToList();

            return new StoreInventoryReport {
                StoreID = store.StoreID,
                StoreName = store.StoreName,
                WarehouseCount = warehouses.Count,
                TotalBatches = batches.Count,
                AvailableBatches = batches.Count(b => b.Status == BatchStatus.Available && b.QuantityOnHand > 0),
                ExpiringBatches = batches.Count(b => b.Status == BatchStatus.Available && b.Exp >= today && b.Exp <= sevenDays),
                ExpiredBatches = batches.Count(b => b.Status == BatchStatus.Expired || b.Exp < today),
                TotalValue = batches.Where(b => b.Status == BatchStatus.Available).Sum(b => b.QuantityOnHand * b.UnitCost),
                Warehouses = warehouses,
                Ingredients = ingredients
            };
        }
    }
}
