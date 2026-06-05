using Backend.Models;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interface {
    public interface IShiftTaskService {
        Task<List<ShiftTask>> GetTasksByShiftID(Guid shiftID);
        Task<ShiftTask> AddTask(ShiftTaskCreateRequest request, Guid createdByID);
        Task CompleteTask(Guid taskID, Guid completedByID);
        Task DeleteTask(Guid taskID);
    }
}
