using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations {
    public class ShiftTaskService : IShiftTaskService {
        private readonly AppDbContext _db;
        public ShiftTaskService(AppDbContext db) => _db = db;

        public async Task<List<ShiftTask>> GetTasksByShiftID(Guid shiftID) =>
            await _db.ShiftTask
                .Where(t => t.ShiftID == shiftID)
                .Include(t => t.CreatedBy)
                .Include(t => t.CompletedBy)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();

        public async Task<ShiftTask> AddTask(ShiftTaskCreateRequest request, Guid createdByID) {
            var shift = await _db.Shift.FirstOrDefaultAsync(s => s.ShiftID == request.ShiftID && s.DeletedAt == null)
                ?? throw new Exception("Không tìm thấy ca làm việc");

            var task = new ShiftTask {
                TaskID = Guid.NewGuid(),
                ShiftID = request.ShiftID,
                Title = request.Title.Trim(),
                IsCompleted = false,
                CreatedByID = createdByID,
                CreatedAt = DateTime.Now
            };
            _db.ShiftTask.Add(task);
            await _db.SaveChangesAsync();
            return task;
        }

        public async Task CompleteTask(Guid taskID, Guid completedByID) {
            var task = await _db.ShiftTask.FirstOrDefaultAsync(t => t.TaskID == taskID)
                ?? throw new Exception("Không tìm thấy nhiệm vụ");

            task.IsCompleted = true;
            task.CompletedAt = DateTime.Now;
            task.CompletedByID = completedByID;
            await _db.SaveChangesAsync();
        }

        public async Task DeleteTask(Guid taskID) {
            var task = await _db.ShiftTask.FirstOrDefaultAsync(t => t.TaskID == taskID)
                ?? throw new Exception("Không tìm thấy nhiệm vụ");
            _db.ShiftTask.Remove(task);
            await _db.SaveChangesAsync();
        }
    }
}
