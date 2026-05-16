using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class WarehouseService : IWareHouseService
    {
        private readonly AppDbContext _dbcontext;

        public WarehouseService(AppDbContext dbContext)
        {
            _dbcontext = dbContext;
        }

        public async Task<List<Warehouse>?> GetAllWarehouse() =>
            await _dbcontext.Warehouse
                .AsNoTracking()
                .Include(w => w.Store)
                .ToListAsync();

        public async Task<Warehouse?> GetWarehouseByID(int warehouseID) =>
            await _dbcontext.Warehouse
                .AsNoTracking()
                .Include(w => w.Store)
                .FirstOrDefaultAsync(w => w.WarehouseID == warehouseID);
                
        public async Task<List<Warehouse>?> GetWarehousesByStore(int storeID) =>
            await _dbcontext.Warehouse
                .AsNoTracking()
                .Where(w => w.StoreID == storeID)
                .Include(w => w.Store)
                .ToListAsync();
        public async Task AddWarehouse(WarehouseCreateRequest createRequest)
        {
            var w = new Warehouse
            {
                StoreID  = createRequest.StoreID,
                Capacity = createRequest.Capacity
            };
            _dbcontext.Warehouse.Add(w);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task UpdateWarehouse(int warehouseID, WarehouseUpdateRequest updateRequest)
        {
            var w = await _dbcontext.Warehouse.FirstOrDefaultAsync(wh => wh.WarehouseID == warehouseID)
                ?? throw new Exception($"Warehouse {warehouseID} not found.");
            w.Capacity = updateRequest.Capacity;
            await _dbcontext.SaveChangesAsync();
        }

        public async Task SoftDeleteWarehouse(int warehouseID)
        {
            var wh = await _dbcontext.Warehouse.FirstOrDefaultAsync(w => w.WarehouseID == warehouseID)
                ?? throw new Exception($"Warehouse {warehouseID} not found.");
            if (wh.DeletedAt != null)
                throw new Exception($"Warehouse {warehouseID} is already deleted.");
            wh.DeletedAt = DateTime.UtcNow.AddHours(7);
            await _dbcontext.SaveChangesAsync();
        }
    }
}