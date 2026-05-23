using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

 namespace Backend.Services.Implementations
 {
     public class StoreService : IStoreService
     {
         private readonly AppDbContext _dbContext;
         private readonly IGeocodingService _geocoding;
         public StoreService(AppDbContext dbContext, IGeocodingService geocoding)
         {
             _dbContext = dbContext;
             _geocoding = geocoding;
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
                        StreetAddress = s.Address.StreetAddress,
                        District = s.Address.District,
                        Province = s.Address.Province,
                        Latitude = s.Address.Latitude,
                        Longitude = s.Address.Longitude
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
                        StreetAddress = s.Address.StreetAddress,
                        District = s.Address.District,
                        Province = s.Address.Province,
                        Latitude = s.Address.Latitude,
                        Longitude = s.Address.Longitude
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

        public async Task<ShippingFeeResponse> GetShippingFee(Guid addressID, int? storeID = null)
        {
            var address = await _dbContext.Address
                .FirstOrDefaultAsync(a => a.AddressID == addressID);

            if (address == null)
                throw new Exception("Không tìm thấy địa chỉ.");

            if (address.Latitude == null || address.Longitude == null)
            {
                var parts = new List<string>();
                if (!string.IsNullOrWhiteSpace(address.StreetAddress)) parts.Add(address.StreetAddress);
                if (!string.IsNullOrWhiteSpace(address.District))      parts.Add(address.District);
                if (!string.IsNullOrWhiteSpace(address.Province))      parts.Add(address.Province);
                parts.Add("Việt Nam");
                var coords = await _geocoding.GeocodeAsync(string.Join(", ", parts));
                if (coords.HasValue)
                {
                    address.Latitude  = coords.Value.Lat;
                    address.Longitude = coords.Value.Lng;
                    await _dbContext.SaveChangesAsync();
                }
            }

            if (address.Latitude == null || address.Longitude == null)
                throw new Exception("Không thể xác định tọa độ địa chỉ.");

            var storesQuery = _dbContext.Store
                .Where(s => s.DeletedAt == null)
                .Include(s => s.Address)
                .Where(s => s.Address != null && s.Address.Latitude != null && s.Address.Longitude != null)
                .AsNoTracking();

            if (storeID.HasValue)
                storesQuery = storesQuery.Where(s => s.StoreID == storeID.Value);

            var stores = await storesQuery.ToListAsync();

            if (!stores.Any())
                throw new Exception("Không tìm thấy cửa hàng nào.");

            double minDist = double.MaxValue;
            foreach (var s in stores)
            {
                double d = HaversineKm(
                    address.Latitude!.Value, address.Longitude!.Value,
                    s.Address!.Latitude!.Value, s.Address.Longitude!.Value);
                if (d < minDist) minDist = d;
            }

            const double MaxDeliveryKm = 50.0;
            if (minDist > MaxDeliveryKm)
                return new ShippingFeeResponse
                {
                    DistanceKm = Math.Round(minDist, 2),
                    ShippingFee = 0,
                    IsDeliverable = false
                };

            decimal rate = minDist < 4 ? 15000m : minDist <= 10 ? 17000m : 21000m;
            return new ShippingFeeResponse
            {
                DistanceKm = Math.Round(minDist, 2),
                ShippingFee = Math.Round((decimal)minDist * rate),
                IsDeliverable = true
            };
        }

        private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0;
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                  + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                  * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }
    }
}

