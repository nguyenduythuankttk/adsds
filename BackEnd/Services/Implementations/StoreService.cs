using Backend.Data;
using Backend.Helpers;
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
                    Address = s.Address == null ? null : new AddressResponse
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
                    Address = s.Address == null ? null : new AddressResponse
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

        // Tạo chi nhánh mới kèm địa chỉ, tài khoản ngân hàng và tài khoản quản lý.
        // Manager vừa tạo được gán StoreID = store mới (yêu cầu cốt lõi). Toàn bộ
        // chạy trong 1 transaction để không tạo store "mồ côi" khi 1 bước lỗi.
        public async Task<int> CreateStoreFull(StoreCreateRequest request)
        {
            // ----- Validate cửa hàng -----
            if (string.IsNullOrWhiteSpace(request.StoreName))
                throw new Exception("Tên chi nhánh không được để trống.");
            if (string.IsNullOrWhiteSpace(request.Phone))
                throw new Exception("Số điện thoại chi nhánh không được để trống.");
            if (string.IsNullOrWhiteSpace(request.Email))
                throw new Exception("Email chi nhánh không được để trống.");

            // ----- Validate địa chỉ (bắt buộc) -----
            if (string.IsNullOrWhiteSpace(request.StreetAddress) ||
                string.IsNullOrWhiteSpace(request.District) ||
                string.IsNullOrWhiteSpace(request.Province))
                throw new Exception("Vui lòng nhập đầy đủ địa chỉ chi nhánh.");

            // ----- Validate tài khoản ngân hàng (bắt buộc) -----
            if (string.IsNullOrWhiteSpace(request.BankAccountNumber) ||
                string.IsNullOrWhiteSpace(request.BankCode) ||
                string.IsNullOrWhiteSpace(request.BankAccountHolderName))
                throw new Exception("Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng.");

            // ----- Validate tài khoản quản lý (bắt buộc) -----
            var m = request.Manager;
            if (m == null ||
                string.IsNullOrWhiteSpace(m.UserName) ||
                string.IsNullOrWhiteSpace(m.Password) ||
                string.IsNullOrWhiteSpace(m.FullName) ||
                string.IsNullOrWhiteSpace(m.Phone))
                throw new Exception("Vui lòng nhập đầy đủ thông tin tài khoản quản lý.");

            // ----- Kiểm tra trùng (UserName/Phone/Email là unique trên bảng User) -----
            if (await _dbContext.User.AnyAsync(u => u.UserName == m.UserName))
                throw new Exception($"Tên đăng nhập '{m.UserName}' đã tồn tại.");
            if (await _dbContext.User.AnyAsync(u => u.Phone == m.Phone))
                throw new Exception($"Số điện thoại '{m.Phone}' đã được sử dụng.");
            if (!string.IsNullOrWhiteSpace(m.Email) &&
                await _dbContext.User.AnyAsync(u => u.Email == m.Email))
                throw new Exception($"Email '{m.Email}' đã được sử dụng.");

            using var tx = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var store = new Store
                {
                    StoreName = request.StoreName.Trim(),
                    Phone = request.Phone.Trim(),
                    Email = request.Email.Trim(),
                    SeatingCapacity = request.SeatingCapacity,
                    TotalReviews = 0,
                    TotalPoints = 0
                };
                _dbContext.Store.Add(store);
                await _dbContext.SaveChangesAsync(); // sinh StoreID

                // Địa chỉ + geocode best-effort (cần toạ độ để tính phí giao hàng).
                var address = new Address
                {
                    StreetAddress = request.StreetAddress.Trim(),
                    District = request.District.Trim(),
                    Province = request.Province.Trim(),
                    StoreID = store.StoreID
                };
                try
                {
                    var parts = new List<string>
                        { address.StreetAddress, address.District, address.Province, "Việt Nam" };
                    var coords = await _geocoding.GeocodeAsync(string.Join(", ", parts));
                    if (coords.HasValue)
                    {
                        address.Latitude = coords.Value.Lat;
                        address.Longitude = coords.Value.Lng;
                    }
                }
                catch { /* geocode lỗi không chặn việc tạo store */ }
                _dbContext.Address.Add(address);

                // Tài khoản ngân hàng — chuẩn hoá giống BankAccountService để khớp webhook.
                _dbContext.BankAccount.Add(new BankAccount
                {
                    StoreID = store.StoreID,
                    AccountNumber = request.BankAccountNumber.Trim().Replace(" ", ""),
                    BankCode = request.BankCode.Trim().ToUpper(),
                    AccountHolderName = request.BankAccountHolderName.Trim()
                });

                // Manager — StoreID = store vừa tạo.
                _dbContext.Employee.Add(new Employee
                {
                    UserID = Guid.NewGuid(),
                    UserName = m.UserName.Trim(),
                    HashPassword = BCrypt.Net.BCrypt.HashPassword(m.Password),
                    FullName = m.FullName.Trim(),
                    Phone = m.Phone.Trim(),
                    Email = string.IsNullOrWhiteSpace(m.Email) ? null : m.Email.Trim(),
                    BirthDate = m.BirthDate,
                    Gender = m.Gender,
                    Role = RoleType.Manager,
                    StoreID = store.StoreID,
                    BasicSalary = m.BasicSalary,
                    CreateAt = VnTime.Now
                });

                await _dbContext.SaveChangesAsync();
                await tx.CommitAsync();
                return store.StoreID;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
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
                store.DeletedAt = VnTime.Now;
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
                var coords = await GeocodeWithFallbackAsync(address.StreetAddress, address.District, address.Province);
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
                .Where(s => s.Address != null);

            if (storeID.HasValue)
                storesQuery = storesQuery.Where(s => s.StoreID == storeID.Value);

            var stores = await storesQuery.ToListAsync();

            if (!stores.Any())
                throw new Exception("Không tìm thấy cửa hàng nào.");

            // Cửa hàng chưa có toạ độ (vd: tạo trước khi có geocode, hoặc geocode lỗi lúc tạo):
            // geocode lại theo địa chỉ rồi lưu, để không hard-fail làm FE hiển thị phí = 0.
            bool storeCoordsChanged = false;
            foreach (var s in stores)
            {
                if (s.Address == null || (s.Address.Latitude != null && s.Address.Longitude != null))
                    continue;
                var sCoords = await GeocodeWithFallbackAsync(s.Address.StreetAddress, s.Address.District, s.Address.Province);
                if (sCoords.HasValue)
                {
                    s.Address.Latitude  = sCoords.Value.Lat;
                    s.Address.Longitude = sCoords.Value.Lng;
                    storeCoordsChanged = true;
                }
            }
            if (storeCoordsChanged) await _dbContext.SaveChangesAsync();

            var locatableStores = stores
                .Where(s => s.Address?.Latitude != null && s.Address?.Longitude != null)
                .ToList();

            if (!locatableStores.Any())
                throw new Exception("Không thể xác định toạ độ cửa hàng.");

            double minDist = double.MaxValue;
            foreach (var s in locatableStores)
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

        // Geocode có dự phòng: địa chỉ số nhà/đường ở VN thường không tra được trên Nominatim
        // (trả mảng rỗng) → thử lùi dần độ chi tiết: đầy đủ → quận+tỉnh → tỉnh, để luôn ra được
        // ít nhất tâm quận/tỉnh, tránh hard-fail làm FE báo "không tính được phí giao hàng".
        private async Task<(double Lat, double Lng)?> GeocodeWithFallbackAsync(string? street, string? district, string? province)
        {
            var attempts = new List<string>();
            void Add(params string?[] ps)
            {
                var parts = new List<string>();
                foreach (var p in ps)
                    if (!string.IsNullOrWhiteSpace(p)) parts.Add(p!.Trim());
                if (parts.Count == 0) return;
                parts.Add("Việt Nam");
                var q = string.Join(", ", parts);
                if (!attempts.Contains(q)) attempts.Add(q);
            }
            Add(street, district, province); // đầy đủ
            Add(district, province);         // bỏ số nhà/đường → tâm quận
            Add(province);                   // cuối cùng → tâm tỉnh/thành

            for (int i = 0; i < attempts.Count; i++)
            {
                if (i > 0) await Task.Delay(1100); // tôn trọng giới hạn ~1 req/s của Nominatim
                var c = await _geocoding.GeocodeAsync(attempts[i]);
                if (c.HasValue) return c;
            }
            return null;
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

