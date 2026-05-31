using System.Security.Cryptography.X509Certificates;
using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services;
using Backend.Services.Interface;
using BackEnd.Migrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
namespace Backend.Services.Implementations{
    public class BillService : IBillService{
        private readonly AppDbContext _dbcontext;
        private readonly IAddressService _addressService;
        private readonly IUserService _userService;
        private readonly IProductService _productService;
        private readonly ITicketService _ticketService;
        private readonly SePayOptions _sepay;
        public BillService (AppDbContext dbcontext,
                            IAddressService addressService,
                            IUserService userService,
                            IProductService productService,
                            ITicketService ticketService,
                            IOptions<SePayOptions> sepayOptions){
            _dbcontext = dbcontext;
            _addressService = addressService;
            _userService = userService;
            _productService = productService;
            _ticketService = ticketService;
            _sepay = sepayOptions.Value;
        }

        public async Task<List<Bill>?> GetAllBillIn(DateOnly start, DateOnly end){
            try {
                return await _dbcontext.Bill
                    .AsNoTracking()
                    .Include(b => b.BillChange
                        .Where(bc => bc.Status == BillStatus.Create)
                        .OrderBy(bc => bc.ChangeAt)
                        .Take(1))
                        .ThenInclude(bc => bc.Employee)
                    .Where(b => b.BillChange.Any(bc =>
                            bc.Status == BillStatus.Create &&
                            bc.ChangeAt >= start.ToDateTime(TimeOnly.MinValue) &&
                            bc.ChangeAt <= end.ToDateTime(TimeOnly.MaxValue)))
                    .Include(b => b.BillDetail)
                        .ThenInclude(bd => bd.ProductVarient)
                            .ThenInclude(pr => pr.Product)
                    .Include(b => b.Store)
                    .ToListAsync();
            } catch (Exception e) {
                throw new Exception("Lỗi khi lấy danh sách hóa đơn: " + e.Message);
            }
        }

        public async Task<List<BillReponse>?> GetUserBill(Guid userID){
            try {
                var bills = await _dbcontext.Bill
                    .AsNoTracking()
                    .Where(b => b.UserID == userID)
                    .Include(b => b.BillDetail)
                        .ThenInclude(bd => bd.ProductVarient)
                            .ThenInclude(pr => pr.Product)
                    .Include(b => b.BillChange.OrderByDescending(bc => bc.ChangeAt))
                    .Include(b => b.Store)
                        .ThenInclude(s => s.Address)
                    .Include(b => b.Address)
                    .ToListAsync();

                return bills.Select(b => new BillReponse
                {
                    BillID = b.BillID,
                    VAT = b.VAT,
                    Total = b.Total,
                    MoneyReceived = b.MoneyReceived,
                    MoneyGiveBack = b.MoneyGiveBack,
                    Note = b.Note,
                    PaymentMethods = b.PaymentMethods,
                    TableID = b.TableID,
                    Store = new StoreResponse
                    {
                        StoreID = b.Store.StoreID,
                        StoreName = b.Store.StoreName,
                        Phone = b.Store.Phone,
                        Email = b.Store.Email,
                        TotalReviews = b.Store.TotalReviews,
                        TotalPoints = b.Store.TotalPoints,
                        SeatingCapacity = b.Store.SeatingCapacity,
                        Address = b.Store.Address == null ? null! : new AddressResponse
                        {
                            AddressID = b.Store.Address.AddressID,
                            StreetAddress = b.Store.Address.StreetAddress,
                            District = b.Store.Address.District,
                            Province = b.Store.Address.Province,
                            Latitude = b.Store.Address.Latitude,
                            Longitude = b.Store.Address.Longitude
                        }
                    },
                    Address = b.Address == null ? null : new AddressResponse
                    {
                        AddressID = b.Address.AddressID,
                        StreetAddress = b.Address.StreetAddress,
                        District = b.Address.District,
                        Province = b.Address.Province,
                        Latitude = b.Address.Latitude,
                        Longitude = b.Address.Longitude
                    },
                    Detail = b.BillDetail.Select(bd => new BillDetailReponse
                    {
                        ProductVarientID = bd.ProductVarientID,
                        ProductVarient = bd.ProductVarient,
                        Quantity = bd.Quantity,
                        Price = bd.Price,
                        InlineTotal = bd.InlineTotal
                    }).ToList(),
                    BillChange = b.BillChange.Select(bc => new BillChangeReponse
                    {
                        Status = bc.Status,
                        ChangeAt = bc.ChangeAt
                    }).ToList()
                }).ToList();
            } catch (Exception e) {
                throw new Exception("Lỗi khi lấy hóa đơn của người dùng: " + e.Message);
            }
        }

