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
        public async Task AddWarehouse(WarehouseCreateRequest createRequest){
            Warehouse w = new Warehouse {
                StoreID = createRequest.StoreID,
                Capacity = createRequest.Capacity
            };
            try{
                _dbcontext.Warehouse.Add(w);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task UpdateWarehouse(int warehouseID, WarehouseUpdateRequest updateRequest){
            try {
                var w = await _dbcontext.Warehouse.FirstOrDefaultAsync(wh => wh.WarehouseID == warehouseID);
                if (w != null){
                    w.Capacity = updateRequest.Capacity;
                    _dbcontext.Warehouse.Update(w);
                    await _dbcontext.SaveChangesAsync();
                }
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task SoftDeleteWarehouse(int warehouseID){
            try{
                var wh = await _dbcontext.Warehouse.FirstOrDefaultAsync(w => w.WarehouseID == warehouseID);
                if (wh == null) throw new Exception("Không tìm thấy kho");
                wh.DeletedAt = DateTime.UtcNow;
                _dbcontext.Warehouse.Update(wh);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
    }
}