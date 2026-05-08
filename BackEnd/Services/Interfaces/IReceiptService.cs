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
        Task <List<Receipt>?> GetReceiptByStore(int storeID);
        Task <List<Receipt>?> GetReceiptByEmployee(Guid employeeID);
        Task <List<Receipt>?> GetReceiptBySupplier(int supplierID);
        //Task AddReceipt(Receipt receipt);
        // Task UpdateReceipt(Guid receiptID, Set request); khong the sua receipt
        Task SoftDeleteReceipt(Guid receiptID);
    }
}