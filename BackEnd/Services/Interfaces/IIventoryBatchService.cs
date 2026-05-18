using Backend.Models;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface
{
    public interface IInventoryBatchService
    {
        Task<InventoryBatch?> GetBatchByID(Guid batchID);
        Task<List<InventoryBatch>> GetBatchesByWarehouse(int warehouseID);
        Task<List<InventoryBatch>> GetBatchesByIngredient(int ingredientID);
        Task<List<InventoryBatch>> GetAvailableRawBatches(int? ingredientID = null);
        Task<List<InventoryBatch>> GetAvailableProcessedBatches(int? ingredientID = null);
    }
}
