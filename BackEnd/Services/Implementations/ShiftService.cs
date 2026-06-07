using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Data;
using Backend.Helpers;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.Implementations{
    public class ShiftService : IShiftService{
        private readonly AppDbContext _dbContext;

        // Cửa sổ chấp nhận check-in "đúng giờ" so với TimeIn (phút).
        private const int OnTimeWindowMinutes = 5;
        // Trễ quá ngưỡng này tính là vắng (không tính trễ).
        private const int AbsentThresholdMinutes = 60;
        // Khung giờ làm việc cho phép xếp ca (08:00–22:00).
        private static readonly TimeSpan WorkDayStart = new TimeSpan(8, 0, 0);
        private static readonly TimeSpan WorkDayEnd = new TimeSpan(22, 0, 0);

        public ShiftService (AppDbContext dbContext){
            _dbContext = dbContext;
        }

        private static ShiftResponse Project(Shift s) => new ShiftResponse {
            ShiftID = s.ShiftID,
            EmployeeID = s.EmployeeID,
            EmployeeName = s.Employee?.FullName ?? "",
            StoreID = s.Employee?.StoreID ?? 0,
            StoreName = s.Employee?.Store?.StoreName,
            TimeIn = s.TimeIn,
            TimeOut = s.TimeOut,
            CheckIn = s.CheckIn,
            CheckOut = s.CheckOut,
            Status = s.Status
        };

        public async Task<List<ShiftResponse>> GetAllShiftIn(DateOnly date) {
            var start = date.ToDateTime(TimeOnly.MinValue);
            var end = date.ToDateTime(TimeOnly.MaxValue);
            var list = await _dbContext.Shift
                .AsNoTracking()
                .Where(s => s.DeletedAt == null && s.TimeIn >= start && s.TimeIn <= end)
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Store)
                .ToListAsync();
            return list.Select(Project).ToList();
        }

        public async Task<ShiftResponse?> GetShiftByID(Guid ID) {
            var s = await _dbContext.Shift
                .AsNoTracking()
                .Include(x => x.Employee)
                    .ThenInclude(e => e.Store)
                .FirstOrDefaultAsync(x => x.ShiftID == ID && x.DeletedAt == null);
            return s == null ? null : Project(s);
        }

        public async Task<List<ShiftResponse>> GetShiftsByStore(int storeID, DateOnly start, DateOnly end) {
            var s = start.ToDateTime(TimeOnly.MinValue);
            var e = end.ToDateTime(TimeOnly.MaxValue);
            var list = await _dbContext.Shift
                .AsNoTracking()
                .Where(sh => sh.DeletedAt == null
                    && sh.Employee.StoreID == storeID
                    && sh.TimeIn >= s && sh.TimeIn <= e)
                .Include(sh => sh.Employee)
                    .ThenInclude(emp => emp.Store)
                .OrderBy(sh => sh.TimeIn)
                .ToListAsync();
            return list.Select(Project).ToList();
        }

        public async Task<List<ShiftResponse>> GetShiftsByEmployee(Guid employeeID, DateOnly start, DateOnly end) {
            var s = start.ToDateTime(TimeOnly.MinValue);
            var e = end.ToDateTime(TimeOnly.MaxValue);
            var list = await _dbContext.Shift
                .AsNoTracking()
                .Where(sh => sh.DeletedAt == null
                    && sh.EmployeeID == employeeID
                    && sh.TimeIn >= s && sh.TimeIn <= e)
                .Include(sh => sh.Employee)
                    .ThenInclude(emp => emp.Store)
                .OrderBy(sh => sh.TimeIn)
                .ToListAsync();
            return list.Select(Project).ToList();
        }

        public async Task AddShift(ShiftCreateRequest request) {
            var employee = await _dbContext.Employee
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserID == request.EmployeeID && e.DeleteAt == null)
                ?? throw new Exception("Nhân viên không tồn tại");
            await AssignShift(employee.StoreID, new ShiftAssignRequest {
                EmployeeID = request.EmployeeID,
                TimeIn = request.TimeIn,
                TimeOut = request.TimeOut
            });
        }

        public async Task<ShiftResponse> AssignShift(int storeID, ShiftAssignRequest request) {
            // Validate nhân viên có nằm trong store admin đang quản lý không
            var employee = await _dbContext.Employee
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserID == request.EmployeeID && e.DeleteAt == null)
                ?? throw new Exception("Nhân viên không tồn tại");
            if (employee.StoreID != storeID)
                throw new Exception("Nhân viên không thuộc cửa hàng này");

            if (request.TimeIn >= request.TimeOut)
                throw new Exception("Giờ vào phải sớm hơn giờ ra");

            // Ca làm chỉ được xếp trong khung giờ làm việc 08:00–22:00, trong cùng một ngày.
            if (request.TimeIn.Date != request.TimeOut.Date
                || request.TimeIn.TimeOfDay < WorkDayStart
                || request.TimeOut.TimeOfDay > WorkDayEnd)
                throw new Exception("Ca làm chỉ được xếp trong khung giờ 08:00–22:00");

            // Không cho phân ca vào thời gian đã qua so với hiện tại (giờ VN).
            if (request.TimeIn < VnTime.Now)
                throw new Exception("Không thể phân ca vào thời gian đã qua");

            // Không cho 1 nhân viên có 2 ca chồng (overlap) lên nhau.
            // Hai khoảng [TimeIn, TimeOut) chồng nhau khi: s.TimeIn < new.TimeOut && new.TimeIn < s.TimeOut.
            var overlapped = await _dbContext.Shift.AnyAsync(s =>
                s.EmployeeID == request.EmployeeID
                && s.DeletedAt == null
                && s.TimeIn < request.TimeOut
                && request.TimeIn < s.TimeOut);
            if (overlapped)
                throw new Exception("Nhân viên đã có ca làm trùng/chồng thời gian này");

            var newShift = new Shift {
                ShiftID = Guid.NewGuid(),
                EmployeeID = request.EmployeeID,
                TimeIn = request.TimeIn,
                TimeOut = request.TimeOut,
                Status = ShiftStatus.Scheduled
            };
            _dbContext.Shift.Add(newShift);
            await _dbContext.SaveChangesAsync();
            return (await GetShiftByID(newShift.ShiftID))!;
        }

        public async Task UpdateShift(ShiftUpdateRequest request, Guid shiftID){
            var shift = await _dbContext.Shift.FirstOrDefaultAsync(s => s.ShiftID == shiftID && s.DeletedAt == null);
            if (shift == null) throw new Exception("Không tìm thấy ca");
            if (request.CheckIn.HasValue) shift.CheckIn = request.CheckIn;
            if (request.CheckOut.HasValue) shift.CheckOut = request.CheckOut;
            await _dbContext.SaveChangesAsync();
        }

        public async Task SoftDeleteShift(Guid ID){
            var shift = await _dbContext.Shift
                .FirstOrDefaultAsync(s => s.ShiftID == ID && s.DeletedAt == null)
                ?? throw new Exception("Không tìm thấy ca");
            shift.DeletedAt = VnTime.Now;
            await _dbContext.SaveChangesAsync();
        }

        // Khi nhân viên đăng nhập / bấm check-in, tìm ca hôm nay gần nhất và đối chiếu.
        public async Task<ShiftCheckInResponse> CheckInForEmployee(Guid employeeID) {
            var now = VnTime.Now;
            var dayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
            var dayEnd = dayStart.AddDays(1);

            var shift = await _dbContext.Shift
                .Where(s => s.EmployeeID == employeeID
                    && s.DeletedAt == null
                    && s.TimeIn >= dayStart && s.TimeIn < dayEnd)
                .OrderBy(s => s.TimeIn)
                .FirstOrDefaultAsync();

            if (shift == null) {
                return new ShiftCheckInResponse {
                    Status = ShiftStatus.Scheduled,
                    HasShift = false,
                    Message = "Hôm nay không có ca làm"
                };
            }

            var diffMinutes = (int)Math.Round((now - shift.TimeIn).TotalMinutes);

            // Nếu đã check-in rồi thì giữ nguyên, không ghi đè.
            if (shift.CheckIn == null) {
                shift.CheckIn = now;
                if (diffMinutes <= -OnTimeWindowMinutes) {
                    // Sớm quá nhiều — vẫn coi là đúng giờ, nhưng đánh dấu OnTime
                    shift.Status = ShiftStatus.OnTime;
                } else if (diffMinutes <= OnTimeWindowMinutes) {
                    shift.Status = ShiftStatus.OnTime;
                } else if (diffMinutes <= AbsentThresholdMinutes) {
                    shift.Status = ShiftStatus.Late;
                } else {
                    shift.Status = ShiftStatus.Absent;
                }
                await _dbContext.SaveChangesAsync();
            }

            return new ShiftCheckInResponse {
                ShiftID = shift.ShiftID,
                TimeIn = shift.TimeIn,
                TimeOut = shift.TimeOut,
                CheckIn = shift.CheckIn,
                CheckOut = shift.CheckOut,
                Status = shift.Status,
                MinutesDiff = diffMinutes,
                HasShift = true,
                Message = shift.Status switch {
                    ShiftStatus.OnTime => "Check-in đúng giờ",
                    ShiftStatus.Late => $"Đi trễ {diffMinutes} phút",
                    ShiftStatus.Absent => $"Vắng (trễ {diffMinutes} phút)",
                    _ => "Đã check-in"
                }
            };
        }

        public async Task<ShiftCheckInResponse> CheckOutForEmployee(Guid employeeID) {
            var now = VnTime.Now;
            var dayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
            var dayEnd = dayStart.AddDays(1);

            var shift = await _dbContext.Shift
                .Where(s => s.EmployeeID == employeeID
                    && s.DeletedAt == null
                    && s.TimeIn >= dayStart && s.TimeIn < dayEnd)
                .OrderBy(s => s.TimeIn)
                .FirstOrDefaultAsync();

            if (shift == null) {
                return new ShiftCheckInResponse {
                    Status = ShiftStatus.Scheduled,
                    HasShift = false,
                    Message = "Không có ca nào để check-out"
                };
            }

            if (shift.CheckOut == null) {
                // Chỉ cho phép check-out khi đã hết giờ tan ca (đến/qua TimeOut).
                if (now < shift.TimeOut) {
                    var remain = (int)Math.Ceiling((shift.TimeOut - now).TotalMinutes);
                    throw new Exception($"Chưa đến giờ tan ca, không thể check-out (còn {remain} phút)");
                }
                shift.CheckOut = now;
                if (shift.Status != ShiftStatus.Late && shift.Status != ShiftStatus.Absent) {
                    shift.Status = ShiftStatus.Completed;
                }
                await _dbContext.SaveChangesAsync();
            }

            var diff = (int)Math.Round((now - shift.TimeOut).TotalMinutes);
            return new ShiftCheckInResponse {
                ShiftID = shift.ShiftID,
                TimeIn = shift.TimeIn,
                TimeOut = shift.TimeOut,
                CheckIn = shift.CheckIn,
                CheckOut = shift.CheckOut,
                Status = shift.Status,
                MinutesDiff = diff,
                HasShift = true,
                Message = "Đã check-out"
            };
        }

        // Xử lý ca đang chạy (đã check-in, chưa check-out) của nhân viên khi họ đăng xuất:
        //  • Chưa đến giờ tan ca (now < TimeOut) ⇒ CHẶN đăng xuất bằng cách ném
        //    InvalidOperationException → ErrorHandlingMiddleware trả 400; controller không
        //    blacklist token nên phiên đăng nhập vẫn còn hiệu lực.
        //  • Đã đến/qua giờ tan ca ⇒ tự động check-out (giờ rời ca = lúc đăng xuất) và đánh dấu
        //    hoàn thành, trừ khi đã bị Late/Absent thì giữ nguyên trạng thái chấm công.
        // Không có ca đang chạy ⇒ trả về false (cho đăng xuất bình thường).
        // Trả về true nếu có ca được tự động đóng.
        public async Task<bool> AutoCheckOutOnLogout(Guid employeeID) {
            var now = VnTime.Now;
            var dayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
            var dayEnd = dayStart.AddDays(1);

            var shift = await _dbContext.Shift
                .Where(s => s.EmployeeID == employeeID
                    && s.DeletedAt == null
                    && s.TimeIn >= dayStart && s.TimeIn < dayEnd
                    && s.CheckIn != null
                    && s.CheckOut == null)
                .OrderBy(s => s.TimeIn)
                .FirstOrDefaultAsync();

            if (shift == null) return false;

            // Chưa hết ca → không cho đăng xuất.
            if (now < shift.TimeOut) {
                var remain = (int)Math.Ceiling((shift.TimeOut - now).TotalMinutes);
                throw new InvalidOperationException(
                    $"Bạn chưa hết ca làm việc, không thể đăng xuất. Ca kết thúc lúc "
                    + $"{shift.TimeOut:HH:mm dd/MM/yyyy} (còn {remain} phút).");
            }

            // Đã hết ca → tự động check-out.
            shift.CheckOut = now;
            if (shift.Status != ShiftStatus.Late && shift.Status != ShiftStatus.Absent) {
                shift.Status = ShiftStatus.Completed;
            }
            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}
