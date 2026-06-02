using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface{
    public interface IBillService{
        Task <List<Bill>?> GetAllBillIn(DateOnly start, DateOnly end, int? storeID = null);
        Task <List<BillReponse>?> GetUserBill(Guid userID);
        Task <Bill?> GetBillByID(Guid billID);
        Task<DineInBillCreateReponse> CreateDineInBill(DineInBillCreateRequest request);
        Task<DeliveryBillCreateReponse> CreateDeliveryBill(DeliveryBillCreateRequest request);
        Task ChangeBill(BillChangeRequest changeRequest);
        Task<PaymentStatusReponse?> GetPaymentStatus(Guid billID);
        Task CancelUnpaidBill(Guid billID, Guid callerID, bool isStaff = false);
        // Task SoftDeleteBill(Guid billID);
    }
}