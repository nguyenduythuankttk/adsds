using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface
{
    public interface IReceiptService
    {
        Task<List<Receipt>?> GetAllReceiptIn(DateOnly start, DateOnly end);
        Task<Receipt?> GetReceiptByID(Guid receiptID);
        Task<List<Receipt>?> GetReceiptByPO(Guid pOID);
        Task<List<Receipt>?> GetReceiptByStore(int storeID);
        Task<List<Receipt>?> GetReceiptByEmployee(Guid employeeID);
        Task<List<Receipt>?> GetReceiptBySupplier(int supplierID);
        Task<ReceiptPrefillResponse> GetPrefilledFromPO(Guid poId);
        Task<ReceiptCreateResponse> CreateReceipt(ReceiptCreateRequest request);
        Task<ConfirmReceiptResponse> ConfirmReceipt(ConfirmReceiptRequest request);
        // TODO – SoftDeleteReceipt
        // Trước khi xoá cần kiểm tra: receipt này đã tạo InventoryBatch chưa?
        //   - Nếu đã có InventoryBatch → từ chối xoá (tồn kho đã ghi nhận, xoá sẽ mất trace nguồn gốc lô hàng).
        //   - Nếu chưa có InventoryBatch → cho phép set DeletedAt = UtcNow.
        Task SoftDeleteReceipt(Guid receiptID);
    }
}