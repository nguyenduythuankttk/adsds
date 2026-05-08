using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

 namespace Backend.Services.Implementations
 {
     public class StoreService : IStoreService
     {
         private readonly AppDbContext _dbContext;
         public StoreService(AppDbContext dbContext)
         {
             _dbContext = dbContext;
         }

         public async Task<List<StoreResponse>?> GetAllStore() =>
            await _dbContext.Store
                .Where(s => s.DeletedAt == null)
                .Include(s => s.Address)
                .Select(s => new StoreResponse
                {
                    StoreID = s.StoreID,
                    StoreName = s.StoreName,
                    Phone = s.Phone,
                    Email = s.Email,
                    TotalReviews = s.TotalReviews,
                    TotalPoints = s.TotalPoints,
                    SeatingCapacity = s.SeatingCapacity,
                    Address = new AddressResponse
                    {
                        AddressID = s.Address.AddressID,
                        HouseNumber = s.Address.HouseNumber,
                        Street = s.Address.Street,
                        Ward = s.Address.Ward,
                        District = s.Address.District,
                        Province = s.Address.Province,
                        Country = s.Address.Country
                    }
                })
                .ToListAsync();

        public async Task<StoreResponse?> GetStoreByID (int storeID) => 
            await _dbContext.Store
                .Where(s => s.StoreID == storeID && s.DeletedAt == null)
                .AsNoTracking()
                .Include(s => s.Address)
                .Select(s => new StoreResponse
                {
                    StoreID = s.StoreID,
                    StoreName = s.StoreName,
                    Phone = s.Phone,
                    Email = s.Email,
                    TotalReviews = s.TotalReviews,
                    TotalPoints = s.TotalPoints,
                    SeatingCapacity = s.SeatingCapacity,
                    Address = new AddressResponse
                    {
                        AddressID = s.Address.AddressID,
                        HouseNumber = s.Address.HouseNumber,
                        Street = s.Address.Street,
                        Ward = s.Address.Ward,
                        District = s.Address.District,
                        Province = s.Address.Province,
                        Country = s.Address.Country
                    }
                })
                .FirstOrDefaultAsync();

        public async Task<Store?> GetStoreByAdress(Guid addressID) => 
            await _dbContext.Store
                .Include(s => s.Address)
                .FirstOrDefaultAsync(s => s.Address.AddressID == addressID);

        public async Task AddStore(Store store)
        {
            try
            {
                //Thêm store
                _dbContext.Store.Add(store);
                await _dbContext.SaveChangesAsync();
            } catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        public async Task UpdateStore(int storeID, StoreUpdateRequest request)
        {
            var store = await _dbContext.Store.FindAsync(storeID); //Thuận set trong db là Store

            if(store == null)
                throw new Exception("Store not found");
            try
            {
                store.Phone = request.Phone; //gắn vào ram tạm
                store.Email = request.Email;
                store.SeatingCapacity = request.SeatingCapacity;

                await _dbContext.SaveChangesAsync();
            } catch (Exception ex)
            {
                Console.WriteLine($"Update Store Error: {ex.Message}");
                throw new Exception($"An error occurred while updating the store: {ex.Message}");
            }

        }

        public async Task SoftDeleteStore(int storeID)
        {
            var store = await _dbContext.Store
                .FirstOrDefaultAsync(s => s.StoreID == storeID &&
                                    s.DeletedAt == null);

            if(store == null)
                throw new Exception("Store not found!");

            try
            {
                store.DeletedAt = DateTime.Now;
                await _dbContext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Soft delete store error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting store {ex.Message}");
            }
            
        }



    }
}

