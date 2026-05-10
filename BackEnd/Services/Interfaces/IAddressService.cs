using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface IAddressService{
        Task<Address?> GetAddressByID (Guid addressID);
        Task<List<Address>?> GetStoreAddress();
        Task<List<Address>?> GetSupplierAddress();
        Task<List<Address>> GetUserAddress(User user);
        Task AddAddress(AddressCreateRequest request);
        Task AddUserAddress(Address address, Guid userID);
        Task DeleteUserAddress(Guid address,Guid user);
        Task SetDefault(Guid address, Guid user);
        Task<Address?> GetDefaultAddress (Guid user);
    }
}