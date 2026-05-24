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

        // ── Trừ nguyên liệu từ kho (dùng khi bếp bắt đầu chuẩn bị đơn giao) ──
        private async Task ConsumeIngredientsForDelivery(Guid billID, Guid? employeeID, int storeID)
        {
            var billDetails = await _dbcontext.BillDetail
                .Where(d => d.BillID == billID)
                .ToListAsync();
            if (billDetails.Count == 0) return;

            var productVarientIDs = billDetails.Select(d => d.ProductVarientID).ToList();
            var recipes = await _dbcontext.Receipe
                .Where(r => productVarientIDs.Contains(r.ProductVarientID) && r.DeletedAt == null)
                .ToListAsync();

            var now   = DateTime.UtcNow.AddHours(7);
            var today = DateOnly.FromDateTime(now);

            foreach (var detail in billDetails)
            {
                var recipeItems = recipes.Where(r => r.ProductVarientID == detail.ProductVarientID).ToList();
                foreach (var recipe in recipeItems)
                {
                    decimal totalToConsume = recipe.QtyAfterProcess * detail.Quantity;
                    if (totalToConsume <= 0) continue;

                    var batches = await _dbcontext.InventoryBatch
                        .Where(b => b.IngredientID == recipe.IngredientID
                                 && b.BatchType == BatchType.Processed
                                 && b.Status == BatchStatus.Available
                                 && b.QuantityOnHand > 0
                                 && b.Exp >= today
                                 && b.Warehouse.StoreID == storeID)
                        .OrderBy(b => b.ImportDate)
                        .ToListAsync();

                    decimal remaining = totalToConsume;
                    foreach (var batch in batches)
                    {
                        if (remaining <= 0) break;
                        var deduct = Math.Min(remaining, batch.QuantityOnHand);
                        batch.QuantityOnHand -= deduct;
                        if (batch.QuantityOnHand == 0)
                            batch.Status = BatchStatus.Depleted;
                        batch.UpdatedAt = now;

                        _dbcontext.StockMovement.Add(new StockMovement
                        {
                            StockMovementID = Guid.NewGuid(),
                            BatchID         = batch.BatchID,
                            EmployeeID      = employeeID,
                            QtyChange       = -deduct,
                            MovementType    = StockMovementType.Consumption,
                            ReferenceType   = StockReferenceType.Bill,
                            ReferenceID     = billID,
                            TimeStamp       = now,
                        });
                        remaining -= deduct;
                    }

                    if (remaining > 0)
                        throw new Exception($"Không đủ nguyên liệu – IngredientID {recipe.IngredientID}: còn thiếu {remaining}.");
                }
            }

            await _dbcontext.SaveChangesAsync();
        }
        public async Task<List<DeliveryInfo>?> GetAllDeliveryIn(DateTime start, DateTime end) =>
            await _dbcontext.DeliveryInfo
                .AsNoTracking()
                .Include(di => di.User)
                .Include(di => di.Address)
                .Include(di => di.Bill)
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
                    .Include(d => d.Bill)
                    .FirstOrDefaultAsync(d => d.DeliveryID == deliveryID);
                if (delivery == null) throw new Exception("Không tìm thấy đơn giao hàng.");

                var bill = delivery.Bill
                    ?? await _dbcontext.Bill.FirstOrDefaultAsync(b => b.BillID == delivery.BillID)
                    ?? throw new Exception("Không tìm thấy hóa đơn liên kết.");

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

                // Bếp bắt đầu chuẩn bị → trừ nguyên liệu khỏi kho
                if (updateRequest.Status == DeliveryStatus.Preparing)
                {
                    await ConsumeIngredientsForDelivery(bill.BillID, updateRequest.EmployeeID, bill.StoreID);
                }

                // Giao hàng thành công → bắt buộc cập nhật MoneyReceived & MoneyGiveBack
                if (updateRequest.Status == DeliveryStatus.Delivered)
                {
                    if (updateRequest.MoneyReceived == null)
                        throw new Exception("MoneyReceived là bắt buộc khi xác nhận giao hàng thành công.");

                    var totalWithShipping = bill.Total + delivery.ShippingFee;
                    if (updateRequest.MoneyReceived < totalWithShipping)
                        throw new Exception($"MoneyReceived ({updateRequest.MoneyReceived}) không đủ so với tổng đơn hàng ({totalWithShipping}).");

                    bill.MoneyReceived = updateRequest.MoneyReceived;
                    bill.MoneyGiveBack = updateRequest.MoneyReceived - totalWithShipping;
                    _dbcontext.Bill.Update(bill);
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