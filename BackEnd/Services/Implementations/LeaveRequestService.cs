using Backend.Data;
using Backend.Helpers;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations {
    public class LeaveRequestService : ILeaveRequestService {
        private readonly AppDbContext _db;

        public LeaveRequestService(AppDbContext db) {
            _db = db;
        }

        private static LeaveRequestResponse Project(LeaveRequest lr) => new() {
            LeaveRequestID = lr.LeaveRequestID,
            EmployeeID     = lr.EmployeeID,
            EmployeeName   = lr.Employee?.FullName ?? "",
            StoreID        = lr.Employee?.StoreID ?? 0,
            LeaveDate      = lr.LeaveDate,
            Reason         = lr.Reason,
            Status         = lr.Status,
            ReviewedByID   = lr.ReviewedByID,
            ReviewedByName = lr.ReviewedBy?.FullName,
            ReviewedAt     = lr.ReviewedAt,
            ReviewNote     = lr.ReviewNote,
            CreatedAt      = lr.CreatedAt
        };

        public async Task<List<LeaveRequestResponse>> GetMyLeaveRequests(Guid employeeID) =>
            await _db.LeaveRequest
                .AsNoTracking()
                .Where(lr => lr.EmployeeID == employeeID && lr.DeletedAt == null)
                .Include(lr => lr.Employee)
                .Include(lr => lr.ReviewedBy)
                .OrderByDescending(lr => lr.CreatedAt)
                .Select(lr => new LeaveRequestResponse {
                    LeaveRequestID = lr.LeaveRequestID,
                    EmployeeID     = lr.EmployeeID,
                    EmployeeName   = lr.Employee.FullName,
                    StoreID        = lr.Employee.StoreID,
                    LeaveDate      = lr.LeaveDate,
                    Reason         = lr.Reason,
                    Status         = lr.Status,
                    ReviewedByID   = lr.ReviewedByID,
                    ReviewedByName = lr.ReviewedBy != null ? lr.ReviewedBy.FullName : null,
                    ReviewedAt     = lr.ReviewedAt,
                    ReviewNote     = lr.ReviewNote,
                    CreatedAt      = lr.CreatedAt
                })
                .ToListAsync();

        public async Task<List<LeaveRequestResponse>> GetLeaveRequestsByStore(int storeID) =>
            await _db.LeaveRequest
                .AsNoTracking()
                .Where(lr => lr.Employee.StoreID == storeID && lr.DeletedAt == null)
                .Include(lr => lr.Employee)
                .Include(lr => lr.ReviewedBy)
                .OrderByDescending(lr => lr.CreatedAt)
                .Select(lr => new LeaveRequestResponse {
                    LeaveRequestID = lr.LeaveRequestID,
                    EmployeeID     = lr.EmployeeID,
                    EmployeeName   = lr.Employee.FullName,
                    StoreID        = lr.Employee.StoreID,
                    LeaveDate      = lr.LeaveDate,
                    Reason         = lr.Reason,
                    Status         = lr.Status,
                    ReviewedByID   = lr.ReviewedByID,
                    ReviewedByName = lr.ReviewedBy != null ? lr.ReviewedBy.FullName : null,
                    ReviewedAt     = lr.ReviewedAt,
                    ReviewNote     = lr.ReviewNote,
                    CreatedAt      = lr.CreatedAt
                })
                .ToListAsync();

        public async Task<LeaveRequestResponse> CreateLeaveRequest(Guid employeeID, LeaveRequestCreateRequest request) {
            var employee = await _db.Employee
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserID == employeeID && e.DeleteAt == null)
                ?? throw new Exception("Nhân viên không tồn tại");

            // Không cho phép xin nghỉ ngày đã qua
            if (request.LeaveDate < DateOnly.FromDateTime(VnTime.Now))
                throw new Exception("Không thể xin nghỉ cho ngày đã qua");

            // Kiểm tra đã có đơn cho ngày này chưa
            var existed = await _db.LeaveRequest.AnyAsync(lr =>
                lr.EmployeeID == employeeID &&
                lr.LeaveDate == request.LeaveDate &&
                lr.Status != LeaveStatus.Rejected &&
                lr.DeletedAt == null);
            if (existed)
                throw new Exception("Bạn đã có đơn xin nghỉ cho ngày này");

            var leave = new LeaveRequest {
                LeaveRequestID = Guid.NewGuid(),
                EmployeeID     = employeeID,
                LeaveDate      = request.LeaveDate,
                Reason         = request.Reason,
                Status         = LeaveStatus.Pending,
                CreatedAt      = VnTime.Now
            };
            _db.LeaveRequest.Add(leave);
            await _db.SaveChangesAsync();

            // Reload để lấy navigation
            var created = await _db.LeaveRequest
                .Include(lr => lr.Employee)
                .FirstAsync(lr => lr.LeaveRequestID == leave.LeaveRequestID);
            return Project(created);
        }

        public async Task<LeaveRequestResponse> ReviewLeaveRequest(Guid leaveRequestID, Guid managerID, LeaveRequestReviewRequest request) {
            if (request.Status == LeaveStatus.Pending)
                throw new Exception("Trạng thái duyệt phải là Approved hoặc Rejected");

            var leave = await _db.LeaveRequest
                .Include(lr => lr.Employee)
                .Include(lr => lr.ReviewedBy)
                .FirstOrDefaultAsync(lr => lr.LeaveRequestID == leaveRequestID && lr.DeletedAt == null)
                ?? throw new Exception("Không tìm thấy đơn xin nghỉ");

            if (leave.Status != LeaveStatus.Pending)
                throw new Exception("Đơn này đã được xử lý rồi");

            // Manager chỉ được duyệt đơn trong store của mình
            var manager = await _db.Employee
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserID == managerID && e.DeleteAt == null)
                ?? throw new Exception("Manager không tồn tại");

            if (manager.StoreID != leave.Employee.StoreID)
                throw new Exception("Bạn không có quyền duyệt đơn của nhân viên cửa hàng khác");

            leave.Status      = request.Status;
            leave.ReviewedByID = managerID;
            leave.ReviewedAt  = VnTime.Now;
            leave.ReviewNote  = request.ReviewNote;
            await _db.SaveChangesAsync();

            return Project(leave);
        }

        public async Task CancelLeaveRequest(Guid leaveRequestID, Guid employeeID) {
            var leave = await _db.LeaveRequest
                .FirstOrDefaultAsync(lr => lr.LeaveRequestID == leaveRequestID && lr.DeletedAt == null)
                ?? throw new Exception("Không tìm thấy đơn xin nghỉ");

            if (leave.EmployeeID != employeeID)
                throw new Exception("Bạn không có quyền huỷ đơn này");

            if (leave.Status != LeaveStatus.Pending)
                throw new Exception("Chỉ có thể huỷ đơn đang chờ duyệt");

            leave.DeletedAt = VnTime.Now;
            await _db.SaveChangesAsync();
        }
    }
}