        public async Task<Bill?> GetBillByID(Guid billID){
            try {
                return await _dbcontext.Bill
                    .AsNoTracking()
                    .Where(b => b.BillID == billID)
                    .Include(b => b.BillDetail)
                        .ThenInclude(bd => bd.ProductVarient)
                            .ThenInclude(pr => pr.Product)
                    .Include(b => b.BillChange.OrderByDescending(bc => bc.ChangeAt))
                        .ThenInclude(b => b.Employee)
                    .Include(b => b.Store)
                    .FirstOrDefaultAsync();
            } catch (Exception e) {
                throw new Exception("Lỗi khi lấy hóa đơn: " + e.Message);
            }
        }
        public async Task CreateDineInBill(DineInBillCreateRequest request){
            if (request.products == null || request.products.Count == 0)
                throw new Exception("Bill must have at least one product.");
            if (request.EmployeID == null)
                throw new Exception("EmployeeID is required.");

            var storeExists = await _dbcontext.Store
                .AnyAsync(s => s.StoreID == request.StoreID && s.DeletedAt == null);
            if (!storeExists)
                throw new Exception($"Store {request.StoreID} not found.");

            if (request.TableID.HasValue)
            {
                var table = await _dbcontext.DiningTable
                    .FirstOrDefaultAsync(t => t.TableID == request.TableID && t.DeletedAt == null);
                if (table == null)
                    throw new Exception($"Table {request.TableID} not found.");
                if (table.Status == TableStatus.Occupied)
                    throw new Exception($"Table {request.TableID} is currently occupied.");
            }

            using var tx = await _dbcontext.Database.BeginTransactionAsync();
            try{
                Guid userID;
                if (string.IsNullOrEmpty(request.contact))
                    userID = Guid.Empty;
                else{
                    var user = await _userService.GetUserByContact(request.contact);
                    if (user == null) throw new Exception("User not found.");
                    userID = user.UserID;
                }
                var bill = new Bill{
                        BillID = Guid.NewGuid(),
                        UserID = userID,
                        StoreID = request.StoreID,
                        TableID = request.TableID,
                        PaymentMethods = request.PaymentMethods,
                        Note = request.Note,
                        MoneyReceived = request.MoneyReceived,
                        PaymentStatus = PaymentStatus.Paid,
                        PaidAt = DateTime.UtcNow.AddHours(7)
                        };
                decimal total = 0.0m;
                foreach (var i in request.products)
                {
                    var price = await _productService.GetPriceByID(i.ProductVarientID);
                    bill.BillDetail.Add(new BillDetail
                    {
                        BillID = bill.BillID,
                        ProductVarientID = i.ProductVarientID,
                        Quantity = i.qty,
                        Price = price,
                        InlineTotal = price * i.qty
                    });
                    total += price * i.qty;
                }
                bill.Total = total * (1 + bill.VAT);

                if (request.TicketID.HasValue && request.TicketID.Value != Guid.Empty)
                {
                    var ticket = await _ticketService.GetTicketByID(request.TicketID.Value);
                    if (ticket != null && ticket.UsedAt == null && ticket.EndDate >= DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)))
                    {
                        bill.TicketID = ticket.TicketID;
                        bill.Total = Math.Round(bill.Total * (1 - ticket.Discount), 0);
                    }
                }

                if (request.MoneyReceived < bill.Total)
                    throw new Exception($"MoneyReceived ({request.MoneyReceived}) is less than Total ({bill.Total}).");
                bill.MoneyGiveBack = bill.MoneyReceived - bill.Total;

                var billChange = new BillChange
                {
                    BillID = bill.BillID,
                    Status = BillStatus.Create,
                    EmployeeID = request.EmployeID,
                    ChangeAt = DateTime.UtcNow.AddHours(7)
                };
                bill.BillChange.Add(billChange);
                _dbcontext.Bill.Add(bill);
                await _dbcontext.SaveChangesAsync();

