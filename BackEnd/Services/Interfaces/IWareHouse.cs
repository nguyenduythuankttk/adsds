using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;

namespace Backend.Services.Interface
{
    public interface IWareHouseService
    {
        Task<List<Warehouse>?> GetAllWarehouse();
        Task<Warehouse?> GetWarehouseByID(int warehouseID);
        Task<List<Warehouse>?> GetWarehousesByStore(int storeID);
        Task AddWarehouse(WarehouseCreateRequest createRequest);
        Task UpdateWarehouse(int warehouseID, WarehouseUpdateRequest updateRequest);
        Task SoftDeleteWarehouse(int warehouseID);
    }
}