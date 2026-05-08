using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
namespace Backend.Services.Interface{
    public interface IDeliveryInfoService{
        Task <List<DeliveryInfo>?> GetAllDeliveryIn (DateTime start, DateTime end);
        Task <List<DeliveryInfo>?> GetAllDeliveryByUser(Guid userID);
        Task AddDeliveryInfo(DeliveryInfoCreateRequest request);
        Task UpdateDelivery(Guid deliveryID, DeliveryUpdateRequest updateRequest);
        Task SoftDeleteDeliveryInfo(Guid deliveryID);
    }
}