                if (bill.TicketID.HasValue)
                    await _ticketService.SetUsedAt(bill.TicketID.Value, userID);

                await IncreaseSoldCount(bill.BillDetail.ToList());
                await ConsumeIngredients(bill.BillID, bill.BillDetail.ToList(), request.EmployeID.Value, request.StoreID);
                await tx.CommitAsync();
            } catch (Exception e)
            {
                await tx.RollbackAsync();
                throw new Exception("Error in BillService.CreateDineinBill: " + e.Message);
            }
        }
        private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0;
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                  + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                  * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }

        private async Task<int> ResolveNearestStoreAsync(Guid addressID, int? fallbackStoreID)
        {
            var address = await _dbcontext.Address
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AddressID == addressID);

            if (address?.Latitude != null && address.Longitude != null)
            {
                var stores = await _dbcontext.Store
                    .Where(s => s.DeletedAt == null)
                    .Include(s => s.Address)
                    .Where(s => s.Address != null && s.Address.Latitude != null && s.Address.Longitude != null)
                    .AsNoTracking()
                    .ToListAsync();

                if (stores.Count > 0)
                {
                    var nearest = stores
                        .OrderBy(s => HaversineKm(
                            address.Latitude!.Value, address.Longitude!.Value,
                            s.Address!.Latitude!.Value, s.Address.Longitude!.Value))
                        .First();
                    return nearest.StoreID;
                }
            }

            if (fallbackStoreID.HasValue)
            {
                var exists = await _dbcontext.Store
                    .AnyAsync(s => s.StoreID == fallbackStoreID.Value && s.DeletedAt == null);
                if (exists) return fallbackStoreID.Value;
            }

            throw new Exception("Không thể xác định cửa hàng xử lý đơn giao hàng: địa chỉ thiếu tọa độ và không có StoreID dự phòng.");
        }

        public async Task<DeliveryBillCreateReponse> CreateDeliveryBill(DeliveryBillCreateRequest request)
        {
            if (request.products == null || request.products.Count == 0)
                throw new Exception("Bill must have at least one product.");

            var userExists = await _dbcontext.User
                .AnyAsync(u => u.UserID == request.UserID);
            if (!userExists)
                throw new Exception($"User {request.UserID} not found.");

            using var tx = await _dbcontext.Database.BeginTransactionAsync();
            try {
                Guid addressID;
                if (request.AddressID != Guid.Empty) {
                    addressID = request.AddressID;
                } else {
                    var defaultAddress = await _addressService.GetDefaultAddress(request.UserID);
                    if (defaultAddress == null)
                        throw new Exception("Không tìm thấy địa chỉ giao hàng.");
                    addressID = defaultAddress.AddressID;
                }

                var resolvedStoreID = await ResolveNearestStoreAsync(addressID, request.StoreID);

                var bill = new Bill{
                    BillID = Guid.NewGuid(),
                    UserID = request.UserID,
                    StoreID = resolvedStoreID,
                    PaymentMethods = request.PaymentMethods,
                    AddressID = addressID,
                    Note = request.Note,
                    MoneyReceived = null,
                    MoneyGiveBack = null,
                    // Cash/Card mặc định Paid (xử lý ngoài app); BankTransfer chờ webhook SePay
                    PaymentStatus = request.PaymentMethods == PaymentMethods.BankTransfer
                        ? PaymentStatus.Pending
                        : PaymentStatus.Paid
                };
                decimal total = 0.0m;
                foreach (var i in request.products)
                {
                    var price = await _productService.GetPriceByID(i.ProductVarientID);
                    bill.BillDetail.Add(new BillDetail
                    {
                        BillID = bill.BillID,
                        ProductVarientID = i.ProductVarientID,
                        Quantity = i.qty,
                        Price = price,
                        InlineTotal = price * i.qty
                    });
                    total += price * i.qty;
                }
                decimal shippingFee = 0.0m;
                var deliveryAddress = await _dbcontext.Address.AsNoTracking().FirstOrDefaultAsync(a => a.AddressID == addressID);
                var resolvedStore   = await _dbcontext.Store.Include(s => s.Address).AsNoTracking().FirstOrDefaultAsync(s => s.StoreID == resolvedStoreID);
                if (deliveryAddress?.Latitude != null && deliveryAddress.Longitude != null &&
                    resolvedStore?.Address?.Latitude != null && resolvedStore.Address.Longitude != null)
                {
                    const double MaxDeliveryKm = 50.0;
                    double distKm = HaversineKm(
                        deliveryAddress.Latitude!.Value, deliveryAddress.Longitude!.Value,
                        resolvedStore.Address.Latitude!.Value, resolvedStore.Address.Longitude!.Value);
                    if (distKm > MaxDeliveryKm)
                        throw new Exception($"Địa chỉ giao hàng cách cửa hàng {distKm:F1} km, vượt quá khoảng cách tối đa {MaxDeliveryKm} km.");
                    decimal rate = distKm < 4 ? 15000m : distKm <= 10 ? 17000m : 21000m;
                    shippingFee = (decimal)distKm * rate;
                }
                bill.Total = total * (1 + bill.VAT);

                if (request.TicketID.HasValue && request.TicketID.Value != Guid.Empty)
                {
                    var ticket = await _ticketService.GetTicketByID(request.TicketID.Value);
                    if (ticket != null && ticket.UsedAt == null && ticket.EndDate >= DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)))
                    {
                        bill.TicketID = ticket.TicketID;
                        bill.Total = Math.Round(bill.Total * (1 - ticket.Discount), 0);
                    }
                }

                var billChange = new BillChange
                {
                    BillID = bill.BillID,
                    Status = BillStatus.Create,
                    EmployeeID = request.EmployeID,
                    ChangeAt = DateTime.UtcNow.AddHours(7)
                };
                bill.BillChange.Add(billChange);

                // Sinh mã nội dung CK cho chuyển khoản SePay (rút gọn BillID 8 ký tự đầu)
                if (request.PaymentMethods == PaymentMethods.BankTransfer)
                {
                    var prefix = string.IsNullOrWhiteSpace(_sepay.ReferencePrefix) ? "JLB" : _sepay.ReferencePrefix;
                    bill.PaymentReference = prefix + bill.BillID.ToString("N").Substring(0, 8).ToUpper();
                }

                _dbcontext.Bill.Add(bill);

                var delivery = new DeliveryInfo{
                    DeliveryID = Guid.NewGuid(),
                    BillID = bill.BillID,
                    UserID = bill.UserID,
                    AddressID = addressID,
                    Note = request.NoteForDelivery,
                    ShippingFee = shippingFee
                };
                var deliveryLog = new DeliveryLog{
                    DeliveryID = delivery.DeliveryID,
                    Status = DeliveryStatus.Pending,
                    ChangeAt = DateTime.UtcNow.AddHours(7),
                    Note = request.NoteForDelivery
                };
                delivery.DeliveryLog.Add(deliveryLog);
                _dbcontext.DeliveryInfo.Add(delivery);

                await _dbcontext.SaveChangesAsync();

                if (bill.TicketID.HasValue)
                    await _ticketService.SetUsedAt(bill.TicketID.Value, bill.UserID);

                await IncreaseSoldCount(bill.BillDetail.ToList());
                // Không trừ nguyên liệu ở đây – sẽ trừ khi bếp bắt đầu chuẩn bị (Preparing)
                await tx.CommitAsync();

                var response = new DeliveryBillCreateReponse
                {
                    BillID           = bill.BillID,
                    Total            = bill.Total,
                    PaymentMethods   = bill.PaymentMethods,
                    PaymentStatus    = bill.PaymentStatus,
                    PaymentReference = bill.PaymentReference,
                    BankAccount      = _sepay.Account,
                    BankCode         = _sepay.Bank,
                    TestMode         = _sepay.TestMode
                };

                if (bill.PaymentMethods == PaymentMethods.BankTransfer
                    && !string.IsNullOrEmpty(_sepay.Account)
                    && !string.IsNullOrEmpty(_sepay.Bank))
                {
                    // VietQR ảnh động của SePay: https://qr.sepay.vn/img?acc=...&bank=...&amount=...&des=...
                    var amount = ((long)bill.Total).ToString();
                    var des    = Uri.EscapeDataString(bill.PaymentReference ?? "");
                    response.QrUrl = $"https://qr.sepay.vn/img?acc={_sepay.Account}&bank={_sepay.Bank}&amount={amount}&des={des}";
                }
                return response;
            } catch (Exception e) {
                await tx.RollbackAsync();
                throw new Exception("Error in BillService.CreateDeliveryBill: " + e.Message);
            }
        }

        public async Task<PaymentStatusReponse?> GetPaymentStatus(Guid billID)
        {
            var bill = await _dbcontext.Bill
                .AsNoTracking()
                .Where(b => b.BillID == billID)
                .Select(b => new PaymentStatusReponse
                {
                    BillID = b.BillID,
                    PaymentStatus = b.PaymentStatus,
                    PaidAt = b.PaidAt
                })
                .FirstOrDefaultAsync();
            return bill;
        }

        private async Task IncreaseSoldCount(List<BillDetail> billDetails)
        {
            var pvIds = billDetails.Select(d => d.ProductVarientID).Distinct().ToList();
            var productIDs = await _dbcontext.ProductVarient
                .Where(pv => pvIds.Contains(pv.ProductVarientID))
                .Select(pv => new { pv.ProductVarientID, pv.ProductID })
                .ToListAsync();

            var pvToProduct = productIDs.ToDictionary(x => x.ProductVarientID, x => x.ProductID);
            var soldByProduct = new Dictionary<int, int>();
            foreach (var d in billDetails)
            {
                if (!pvToProduct.TryGetValue(d.ProductVarientID, out var pid)) continue;
                soldByProduct[pid] = soldByProduct.GetValueOrDefault(pid) + (int)d.Quantity;
            }

            var products = await _dbcontext.Product
                .Where(p => soldByProduct.Keys.Contains(p.ProductID))
                .ToListAsync();
            foreach (var p in products)
                p.SoldCount += soldByProduct.GetValueOrDefault(p.ProductID);

            await _dbcontext.SaveChangesAsync();
        }

        private async Task ConsumeIngredients(Guid billID, List<BillDetail> billDetails, Guid? employeeID, int storeID)
        {
            var productVarientIDs = billDetails.Select(d => d.ProductVarientID).ToList();
            var recipes = await _dbcontext.Receipe
                .Where(r => productVarientIDs.Contains(r.ProductVarientID) && r.DeletedAt == null)
                .ToListAsync();

            var now = DateTime.UtcNow.AddHours(7);
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
                    throw new Exception($"Insufficient stock for IngredientID {ingredientID}: short by {totalToConsume}.");

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
                    throw new Exception($"Insufficient stock for IngredientID {ingredientID}: short by {remaining}.");
            }

            await _dbcontext.SaveChangesAsync();
        }

        public async Task ChangeBill(BillChangeRequest changeRequest){
            try {
                var latestChange = await _dbcontext.BillChange
                    .Where(bc => bc.BillID == changeRequest.BillID)
                    .OrderByDescending(bc => bc.ChangeAt)
                    .FirstOrDefaultAsync();

                if (latestChange != null && (int)changeRequest.Status <= (int)latestChange.Status)
                    throw new Exception($"Không thể chuyển trạng thái từ {latestChange.Status} sang {changeRequest.Status}");

                var newChange = new BillChange {
                    BillID = changeRequest.BillID,
                    Status = changeRequest.Status,
                    ChangeAt = changeRequest.ChangeAt,
                    EmployeeID = changeRequest.EmployeeID
                };
                _dbcontext.BillChange.Add(newChange);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e) {
                throw new Exception("Lỗi khi cập nhật trạng thái hóa đơn: " + e.Message);
            }
        }

        // public async Task SoftDeleteBill(Guid billID){
        //     try {
        //         var bill = await _dbcontext.Bill.FirstOrDefaultAsync(b => b.BillID == billID);
        //         if (bill == null) throw new Exception("Không tìm thấy hóa đơn");
        //         bill.DeletedAt = DateTime.UtcNow.AddHours(7);
        //         _dbcontext.Bill.Update(bill);
        //         await _dbcontext.SaveChangesAsync();
        //     } catch (Exception e) {
        //         throw new Exception("Lỗi khi xóa hóa đơn: " + e.Message);
        //     }
        // }
    }
}