using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface
{
    public interface ISupplierService
    {
        Task<List<SupplierResponse>?> GetAllSuppliers();
        Task<SupplierResponse?> GetSupplierByID(int supllierID);
        Task AddSupplier(SupplierCreateRequest createRequest);
        Task UpdateSupplier(int supplierID, SupplierUpdateRequest updateRequest);
        Task SoftDeleteSupplier(int supplierID);
    }
}
