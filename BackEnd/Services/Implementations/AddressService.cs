
using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.Implementations{
    public class AddressService : IAddressService{
        private readonly AppDbContext _dbContext;

        public AddressService(AppDbContext dbContext){
            _dbContext = dbContext;
        }
        public async Task<Address?> GetAddressByID (Guid addressID) => 
        await _dbContext.Address
                .AsNoTracking()
                .Where(a => a.AddressID == addressID)
                .FirstOrDefaultAsync();
        public async Task<List<Address>> GetStoreAddress() =>
            await _dbContext.Address
            .AsNoTracking()
            .Where(a => a.Store != null)
            .Include(a => a.Store)
            .ToListAsync();
        public async Task<List<Address>> GetSupplierAddress() => 
            await _dbContext.Address
            .AsNoTracking()
            .Where (a => a.Supplier != null)
            .Include(a => a.Supplier)
            .ToListAsync();
        public async Task<List<Address>> GetUserAddress(User user) =>
            await _dbContext.Address
            .AsNoTracking()
            .Where(a => a.UserID == user.UserID)
            .ToListAsync();

        public async Task AddUserAddress(Address address, Guid userID){
            try{
                bool hadAddress = await _dbContext.Address.AnyAsync(a => a.UserID == userID);
                address.UserID = userID;
                address.IsDefault = !hadAddress;
                _dbContext.Address.Add(address);
                await _dbContext.SaveChangesAsync();
            } catch (Exception ex){
                Console.WriteLine(ex.Message);
            }
        }

        public async Task AddAddress(AddressCreateRequest request){
            try{
                var address = new Address{
                    HouseNumber = request.HouseNumber,
                    Street = request.Street,
                    Ward = request.Ward,
                    Province = request.Province,
                    Country = request.Country,
                    District = request.District
                };
                _dbContext.Address.Add(address);
                await _dbContext.SaveChangesAsync();
            }catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }

        public async Task<bool> DeleteUserAddress(Guid addressID, Guid userID){
            try{
                var addresses = await _dbContext.Address
                    .Where(a => a.UserID == userID)
                    .ToListAsync();
                if (addresses.Count <= 1) return false;
                var address = addresses.FirstOrDefault(a => a.AddressID == addressID);
                if (address == null) return false;
                bool wasDefault = address.IsDefault;
                _dbContext.Address.Remove(address);
                if (wasDefault){
                    var next = addresses.FirstOrDefault(a => a.AddressID != addressID);
                    if (next != null){
                        next.IsDefault = true;
                        _dbContext.Address.Update(next);
                    }
                }
                await _dbContext.SaveChangesAsync();
                return true;
            }catch (Exception ex){
                Console.WriteLine(ex.Message);
                return false;
            }
        }

        public async Task SetDefault(Guid addressID, Guid userID){
            try{
                var oldDefaults = await _dbContext.Address
                    .Where(a => a.UserID == userID && a.IsDefault)
                    .ToListAsync();
                foreach (var old in oldDefaults)
                    old.IsDefault = false;
                var newDefault = await _dbContext.Address
                    .FirstOrDefaultAsync(a => a.UserID == userID && a.AddressID == addressID);
                if (newDefault != null)
                    newDefault.IsDefault = true;
                await _dbContext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine(ex.Message);
            }
        }
        public async Task<Address?> GetDefaultAddress (Guid user) =>
            await _dbContext.Address.FirstOrDefaultAsync(a => a.UserID == user && a.IsDefault == true);
        
    }
} 


