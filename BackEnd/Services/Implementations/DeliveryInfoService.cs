using Backend.Data;
using Backend.Models;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Implementations{
    public class DeliveryService : IDeliveryInfoService{
        private readonly AppDbContext _dbcontext;
        public DeliveryService (AppDbContext dbContext){
            _dbcontext = dbContext;
        }
        public async Task<List<DeliveryInfo>?> GetAllDeliveryIn(DateTime start, DateTime end) =>
            await _dbcontext.DeliveryInfo
                .AsNoTracking()
                .Include(di => di.DeliveryLog.OrderByDescending(l => l.ChangeAt).Take(1))
                .Where(di => di.DeliveryLog.Any() &&
                             di.DeliveryLog.Min(l => l.ChangeAt) >= start &&
                             di.DeliveryLog.Min(l => l.ChangeAt) <= end)
                .ToListAsync();

        public async Task<List<DeliveryInfo>?> GetAllDeliveryByUser(Guid userID) =>
            await _dbcontext.DeliveryInfo
                .AsNoTracking()
                .Where(d => d.UserID == userID)
                .Include(d => d.User)
                .Include(d => d.DeliveryLog.OrderByDescending(l => l.ChangeAt).Take(1))
                .Include(d => d.Bill)
                .Include(d => d.Address)
                .ToListAsync();

        public async Task AddDeliveryInfo(DeliveryInfoCreateRequest request){
            try {
                var delivery = new DeliveryInfo{
                    BillID = request.BillID,
                    UserID = request.UserID,
                    AddressID = request.AddressID,
                    ShippingFee = request.ShippingFee,
                    Note = request.Note
                };
                _dbcontext.DeliveryInfo.Add(delivery);
                await _dbcontext.SaveChangesAsync();

                var deliveryLog = new DeliveryLog{
                    DeliveryID = delivery.DeliveryID,
                    EmployeeID = request.EmployeeID,
                    ChangeAt = DateTime.UtcNow.AddHours(7),
                    Status = DeliveryStatus.Pending,
                    Note = request.Note
                };
                _dbcontext.DeliveryLog.Add(deliveryLog);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }

        public async Task UpdateDelivery(Guid deliveryID, DeliveryUpdateRequest updateRequest){
            try{
                var delivery = await _dbcontext.DeliveryInfo
                    .FirstOrDefaultAsync(d => d.DeliveryID == deliveryID);
                if (delivery == null) return;

                var latestLog = await _dbcontext.DeliveryLog
                    .Where(l => l.DeliveryID == deliveryID)
                    .OrderByDescending(l => l.ChangeAt)
                    .FirstOrDefaultAsync();

                if (latestLog != null) {
                    var terminalStates = new[] { DeliveryStatus.Delivered, DeliveryStatus.Cancelled, DeliveryStatus.Failed };
                    if (terminalStates.Contains(latestLog.Status))
                        throw new Exception($"Không thể cập nhật đơn hàng đã ở trạng thái {latestLog.Status}");
                    if ((int)updateRequest.Status <= (int)latestLog.Status)
                        throw new Exception($"Không thể chuyển trạng thái từ {latestLog.Status} sang {updateRequest.Status}");
                }

                var newLog = new DeliveryLog {
                    DeliveryID = deliveryID,
                    EmployeeID = updateRequest.EmployeeID,
                    Status = updateRequest.Status,
                    ChangeAt = updateRequest.ChangeAt,
                    Note = updateRequest.Note
                };
                _dbcontext.DeliveryLog.Add(newLog);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e) {
                Console.WriteLine(e.Message);
                throw new Exception("Lỗi khi cập nhật trạng thái giao hàng: " + e.Message);
            }
        }
        public async Task SoftDeleteDeliveryInfo(Guid deliveryID){
            var delivery = await _dbcontext.DeliveryInfo
                .FirstOrDefaultAsync(d => d.DeliveryID == deliveryID &&
                                    d.DeletedAt == null);
            
            if(delivery == null){
                throw new Exception("Delivery not found");
            }

            try{
                delivery.DeletedAt = DateTime.Now;
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine($"Soft delete delivery error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting delivery: {ex.Message}");
            }
        }
    }
}