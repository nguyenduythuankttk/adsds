using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface
{
    public interface IInventoryBatchService
    {
        Task<InventoryBatch?> GetBatchByID(Guid batchID);
        Task<List<InventoryBatch>> GetBatchesByWarehouse(int warehouseID);
        Task<List<InventoryBatch>> GetBatchesByIngredient(int ingredientID);
        Task<List<InventoryBatch>> GetAvailableRawBatches(int? ingredientID = null, int? storeID = null);
        Task<List<InventoryBatch>> GetAvailableProcessedBatches(int? ingredientID = null);
        Task<List<InventoryBatchResponse>> GetBatchesByStore(int storeID);
        Task<StoreInventoryReport> GetStoreInventoryReport(int storeID);
    }
}
