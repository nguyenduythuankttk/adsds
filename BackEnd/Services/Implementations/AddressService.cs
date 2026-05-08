
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
        public async Task<List<Address>> GetUserAddress(User user)=>
            await _dbContext.UserAddress
            .AsNoTracking()
            .Where (ua => ua.UserID == user.UserID)
            .Select (ua => ua.Address)
            .ToListAsync();
        public async Task AddUserAddress(Address address, Guid userID){
            try{
                _dbContext.Address.Add(address); 
                await _dbContext.SaveChangesAsync();
                bool hadAddress = await _dbContext.UserAddress
                                    .AnyAsync(ua => ua.UserID == userID);
                var newUA = new UserAddress{
                    UserID = userID,
                    AddressID = address.AddressID,
                    IsDefault = !hadAddress
                };
                _dbContext.UserAddress.Add(newUA);
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
        public async Task DeleteUserAddress(Guid address,Guid user){
            try{
                var userAddress = await _dbContext.UserAddress
                        .FirstOrDefaultAsync(ua => ua.UserID ==user &&  ua.AddressID == address);
                if (userAddress != null){
                    _dbContext.UserAddress.Remove(userAddress);
                    await _dbContext.SaveChangesAsync();
                }
            }catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
        public async Task SetDefault(Guid address, Guid user){
            try{
                var newDefault = await _dbContext.UserAddress
                                    .FirstOrDefaultAsync(ua => ua.UserID == user && ua.AddressID == address);
                var oldDefault = await _dbContext.UserAddress
                                    .FirstOrDefaultAsync(ua => ua.UserID == user && ua.IsDefault == true);
                if (oldDefault != null){
                    oldDefault.IsDefault = false;
                    _dbContext.UserAddress.Update(oldDefault);
                }
                if (newDefault != null){
                    newDefault.IsDefault = true;
                    _dbContext.UserAddress.Update(newDefault);
                }
                await _dbContext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine(ex.Message);
            }
        }
        
    }
} 


