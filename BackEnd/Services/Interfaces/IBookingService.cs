using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Request;
namespace Backend.Services.Interface
{
    public interface IBookingService
    {
        Task<List<Booking>?> GetAllBooking(DateOnly end);
        Task<List<Booking>?> GetBookingByUser(Guid user);
        Task<Booking?> GetBookingByID(Guid bookingID);
        Task AddBooking(Booking booking);
        Task SoftDeleteBooking(Guid bookingID);
    }
}
