using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Data;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.Implementations{
    public class ShiftService : IShiftService{
        private readonly AppDbContext _dbContext;
        public ShiftService (AppDbContext dbContext){
            _dbContext = dbContext;
        }
        public async Task<List<Shift>?> GetAllShiftIn(DateOnly date) =>
            await _dbContext.Shift.Where (s => s.TimeIn >= date.ToDateTime(TimeOnly.MinValue) &&  s.TimeIn <= date.ToDateTime(TimeOnly.MaxValue))
            .Include(s => s.Employee)
            .ToListAsync();

        public async Task<Shift?> GetShiftByID (Guid ID) =>
            await _dbContext.Shift
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.ShiftID == ID);

        public async Task AddShift (ShiftCreateRequest request) {
            try {
                /*if (request.TimeIn > request.TimeOut){
                    DateTime x = request.TimeIn;
                    request.TimeIn = request.TimeOut;
                    request.TimeOut = x;
                }*/
                var newShift = new Shift {
                    TimeIn = request.TimeIn,
                    TimeOut = request.TimeOut,
                    EmployeeID = request.EmployeeID
                };
                _dbContext.Shift.Add(newShift);
                await _dbContext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine (e.Message);
            }
        }

        public async Task UpdateShift (ShiftUpdateRequest request, Guid shiftID){
            try{
                var shift = await _dbContext.Shift.FirstOrDefaultAsync(s => s.ShiftID == shiftID);
                if (shift != null){
                    shift.CheckIn = request.CheckIn;
                    shift.CheckOut = request.CheckOut;
                    _dbContext.Shift.Update(shift);
                    await _dbContext.SaveChangesAsync();
                }
            } catch (Exception e){
                Console.WriteLine (e.Message);
            }
        }

        public async Task SoftDeleteShift (Guid ID){
            var shift = await _dbContext.Shift
                .FirstOrDefaultAsync(s => s.ShiftID == ID &&
                                    s.DeletedAt == null);

            if(shift == null){
                throw new Exception("Shift not found");
            }

            try{
                shift.DeletedAt = DateTime.Now;
                await _dbContext.SaveChangesAsync();
            }catch (Exception e){
                Console.WriteLine(e.Message);
                throw new Exception($"An error occurred while soft deleting shift: {e.Message}");
            }
        }
            
    }
}