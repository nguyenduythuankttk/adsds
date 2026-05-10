
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

        public async Task DeleteUserAddress(Guid addressID, Guid userID){
            try{
                var address = await _dbContext.Address
                    .FirstOrDefaultAsync(a => a.AddressID == addressID && a.UserID == userID);
                if (address != null){
                    _dbContext.Address.Remove(address);
                    await _dbContext.SaveChangesAsync();
                }
            }catch (Exception ex){
                Console.WriteLine(ex.Message);
            }
        }

        public async Task SetDefault(Guid addressID, Guid userID){
            try{
                var oldDefault = await _dbContext.Address
                    .FirstOrDefaultAsync(a => a.UserID == userID && a.IsDefault);
                if (oldDefault != null){
                    oldDefault.IsDefault = false;
                    _dbContext.Address.Update(oldDefault);
                }
                var newDefault = await _dbContext.Address
                    .FirstOrDefaultAsync(a => a.UserID == userID && a.AddressID == addressID);
                if (newDefault != null){
                    newDefault.IsDefault = true;
                    _dbContext.Address.Update(newDefault);
                }
                await _dbContext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine(ex.Message);
            }
        }
        public async Task<Address?> GetDefaultAddress (Guid user) =>
            await _dbContext.Address.FirstOrDefaultAsync(a => a.UserID == user && a.IsDefault == true);
        
    }
} 


