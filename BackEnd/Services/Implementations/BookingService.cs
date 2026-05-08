using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly AppDbContext _dbcontext;
        
        public BookingService(AppDbContext dbContext)
        {
            _dbcontext = dbContext;
        }

        public async Task<List<Booking>?> GetAllBooking(DateOnly end) =>
            await _dbcontext.Booking
            .Where(b => b.ScheduledTime <= end.ToDateTime(TimeOnly.MaxValue))
            .Include(b => b.User)
            .Include(b => b.Table)
            .ToListAsync();

        public async Task<List<Booking>?> GetBookingByUser(Guid user) =>
            await _dbcontext.Booking
            .Where(b => b.UserID == user)
            .Include(b => b.User)
            .Include(b => b.Table)
            .ToListAsync();

        public async Task<Booking?> GetBookingByID(Guid bookingID) =>
            await _dbcontext.Booking
            .Include(b => b.User)
            .Include(b => b.Table)
            .FirstOrDefaultAsync(b => b.BookingID == bookingID);

        public async Task AddBooking(Booking booking){
            try{
                _dbcontext.Booking.Add(booking);
                await _dbcontext.SaveChangesAsync();
            }catch(Exception e){
                Console.WriteLine(e.Message);
            }
        }

        public async Task SoftDeleteBooking(Guid bookingID){
            var booking = await _dbcontext.Booking
                .FirstOrDefaultAsync(b => b.BookingID == bookingID &&
                                    b.DeletedAt == null);
            
            if(booking == null){
                throw new Exception("Booking not found");
            }

            try{
                booking.DeletedAt = DateTime.Now;
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine($"Soft delete booking error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting booking: {ex.Message}");
            }
        }
    }
}
