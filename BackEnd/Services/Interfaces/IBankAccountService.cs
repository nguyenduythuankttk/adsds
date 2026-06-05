using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface
{
    public interface IBankAccountService
    {
        Task<BankAccountResponse?> GetByStore(int storeID);
        Task<List<BankAccountResponse>> GetAll();
        // Tạo mới nếu store chưa có, hoặc cập nhật TK hiện tại (1 store - 1 TK).
        Task<BankAccountResponse> UpsertForStore(int storeID, BankAccountUpsertRequest request);
        Task DeleteForStore(int storeID);
    }
}
