using Backend.Data;
using Backend.Helpers;
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

        public async Task<List<Bill>?> GetAllBillIn(DateOnly start, DateOnly end, int? storeID = null){
            try {
                IQueryable<Bill> query = _dbcontext.Bill
                    .AsNoTracking()
                    // Lấy mốc tạo bill (Status=Create) kèm nhân viên lập. Dùng Where (KHÔNG Take)
                    // để tránh OUTER APPLY khi kèm ThenInclude — MySQL/Pomelo không dịch được.
                    .Include(b => b.BillChange
                        .Where(bc => bc.Status == BillStatus.Create))
                        .ThenInclude(bc => bc.Employee)
                    .Where(b => b.BillChange.Any(bc =>
                            bc.Status == BillStatus.Create &&
                            bc.ChangeAt >= start.ToDateTime(TimeOnly.MinValue) &&
                            bc.ChangeAt <= end.ToDateTime(TimeOnly.MaxValue)))
                    .Include(b => b.BillDetail)
                        .ThenInclude(bd => bd.ProductVarient)
                            .ThenInclude(pr => pr.Product)
                    .Include(b => b.Store);

                if (storeID.HasValue)
                    query = query.Where(b => b.StoreID == storeID.Value);

                var bills = await query.ToListAsync();
                await PopulateCustomerNamesAsync(bills);
                return bills;
            } catch (Exception e) {
                throw new Exception("Lỗi khi lấy danh sách hóa đơn: " + e.Message);
            }
        }

        // Nạp tên khách để hiển thị (CustomerName) cho danh sách/chi tiết hóa đơn:
        // - Khách đã đăng ký (UserID != null) → lấy FullName trong bảng User.
        // - Khách vãng lai → lấy tên theo SĐT (Bill.Contact) trong sổ GuestCustomer.
        // Tránh Include cả entity User để không vô tình serialize HashPassword.
        private async Task PopulateCustomerNamesAsync(List<Bill> bills)
        {
            if (bills == null || bills.Count == 0) return;

            string Digits(string? s) => s == null ? "" : new string(s.Where(char.IsDigit).ToArray());

            var userIDs = bills.Where(b => b.UserID.HasValue).Select(b => b.UserID!.Value).Distinct().ToList();
            var userNames = userIDs.Count == 0
                ? new Dictionary<Guid, string>()
                : await _dbcontext.User.AsNoTracking()
                    .Where(u => userIDs.Contains(u.UserID))
                    .Select(u => new { u.UserID, u.FullName })
                    .ToDictionaryAsync(x => x.UserID, x => x.FullName);

            var phones = bills
                .Where(b => !b.UserID.HasValue && !string.IsNullOrWhiteSpace(b.Contact))
                .Select(b => Digits(b.Contact))
                .Where(p => p.Length is >= 8 and <= 10)
                .Distinct()
                .ToList();
            var guestNames = new Dictionary<string, string?>();
            if (phones.Count > 0)
            {
                // Bọc try/catch để sổ khách lẻ (GuestCustomer) có vấn đề cũng KHÔNG làm hỏng
                // việc tải danh sách/chi tiết hóa đơn — chỉ là không có tên khách lẻ.
                try {
                    guestNames = await _dbcontext.GuestCustomer.AsNoTracking()
                        .Where(g => phones.Contains(g.Phone))
                        .ToDictionaryAsync(g => g.Phone, g => g.Name);
                } catch (Exception ex) {
                    Console.WriteLine("PopulateCustomerNames: bỏ qua sổ khách lẻ GuestCustomer - " + ex.Message);
                }
            }

            foreach (var b in bills)
            {
                if (b.UserID.HasValue && userNames.TryGetValue(b.UserID.Value, out var fn))
                    b.CustomerName = fn;
                else if (!b.UserID.HasValue && !string.IsNullOrWhiteSpace(b.Contact)
                         && guestNames.TryGetValue(Digits(b.Contact), out var gn))
                    b.CustomerName = gn;
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
                    .Include(b => b.DeliveryInfo)
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
                        Address = b.Store.Address == null ? null : new AddressResponse
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
                    }).ToList(),
                    ScheduledAt = b.DeliveryInfo != null ? b.DeliveryInfo.ScheduledAt : null
                }).ToList();
            } catch (Exception e) {
                throw new Exception("Lỗi khi lấy hóa đơn của người dùng: " + e.Message);
            }
        }

        public async Task<Bill?> GetBillByID(Guid billID){
            try {
                var bill = await _dbcontext.Bill
                    .AsNoTracking()
                    .Where(b => b.BillID == billID)
                    .Include(b => b.BillDetail)
                        .ThenInclude(bd => bd.ProductVarient)
                            .ThenInclude(pr => pr.Product)
                    .Include(b => b.BillChange.OrderByDescending(bc => bc.ChangeAt))
                        .ThenInclude(b => b.Employee)
                    .Include(b => b.Store)
                    .FirstOrDefaultAsync();
                if (bill != null)
                    await PopulateCustomerNamesAsync(new List<Bill> { bill });
                return bill;
            } catch (Exception e) {
                throw new Exception("Lỗi khi lấy hóa đơn: " + e.Message);
            }
        }
        public async Task<DineInBillCreateReponse> CreateDineInBill(DineInBillCreateRequest request){
            if (request.products == null || request.products.Count == 0)
                throw new InvalidOperationException("Vui lòng chọn ít nhất 1 món.");
            if (request.EmployeID == null)
                throw new InvalidOperationException("EmployeeID là bắt buộc.");

            var storeExists = await _dbcontext.Store
                .AnyAsync(s => s.StoreID == request.StoreID && s.DeletedAt == null);
            if (!storeExists)
                throw new InvalidOperationException($"Không tìm thấy cửa hàng ID {request.StoreID}.");

            // Bàn của hóa đơn (nếu là đơn tại bàn) — giữ tham chiếu để đánh dấu Occupied bên dưới.
            DiningTable? table = null;
            if (request.TableID.HasValue)
            {
                table = await _dbcontext.DiningTable
                    .FirstOrDefaultAsync(t => t.TableID == request.TableID && t.DeletedAt == null);
                if (table == null)
                    throw new InvalidOperationException($"Không tìm thấy bàn số {request.TableID}.");

                // CHẶN CỨNG khi bàn còn một hóa đơn chuyển khoản CHƯA thanh toán (Pending chưa
                // được SePay xác nhận): tránh đè lên một giao dịch QR đang dang dở. Còn việc
                // "bàn đang có khách" (đã có hóa đơn tiền mặt/thẻ Paid) KHÔNG chặn ở đây —
                // FE sẽ cảnh báo "bàn đang có người, có tiếp tục không?" và cho phép tiếp tục.
                var hasUnpaidBill = await _dbcontext.Bill.AnyAsync(b =>
                    b.TableID == request.TableID.Value &&
                    b.DeletedAt == null &&
                    b.PaymentStatus == PaymentStatus.Pending);
                if (hasUnpaidBill)
                    throw new InvalidOperationException(
                        $"Bàn {request.TableID} đang có hóa đơn chuyển khoản chưa thanh toán. Vui lòng chờ thanh toán hoặc huỷ hóa đơn cũ trước khi mở hóa đơn mới.");
            }

            using var tx = await _dbcontext.Database.BeginTransactionAsync();
            try{
                var contact = string.IsNullOrWhiteSpace(request.contact) ? null : request.contact.Trim();
                var customerName = string.IsNullOrWhiteSpace(request.customerName) ? null : request.customerName.Trim();

                Guid? userID = null;
                User? matchedUser = null;
                if (contact != null){
                    matchedUser = await _userService.GetUserByContact(contact);
                    userID = matchedUser?.UserID;
                }
                var isBankTransfer = request.PaymentMethods == PaymentMethods.BankTransfer;
                var bill = new Bill{
                        BillID = Guid.NewGuid(),
                        UserID = userID,
                        StoreID = request.StoreID,
                        TableID = request.TableID,
                        Contact = contact,
                        PaymentMethods = request.PaymentMethods,
                        Note = request.Note,
                        MoneyReceived = isBankTransfer ? null : request.MoneyReceived,
                        PaymentStatus = isBankTransfer ? PaymentStatus.Pending : PaymentStatus.Paid,
                        PaidAt = isBankTransfer ? null : VnTime.Now
                        };

                // Khách vãng lai (không khớp tài khoản nào): lưu/ cập nhật vào sổ khách lẻ
                // GuestCustomer theo SĐT để lần sau gõ SĐT là tra ra được tên. Chỉ lưu khi
                // SĐT là số hợp lệ (8–10 chữ số) — khớp kiểu cột varchar(10), PK = Phone.
                if (matchedUser == null && contact != null)
                {
                    var phoneDigits = new string(contact.Where(char.IsDigit).ToArray());
                    if (phoneDigits.Length is >= 8 and <= 10)
                    {
                        // Bọc try/catch: nếu sổ khách lẻ GuestCustomer có vấn đề thì vẫn KHÔNG
                        // chặn việc xuất hóa đơn (SĐT đã được lưu trên Bill.Contact).
                        try {
                            var guest = await _dbcontext.GuestCustomer
                                .FirstOrDefaultAsync(g => g.Phone == phoneDigits);
                            if (guest == null)
                            {
                                _dbcontext.GuestCustomer.Add(new GuestCustomer
                                {
                                    Phone = phoneDigits,
                                    Name = customerName,
                                    LastBillAt = VnTime.Now
                                });
                            }
                            else
                            {
                                // Cập nhật tên nếu lần này khách cung cấp tên mới; luôn cập nhật mốc gần nhất.
                                if (!string.IsNullOrWhiteSpace(customerName)) guest.Name = customerName;
                                guest.LastBillAt = VnTime.Now;
                            }
                        } catch (Exception ex) {
                            Console.WriteLine("Bỏ qua lưu sổ khách lẻ GuestCustomer: " + ex.Message);
                        }
                    }
                }
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
                    if (ticket != null && ticket.UsedAt == null && ticket.EndDate >= VnTime.Today)
                    {
                        bill.TicketID = ticket.TicketID;
                        bill.Total = bill.Total * (1 - ticket.Discount);
                    }
                }

                // Làm tròn tổng tiền đến hàng đơn vị (đồng), bỏ phần thập phân lẻ, trước khi lưu DB.
                bill.Total = MoneyHelper.Round(bill.Total);

                if (isBankTransfer)
                {
                    bill.MoneyGiveBack = null;
                    var prefix = string.IsNullOrWhiteSpace(_sepay.ReferencePrefix) ? "JLB" : _sepay.ReferencePrefix;
                    bill.PaymentReference = prefix + bill.BillID.ToString("N").Substring(0, 8).ToUpper();
                }
                else
                {
                    if (request.MoneyReceived < bill.Total)
                        throw new Exception($"MoneyReceived ({request.MoneyReceived}) is less than Total ({bill.Total}).");
                    bill.MoneyGiveBack = bill.MoneyReceived - bill.Total;
                }

                var billChange = new BillChange
                {
                    BillID = bill.BillID,
                    Status = BillStatus.Create,
                    EmployeeID = request.EmployeID,
                    ChangeAt = VnTime.Now
                };
                bill.BillChange.Add(billChange);

                // Đánh dấu bàn "đang có khách" ngay khi lập hóa đơn tại bàn. Bàn được trả về
                // trạng thái trống thủ công ở màn "Sơ đồ bàn" khi khách rời đi.
                if (table != null)
                    table.Status = TableStatus.Occupied;

                _dbcontext.Bill.Add(bill);
                await _dbcontext.SaveChangesAsync();

                if (bill.TicketID.HasValue && userID.HasValue)
                    await _ticketService.SetUsedAt(bill.TicketID.Value, userID.Value);

                await IncreaseSoldCount(bill.BillDetail.ToList());
                await ConsumeIngredients(bill.BillID, bill.BillDetail.ToList(), request.EmployeID.Value, request.StoreID);
                await tx.CommitAsync();

                var (storeAcc, storeBank, storeAccName) = await ResolveStoreBankAsync(bill.StoreID);
                var response = new DineInBillCreateReponse
                {
                    BillID           = bill.BillID,
                    Total            = bill.Total,
                    PaymentMethods   = bill.PaymentMethods,
                    PaymentStatus    = bill.PaymentStatus,
                    PaymentReference = bill.PaymentReference,
                    BankAccount      = storeAcc,
                    BankCode         = storeBank,
                    BankAccountName  = storeAccName,
                    TestMode         = _sepay.TestMode
                };

                if (isBankTransfer
                    && !string.IsNullOrEmpty(storeAcc)
                    && !string.IsNullOrEmpty(storeBank))
                {
                    var amount = ((long)bill.Total).ToString();
                    var des    = Uri.EscapeDataString(bill.PaymentReference ?? "");
                    response.QrUrl = $"https://qr.sepay.vn/img?acc={storeAcc}&bank={storeBank}&amount={amount}&des={des}";
                }
                return response;
            } catch (InvalidOperationException) {
                await tx.RollbackAsync();
                throw;
            } catch (Exception e)
            {
                await tx.RollbackAsync();
                throw new Exception("Lỗi tạo hóa đơn tại quán: " + e.Message);
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

        // Cửa hàng xử lý đơn giao. ƯU TIÊN cửa hàng khách đã chọn trên giao diện: FE hiển thị
        // đúng cửa hàng đó và tính phí ship theo nó, nên đơn phải về đúng cửa hàng đó thì nhân
        // viên cửa hàng mới nhìn thấy/tiếp nhận được. Trước đây hàm này luôn ép về cửa hàng gần
        // nhất theo tọa độ, khiến đơn "biến mất" khỏi cửa hàng khách chọn → nhân viên không thấy.
        // Chỉ khi KHÔNG có lựa chọn hợp lệ mới tự suy ra cửa hàng gần nhất theo địa chỉ giao.
        private async Task<int> ResolveDeliveryStoreAsync(Guid addressID, int? selectedStoreID)
        {
            if (selectedStoreID.HasValue && selectedStoreID.Value > 0)
            {
                var selectedExists = await _dbcontext.Store
                    .AnyAsync(s => s.StoreID == selectedStoreID.Value && s.DeletedAt == null);
                if (selectedExists) return selectedStoreID.Value;
            }

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

            throw new Exception("Không thể xác định cửa hàng xử lý đơn giao hàng: chưa chọn cửa hàng hợp lệ và địa chỉ thiếu tọa độ.");
        }

        public async Task<DeliveryBillCreateReponse> CreateDeliveryBill(DeliveryBillCreateRequest request)
        {
            if (request.products == null || request.products.Count == 0)
                throw new Exception("Bill must have at least one product.");

            var storeExists = await _dbcontext.Store
                .AnyAsync(s => s.StoreID == request.StoreID && s.DeletedAt == null);
            if (!storeExists)
                throw new Exception($"Store {request.StoreID} not found.");

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

                var resolvedStoreID = await ResolveDeliveryStoreAsync(addressID, request.StoreID);

                // Chặn ngay lúc khách đặt nếu cửa hàng xử lý đơn không đủ nguyên liệu →
                // yêu cầu khách chọn cửa hàng khác. CHỈ kiểm tra, KHÔNG trừ kho: việc trừ
                // vẫn thực hiện khi bếp chuyển "Đang chuẩn bị" (ConsumeIngredientsForDelivery).
                await EnsureIngredientsAvailable(
                    request.products.Select(p => (p.ProductVarientID, p.qty)).ToList(),
                    resolvedStoreID);

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
                    double distKm = HaversineKm(
                        deliveryAddress.Latitude!.Value, deliveryAddress.Longitude!.Value,
                        resolvedStore.Address.Latitude!.Value, resolvedStore.Address.Longitude!.Value);
                    if (distKm > ShippingHelper.MaxDeliveryKm)
                        throw new Exception($"Địa chỉ giao hàng cách cửa hàng {distKm:F1} km, vượt quá khoảng cách tối đa {ShippingHelper.MaxDeliveryKm} km.");
                    shippingFee = ShippingHelper.Fee(distKm);
                }
                bill.Total = total * (1 + bill.VAT);

                if (request.TicketID.HasValue && request.TicketID.Value != Guid.Empty)
                {
                    var ticket = await _ticketService.GetTicketByID(request.TicketID.Value);
                    if (ticket != null && ticket.UsedAt == null && ticket.EndDate >= VnTime.Today)
                    {
                        bill.TicketID = ticket.TicketID;
                        bill.Total = bill.Total * (1 - ticket.Discount);
                    }
                }

                // Làm tròn tổng tiền đến hàng đơn vị (đồng), bỏ phần thập phân lẻ, trước khi lưu DB.
                bill.Total = MoneyHelper.Round(bill.Total);

                var billChange = new BillChange
                {
                    BillID = bill.BillID,
                    Status = BillStatus.Create,
                    EmployeeID = request.EmployeID,
                    ChangeAt = VnTime.Now
                };
                bill.BillChange.Add(billChange);

                // Sinh mã nội dung CK cho chuyển khoản SePay (rút gọn BillID 8 ký tự đầu)
                if (request.PaymentMethods == PaymentMethods.BankTransfer)
                {
                    var prefix = string.IsNullOrWhiteSpace(_sepay.ReferencePrefix) ? "JLB" : _sepay.ReferencePrefix;
                    bill.PaymentReference = prefix + bill.BillID.ToString("N").Substring(0, 8).ToUpper();
                }

                _dbcontext.Bill.Add(bill);

                // Giờ hẹn giao: phải ở tương lai và trong vòng 10 giờ tới (null = giao ngay).
                if (request.ScheduledAt.HasValue)
                {
                    var sched = request.ScheduledAt.Value;
                    var now   = VnTime.Now;
                    if (sched <= now)
                        throw new InvalidOperationException("Giờ hẹn giao hàng phải ở thời điểm trong tương lai.");
                    if (sched > now.AddHours(10))
                        throw new InvalidOperationException("Chỉ được hẹn giao trong vòng 10 giờ tới.");
                }

                var delivery = new DeliveryInfo{
                    DeliveryID = Guid.NewGuid(),
                    BillID = bill.BillID,
                    UserID = request.UserID,
                    AddressID = addressID,
                    Note = request.NoteForDelivery,
                    ScheduledAt = request.ScheduledAt,
                    ShippingFee = shippingFee
                };
                // Chỉ đưa đơn vào quản lý giao hàng (tạo log Pending) khi đã thanh toán.
                // Đơn chuyển khoản/thẻ (BankTransfer) chờ webhook SePay xác nhận tiền về
                // rồi mới tạo log → lúc đó mới hiện trong "Đơn đang chờ giao".
                if (bill.PaymentStatus == PaymentStatus.Paid)
                {
                    delivery.DeliveryLog.Add(new DeliveryLog{
                        DeliveryID = delivery.DeliveryID,
                        Status = DeliveryStatus.Pending,
                        ChangeAt = VnTime.Now,
                        Note = request.NoteForDelivery
                    });
                }
                _dbcontext.DeliveryInfo.Add(delivery);

                await _dbcontext.SaveChangesAsync();

                if (bill.TicketID.HasValue)
                    await _ticketService.SetUsedAt(bill.TicketID.Value, request.UserID);

                await IncreaseSoldCount(bill.BillDetail.ToList());
                // Không trừ nguyên liệu ở đây – sẽ trừ khi bếp bắt đầu chuẩn bị (Preparing)
                await tx.CommitAsync();

                var (storeAcc, storeBank, storeAccName) = await ResolveStoreBankAsync(bill.StoreID);
                var response = new DeliveryBillCreateReponse
                {
                    BillID           = bill.BillID,
                    Total            = bill.Total,
                    PaymentMethods   = bill.PaymentMethods,
                    PaymentStatus    = bill.PaymentStatus,
                    PaymentReference = bill.PaymentReference,
                    BankAccount      = storeAcc,
                    BankCode         = storeBank,
                    BankAccountName  = storeAccName,
                    TestMode         = _sepay.TestMode
                };

                if (bill.PaymentMethods == PaymentMethods.BankTransfer
                    && !string.IsNullOrEmpty(storeAcc)
                    && !string.IsNullOrEmpty(storeBank))
                {
                    // VietQR ảnh động của SePay: https://qr.sepay.vn/img?acc=...&bank=...&amount=...&des=...
                    var amount = ((long)bill.Total).ToString();
                    var des    = Uri.EscapeDataString(bill.PaymentReference ?? "");
                    response.QrUrl = $"https://qr.sepay.vn/img?acc={storeAcc}&bank={storeBank}&amount={amount}&des={des}";
                }
                return response;
            } catch (InvalidOperationException) {
                await tx.RollbackAsync();
                throw;
            } catch (Exception e) {
                await tx.RollbackAsync();
                throw new Exception("Lỗi tạo đơn giao hàng: " + e.Message);
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

        // Huỷ bill chưa thanh toán (FE gọi khi countdown 3p hết, hoặc user bấm "Huỷ").
        // Idempotent: gọi lại trên bill đã Failed thì không throw — popup có thể race.
        public async Task CancelUnpaidBill(Guid billID, Guid callerID, bool isStaff = false)
        {
            var bill = await _dbcontext.Bill.FirstOrDefaultAsync(b => b.BillID == billID);
            if (bill == null) throw new Exception("Bill không tồn tại.");
            if (!isStaff && bill.UserID != callerID) throw new Exception("Không có quyền huỷ bill này.");
            if (bill.PaymentStatus == PaymentStatus.Paid)
                throw new Exception("Bill đã thanh toán, không thể huỷ.");
            if (bill.PaymentStatus == PaymentStatus.Failed) return; // đã huỷ rồi

            bill.PaymentStatus = PaymentStatus.Failed;

            // Đơn chuyển khoản chưa thanh toán bị huỷ → xoá mềm thông tin giao hàng
            // (đơn chưa có log nên chưa hiện trong quản lý giao hàng; đây là bước dọn dẹp).
            var deliveryInfo = await _dbcontext.DeliveryInfo
                .FirstOrDefaultAsync(di => di.BillID == bill.BillID && di.DeletedAt == null);
            if (deliveryInfo != null)
                deliveryInfo.DeletedAt = VnTime.Now;

            _dbcontext.BillChange.Add(new BillChange
            {
                BillChangeID = Guid.NewGuid(),
                BillID = bill.BillID,
                Status = BillStatus.Delete,
                ChangeAt = VnTime.Now,
                EmployeeID = null
            });
            await _dbcontext.SaveChangesAsync();
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

        // Kiểm tra (KHÔNG trừ) tồn kho nguyên liệu đã sơ chế của 1 cửa hàng cho danh
        // sách món + số lượng. Dùng cho đơn giao của khách: chặn ngay lúc đặt nếu cửa
        // hàng thiếu nguyên liệu, để báo khách chọn cửa hàng khác. Logic khớp tuyệt đối
        // với ConsumeIngredients (chỉ lô đã sơ chế, còn hàng, chưa hết hạn; nhu cầu mỗi
        // phần = QtyAfterProcess). Ném InvalidOperationException khi thiếu.
        private async Task EnsureIngredientsAvailable(List<(int ProductVarientID, decimal Quantity)> items, int storeID)
        {
            if (items == null || items.Count == 0) return;

            var productVarientIDs = items.Select(i => i.ProductVarientID).Distinct().ToList();
            var recipes = await _dbcontext.Receipe
                .Where(r => productVarientIDs.Contains(r.ProductVarientID) && r.DeletedAt == null)
                .ToListAsync();

            var today = DateOnly.FromDateTime(VnTime.Now);

            var demand = new Dictionary<int, decimal>();
            foreach (var item in items)
            {
                foreach (var recipe in recipes.Where(r => r.ProductVarientID == item.ProductVarientID))
                {
                    var need = recipe.QtyAfterProcess * item.Quantity;
                    if (need <= 0) continue;
                    demand[recipe.IngredientID] = demand.GetValueOrDefault(recipe.IngredientID) + need;
                }
            }
            if (demand.Count == 0) return;

            var ingredientIDs = demand.Keys.ToList();

            var ingredientNameById = await _dbcontext.Ingredient
                .Where(i => ingredientIDs.Contains(i.IngredientID))
                .ToDictionaryAsync(i => i.IngredientID, i => i.IngredientName);
            var varientNameById = (await _dbcontext.ProductVarient
                    .Where(pv => productVarientIDs.Contains(pv.ProductVarientID))
                    .Include(pv => pv.Product)
                    .Select(pv => new { pv.ProductVarientID, pv.Product.ProductName, pv.Size })
                    .ToListAsync())
                .ToDictionary(x => x.ProductVarientID,
                    x => x.Size == ProductSize.Default ? x.ProductName : $"{x.ProductName} (size {x.Size})");

            string OutOfStockMessage(int ingId)
            {
                var dishes = recipes
                    .Where(r => r.IngredientID == ingId)
                    .Select(r => r.ProductVarientID)
                    .Distinct()
                    .Where(varientNameById.ContainsKey)
                    .Select(id => "\"" + varientNameById[id] + "\"")
                    .Distinct()
                    .ToList();
                var dishText = dishes.Count > 0 ? string.Join(", ", dishes) : "(không xác định)";
                var ingName = ingredientNameById.GetValueOrDefault(ingId, "#" + ingId);
                return $"Cửa hàng hiện không đủ nguyên liệu \"{ingName}\" cho món {dishText}. Vui lòng chọn cửa hàng khác.";
            }

            var availableBatches = await _dbcontext.InventoryBatch
                .Where(b => ingredientIDs.Contains(b.IngredientID)
                         && b.BatchType == BatchType.Processed
                         && b.Status == BatchStatus.Available
                         && b.QuantityOnHand > 0
                         && b.Exp >= today
                         && b.Warehouse.StoreID == storeID)
                .ToListAsync();

            var stockByIngredient = availableBatches
                .GroupBy(b => b.IngredientID)
                .ToDictionary(g => g.Key, g => g.Sum(b => b.QuantityOnHand));

            foreach (var (ingredientID, needed) in demand)
            {
                if (stockByIngredient.GetValueOrDefault(ingredientID, 0m) < needed)
                    throw new InvalidOperationException(OutOfStockMessage(ingredientID));
            }
        }

        private async Task ConsumeIngredients(Guid billID, List<BillDetail> billDetails, Guid? employeeID, int storeID)
        {
            var productVarientIDs = billDetails.Select(d => d.ProductVarientID).ToList();
            var recipes = await _dbcontext.Receipe
                .Where(r => productVarientIDs.Contains(r.ProductVarientID) && r.DeletedAt == null)
                .ToListAsync();

            var now = VnTime.Now;
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

            // Tên nguyên liệu + tên món (varient) để báo lỗi thân thiện: "Món X đã hết hàng".
            var ingredientNameById = await _dbcontext.Ingredient
                .Where(i => ingredientIDs.Contains(i.IngredientID))
                .ToDictionaryAsync(i => i.IngredientID, i => i.IngredientName);
            var varientNameById = (await _dbcontext.ProductVarient
                    .Where(pv => productVarientIDs.Contains(pv.ProductVarientID))
                    .Include(pv => pv.Product)
                    .Select(pv => new { pv.ProductVarientID, pv.Product.ProductName, pv.Size })
                    .ToListAsync())
                .ToDictionary(x => x.ProductVarientID,
                    x => x.Size == ProductSize.Default ? x.ProductName : $"{x.ProductName} (size {x.Size})");

            // Gom tên các món trong hóa đơn đang dùng nguyên liệu bị thiếu để hiện cho nhân viên.
            string OutOfStockMessage(int ingId)
            {
                var dishes = recipes
                    .Where(r => r.IngredientID == ingId)
                    .Select(r => r.ProductVarientID)
                    .Distinct()
                    .Where(varientNameById.ContainsKey)
                    .Select(id => "\"" + varientNameById[id] + "\"")
                    .Distinct()
                    .ToList();
                var dishText = dishes.Count > 0 ? string.Join(", ", dishes) : "(không xác định)";
                var ingName = ingredientNameById.GetValueOrDefault(ingId, "#" + ingId);
                return $"Món {dishText} đã hết hàng (thiếu nguyên liệu \"{ingName}\").";
            }

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
                    throw new InvalidOperationException(OutOfStockMessage(ingredientID));

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
                    throw new InvalidOperationException(OutOfStockMessage(ingredientID));
            }

            await _dbcontext.SaveChangesAsync();
        }

        // Lấy TK ngân hàng nhận tiền. Ưu tiên TK cấu hình chung trong .env (SePay__Account/Bank)
        // để chỉ cần cấu hình 1 lần, không phải chọn/khai báo TK cho từng cửa hàng. Nếu .env
        // trống thì mới fallback về TK riêng của cửa hàng trong DB (BankAccount).
        private async Task<(string? acc, string? bank, string? name)> ResolveStoreBankAsync(int storeID)
        {
            if (!string.IsNullOrWhiteSpace(_sepay.Account) && !string.IsNullOrWhiteSpace(_sepay.Bank))
                return (_sepay.Account, _sepay.Bank, _sepay.AccountHolderName);

            var ba = await _dbcontext.BankAccount
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.StoreID == storeID && b.DeletedAt == null);
            return (ba?.AccountNumber, ba?.BankCode, ba?.AccountHolderName);
        }

        public async Task ChangeBill(BillChangeRequest changeRequest){
            try {
                var bill = await _dbcontext.Bill
                    .FirstOrDefaultAsync(b => b.BillID == changeRequest.BillID)
                    ?? throw new Exception("Không tìm thấy hóa đơn");

                // CHẶN đánh dấu "Đã thanh toán" khi tiền chưa thực sự vào.
                // Bill.PaymentStatus chỉ = Paid trong 2 trường hợp:
                //   - Tiền mặt/thẻ: set Paid ngay lúc tạo bill (thu tại quầy).
                //   - Chuyển khoản: SePay webhook xác nhận TransferAmount >= Total mới set Paid.
                // Nhân viên KHÔNG được tự ghi log Paid khi SePay chưa cộng đủ tiền.
                if (changeRequest.Status == BillStatus.Paid && bill.PaymentStatus != PaymentStatus.Paid)
                    throw new Exception("Chưa nhận được thanh toán (SePay chưa xác nhận cộng tiền). Không thể chuyển hóa đơn sang Đã thanh toán.");

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