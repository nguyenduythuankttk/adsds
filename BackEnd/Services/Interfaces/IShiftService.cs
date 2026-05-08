using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface{
    public interface IShiftService{
        Task<List<Shift>?> GetAllShiftIn(DateOnly date);
        //Task<List<Shift>?> GetShiftByEmployee (DateOnly date);
        Task<Shift?> GetShiftByID (Guid ID);
        Task AddShift (ShiftCreateRequest request);
        Task UpdateShift (ShiftUpdateRequest request, Guid shiftID);
        Task SoftDeleteShift(Guid ID);
        Task DeleteShift (Guid ID);
    }
}