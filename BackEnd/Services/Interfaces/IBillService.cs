using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface IBillService{
        Task <List<Bill>?> GetAllBillIn(DateOnly start, DateOnly end);
        Task <List<BillReponse>?> GetUserBill(Guid userID);
        Task <Bill?> GetBillByID(Guid billID);
        Task CreateDineInBill(DineInBillCreateRequest request);
        Task<DeliveryBillCreateReponse> CreateDeliveryBill(DeliveryBillCreateRequest request);
        Task ChangeBill(BillChangeRequest changeRequest);
        Task<PaymentStatusReponse?> GetPaymentStatus(Guid billID);
        // Task SoftDeleteBill(Guid billID);
    }
}