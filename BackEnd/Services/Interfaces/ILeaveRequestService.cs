using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface {
    public interface ILeaveRequestService {
        // Nhân viên xem đơn của mình
        Task<List<LeaveRequestResponse>> GetMyLeaveRequests(Guid employeeID);

        // Manager xem tất cả đơn trong store
        Task<List<LeaveRequestResponse>> GetLeaveRequestsByStore(int storeID);

        // Nhân viên tạo đơn
        Task<LeaveRequestResponse> CreateLeaveRequest(Guid employeeID, LeaveRequestCreateRequest request);

        // Manager duyệt hoặc từ chối
        Task<LeaveRequestResponse> ReviewLeaveRequest(Guid leaveRequestID, Guid managerID, LeaveRequestReviewRequest request);

        // Nhân viên huỷ đơn (chỉ khi còn Pending)
        Task CancelLeaveRequest(Guid leaveRequestID, Guid employeeID);
    }
}
