using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.Implementations{
    public class BillService : IBillService{
        private readonly AppDbContext _dbcontext;
        private readonly IAddressService _addressService;
        private readonly IUserService _userService;
        private readonly IProductService _productService;
        public BillService (AppDbContext dbcontext,
                            IAddressService addressService,
                            IUserService userService,
                            IProductService productService){
            _dbcontext = dbcontext;
            _addressService = addressService;
            _userService = userService;
            _productService = productService;
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

        public async Task<List<Bill>?> GetUserBill(Guid userID){
            try {
                return await _dbcontext.Bill
                    .AsNoTracking()
                    .Where(b => b.UserID == userID)
                    .Include(b => b.BillDetail)
                        .ThenInclude(bd => bd.ProductVarient)
                            .ThenInclude(pr => pr.Product)
                    .Include(b => b.BillChange.OrderByDescending(bc => bc.ChangeAt))
                    .Include(b => b.Store)
                    .ToListAsync();
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
            try{
                Guid userID;
                if ( string.IsNullOrEmpty(request.contact))
                    userID = new Guid();
                else{ 
                    var user = await _userService.GetUserByContact(request.contact ?? "default");
                    if (user == null) throw new Exception("user not found");
                    else userID = user.UserID;
                }
                var bill = new Bill{
                        BillID = new Guid(),
                        UserID = userID,
                        StoreID = request.StoreID,
                        TableID = request.TableID,
                        PaymentMethods = request.PaymentMethods,
                        Note = request.Note,
                        MoneyReceived = request.MoneyReceived,
                        };
                decimal total = 0.0m;
                foreach (var i in request.products)
                {
                    var price =await _productService.GetPriceByID(i.ProductVarientID);
                    bill.BillDetail.Add(new BillDetail
                    {
                        BillID = bill.BillID,
                        ProductVarientID = i.ProductVarientID,
                        Quantity = i.qty,
                        Price = price,
                        InlineTotal = price * i.qty
                    });
                    total+= price * i.qty; 
                }
                bill.Total = total;
                bill.MoneyGiveBack = bill.MoneyReceived - bill.Total;
                var billChange = new BillChange
                {
                    BillID = bill.BillID,
                    Status = BillStatus.Create,
                    EmployeeID = request.EmployeID,
                    ChangeAt = DateTime.UtcNow
                };
                bill.BillChange.Add(billChange);
                _dbcontext.BillChange.Add(billChange);
                _dbcontext.Bill.Add(bill);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e)
            {
                Console.WriteLine("Error in BillService.CreateDineinBill" + e.Message);
                throw new Exception("Error in BillService.CreateDineinBill");
            }
        }

        public async Task ChangeBill(BillChangeRequest changeRequest){
            try {
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

        public async Task SoftDeleteBill(Guid billID){
            try {
                var bill = await _dbcontext.Bill.FirstOrDefaultAsync(b => b.BillID == billID);
                if (bill == null) throw new Exception("Không tìm thấy hóa đơn");
                bill.DeletedAt = DateTime.UtcNow;
                _dbcontext.Bill.Update(bill);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e) {
                throw new Exception("Lỗi khi xóa hóa đơn: " + e.Message);
            }
        }
    }
}