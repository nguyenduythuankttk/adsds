using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface IBillService{
        Task <List<Bill>?> GetAllBillIn(DateOnly start, DateOnly end);
        Task <List<Bill>?> GetUserBill(Guid userID);
        Task <Bill?> GetBillByID(Guid billID);
        Task CreateDineInBill(DineInBillCreateRequest request);
        Task ChangeBill(BillChangeRequest changeRequest);
        Task SoftDeleteBill(Guid billID);
    }
}