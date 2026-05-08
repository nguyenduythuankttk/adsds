using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.Implementations{
    public class BillService : IBillService{
        private readonly AppDbContext _dbcontext;
        public BillService (AppDbContext dbcontext){
            _dbcontext = dbcontext;
        }

        public async Task<List<Bill>?> GetAllBillIn(DateOnly start, DateOnly end){
            try {
                return await _dbcontext.Bill
                    .AsNoTracking()
                    .Include(b => b.BillChange
                        .OrderBy(bc => bc.ChangeAt)
                        .Take(1))
                        .ThenInclude(bc => bc.Employee)
                    .Where(b => b.BillChange.Any() &&
                            b.BillChange.Max(b => b.ChangeAt) >= start.ToDateTime(TimeOnly.MinValue) &&
                            b.BillChange.Max(b => b.ChangeAt) <= end.ToDateTime(TimeOnly.MaxValue))
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

        public async Task AddBill(BillCreateRequest request){
            try {
                var newBill = new Bill{
                    UserID = request.UserID,
                    StoreID = request.StoreID,
                    VAT = request.VAT,
                    PaymentMethods = request.PaymentMethods,
                    Total = request.Total,
                    Paid = request.Paid,
                    Note = request.Note,
                    MoneyGiveBack = request.MoneyGiveBack,
                    MoneyReceived = request.MoneyReceived
                };
                var newChange = new BillChange{
                    BillID = newBill.BillID,
                    EmployeeID = request.EmployeID,
                    ChangeAt = DateTime.UtcNow,
                    Status = BillStatus.Create
                };
                _dbcontext.Bill.Add(newBill);
                _dbcontext.BillChange.Add(newChange);
                await _dbcontext.SaveChangesAsync();
            } catch (Exception e) {
                throw new Exception("Lỗi khi tạo hóa đơn: " + e.Message);
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