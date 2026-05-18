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
        Task<POCreateResponse> CreatePO(POCreateRequest createRequest);
        Task UpdatePO(Guid id, POUpdateRequest updateRequest);
        // TODO – SoftDeletePO
        // Soft delete chỉ hợp lệ khi PO còn ở trạng thái Submitted (chưa được Manager duyệt).
        // Trước khi xoá cần kiểm tra:
        //   (1) Status hiện tại phải là Submitted — nếu đã Ordered/Received thì bắt dùng UpdatePO(Cancelled).
        //   (2) Không có Receipt nào liên kết với PO này.
        Task SoftDeletePO(Guid id);
    }
}