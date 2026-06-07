using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface{
    public interface IShiftService{
        Task<List<ShiftResponse>> GetAllShiftIn(DateOnly date);
        Task<ShiftResponse?> GetShiftByID(Guid ID);
        Task<List<ShiftResponse>> GetShiftsByStore(int storeID, DateOnly start, DateOnly end);
        Task<List<ShiftResponse>> GetShiftsByEmployee(Guid employeeID, DateOnly start, DateOnly end);
        Task AddShift(ShiftCreateRequest request);
        Task<ShiftResponse> AssignShift(int storeID, ShiftAssignRequest request);
        Task UpdateShift(ShiftUpdateRequest request, Guid shiftID);
        Task SoftDeleteShift(Guid ID);
        Task<ShiftCheckInResponse> CheckInForEmployee(Guid employeeID);
        Task<ShiftCheckInResponse> CheckOutForEmployee(Guid employeeID);
        Task<bool> AutoCheckOutOnLogout(Guid employeeID);
    }
}
