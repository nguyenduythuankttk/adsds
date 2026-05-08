using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
namespace Backend.Services.Interface{
    public interface IPurchaseOrderService {
        Task <List<PurchaseOrder>?> GetAllPOIn (DateOnly start, DateOnly end);
        Task<PurchaseOrder?> GetPOByID (Guid id);
        Task<List<PurchaseOrder>?> GetAllPOByStore(int storeID);
        Task<List<PurchaseOrder>?> GetAllPOBySupplier(int supplierID);
        Task<List<PurchaseOrder>?> GetPOByStatus(PO_Status status);
        Task CreatePO(POCreateRequest createRequest);
        Task UpdatePO(Guid id, POUpdateRequest updateRequest);
        Task SoftDeletePO(Guid id);
    }
}