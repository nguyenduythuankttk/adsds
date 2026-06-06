using Backend.Data;
using Backend.Helpers;
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

            var now   = VnTime.Now;
            var today = DateOnly.FromDateTime(now);

            var demand = new Dictionary<int, decimal>();
            foreach (var detail in billDetails)
            {
                foreach (var recipe in recipes.Where(r => r.ProductVarientID == detail.ProductVarientID))
                {
                    var need = recipe.QtyAfterProcess * detail.Quantity;
                    if (need <= 0) continue;
                    demand[recipe.IngredientID] = demand.GetValueOrDefault(recipe.IngredientID) + need;
                }
            }
            if (demand.Count == 0) return;

            var ingredientIDs = demand.Keys.ToList();
            var availableBatches = await _dbcontext.InventoryBatch
                .Where(b => ingredientIDs.Contains(b.IngredientID)
                         && b.BatchType == BatchType.Processed
                         && b.Status == BatchStatus.Available
                         && b.QuantityOnHand > 0
                         && b.Exp >= today
                         && b.Warehouse.StoreID == storeID)
                .ToListAsync();

            var batchesByIngredient = availableBatches
                .GroupBy(b => b.IngredientID)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var (ingredientID, totalToConsume) in demand)
            {
                if (!batchesByIngredient.TryGetValue(ingredientID, out var batches) || batches.Count == 0)
                    throw new InvalidOperationException($"Không đủ nguyên liệu – IngredientID {ingredientID}: còn thiếu {totalToConsume}.");

                // FEFO + dùng hết lô dở: cận hạn trước → lô còn ít nhất → nhập sớm nhất.
                var sortedBatches = batches
                    .OrderBy(b => b.Exp)
                    .ThenBy(b => b.QuantityOnHand)
                    .ThenBy(b => b.ImportDate)
                    .ToList();

                decimal remaining = totalToConsume;
                foreach (var batch in sortedBatches)
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
                    throw new InvalidOperationException($"Không đủ nguyên liệu – IngredientID {ingredientID}: còn thiếu {remaining}.");
            }

            await _dbcontext.SaveChangesAsync();
        }
        public async Task<List<DeliveryInfo>?> GetAllDeliveryIn(DateTime start, DateTime end)
        {
            // end là mốc 00:00 của ngày → dùng mốc loại trừ (end + 1 ngày) để lấy trọn cả
            // ngày end, tránh bỏ sót đơn vừa tạo/thanh toán trong hôm nay (ChangeAt lưu UTC).
            var endExclusive = end.Date.AddDays(1);
            return await _dbcontext.DeliveryInfo
                .AsNoTracking()
                .Include(di => di.User)
                .Include(di => di.Address)
                .Include(di => di.Bill)
                .Include(di => di.DeliveryLog)
                    .ThenInclude(l => l.Employee)
                .Where(di => di.DeliveryLog.Any() &&
                             di.DeliveryLog.Min(l => l.ChangeAt) >= start &&
                             di.DeliveryLog.Min(l => l.ChangeAt) < endExclusive)
                .ToListAsync();
        }

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
                    Note = request.Note,
                    ScheduledAt = request.ScheduledAt
                };
                _dbcontext.DeliveryInfo.Add(delivery);
                await _dbcontext.SaveChangesAsync();

                var deliveryLog = new DeliveryLog{
                    DeliveryID = delivery.DeliveryID,
                    EmployeeID = request.EmployeeID,
                    ChangeAt = VnTime.Now,
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
                        throw new InvalidOperationException($"Không thể cập nhật đơn hàng đã ở trạng thái {latestLog.Status}");
                    if ((int)updateRequest.Status <= (int)latestLog.Status)
                        throw new InvalidOperationException($"Không thể chuyển trạng thái từ {latestLog.Status} sang {updateRequest.Status}");
                }

                // Đơn có hẹn giờ: chỉ được bắt đầu giao (OnTheWay) từ 15 phút trước giờ hẹn.
                if (updateRequest.Status == DeliveryStatus.OnTheWay && delivery.ScheduledAt.HasValue)
                {
                    var earliest = delivery.ScheduledAt.Value.AddMinutes(-15);
                    if (VnTime.Now < earliest)
                        throw new InvalidOperationException(
                            $"Đơn hẹn giao lúc {delivery.ScheduledAt.Value:HH:mm dd/MM/yyyy}. " +
                            $"Chỉ được bắt đầu giao từ {earliest:HH:mm dd/MM/yyyy} (15 phút trước giờ hẹn).");
                }

                // Trừ kho + cập nhật thanh toán + ghi log trạng thái phải nguyên tử.
                // using var: nếu bất kỳ bước nào throw (vd hết nguyên liệu) thì transaction
                // chưa commit sẽ tự rollback khi dispose → không bị trừ kho mà thiếu log.
                using var tx = await _dbcontext.Database.BeginTransactionAsync();

                // Bếp bắt đầu chuẩn bị → trừ nguyên liệu khỏi kho
                if (updateRequest.Status == DeliveryStatus.Preparing)
                {
                    await ConsumeIngredientsForDelivery(bill.BillID, updateRequest.EmployeeID, bill.StoreID);
                }

                // Luật xác nhận "Đã giao":
                //  - Tiền mặt: bắt buộc nhập số tiền khách đưa và phải >= tổng tiền hàng (gồm phí ship).
                //  - Thẻ / chuyển khoản: chỉ cho giao khi ĐÃ thanh toán (PaymentStatus = Paid).
                if (updateRequest.Status == DeliveryStatus.Delivered)
                {
                    var totalWithShipping = bill.Total + delivery.ShippingFee;

                    if (bill.PaymentMethods == PaymentMethods.Cash)
                    {
                        if (updateRequest.MoneyReceived == null)
                            throw new InvalidOperationException("Cần nhập số tiền khách đưa khi thanh toán tiền mặt.");
                        if (updateRequest.MoneyReceived < totalWithShipping)
                            throw new InvalidOperationException($"Số tiền khách đưa ({updateRequest.MoneyReceived:N0}đ) phải lớn hơn hoặc bằng tổng tiền hàng ({totalWithShipping:N0}đ).");

                        bill.MoneyReceived = updateRequest.MoneyReceived;
                        bill.MoneyGiveBack = updateRequest.MoneyReceived - totalWithShipping;
                        bill.PaymentStatus = PaymentStatus.Paid;
                        bill.PaidAt = VnTime.Now;
                        _dbcontext.Bill.Update(bill);
                    }
                    else
                    {
                        // Thẻ / chuyển khoản: phải đã thanh toán trước mới được giao.
                        if (bill.PaymentStatus != PaymentStatus.Paid)
                            throw new InvalidOperationException("Đơn thanh toán thẻ/chuyển khoản chưa thanh toán — không thể xác nhận đã giao.");
                        // Đã thanh toán online → xác nhận giao, không cần thao tác tiền mặt.
                    }
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
                await tx.CommitAsync();
            } catch (InvalidOperationException) {
                throw;   // vi phạm nghiệp vụ → middleware trả 400 kèm thông điệp rõ ràng
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
                delivery.DeletedAt = VnTime.Now;
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine($"Soft delete delivery error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting delivery: {ex.Message}");
            }
        }
    }
}