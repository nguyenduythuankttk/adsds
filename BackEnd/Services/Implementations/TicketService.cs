// add thẳng vào bill
// chỉnh lại hàm get endDate và startDate, nếu end > start thì đổi chỗ 2 biến
using Backend.Services.Interface;
using Backend.Models.DTOs.Request;
using Backend.Models;
using Backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
namespace Backend.Services.Implementations
{
    public class TicketService : ITicketService
    {
        private readonly AppDbContext _dbcontext;
        private readonly IUserService _userService;
        public TicketService (AppDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }
        public async Task <List<Ticket>?> GetAllTicketIn(DateOnly start, DateOnly end) =>
            await _dbcontext.Ticket
            .AsNoTracking()
            .Where( b => b.EndDate >= start &&
                    b.StartDate <= end &&
                    b.DeletedAt == null
                )
            .ToListAsync();

        public async Task <Ticket?> GetTicketByID(Guid ticketID) =>
            await _dbcontext.Ticket
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TicketID == ticketID && t.DeletedAt == null);

        public async Task<List<Ticket>> GetMyTickets(Guid userId) =>
            await _dbcontext.TicketUser
            .AsNoTracking()
            .Where(tu => tu.UserID == userId)
            .Select(tu => tu.Ticket)
            .Where(t => t.DeletedAt == null)
            .ToListAsync();

        public async Task AddTicket(TicketCreateRequest createRequest)
        {
            try
            {
                var newticket = new Ticket
                {
                    TicketID = Guid.NewGuid(),
                    StartDate = createRequest.StartDate,
                    EndDate = createRequest.EndDate,
                    Discount = createRequest.Discount,
                    DeletedAt = null
                };
                _dbcontext.Ticket.Add(newticket);
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Add Ticket error {ex.Message}");
                throw new Exception($"An error occurred while adding ticket {ex.Message}");
            }
            
        }
        public async Task CreateVoucher(TicketCreateRequest createRequest)
        {
            try
            {
                var tickets = new List<Ticket>();
                for (int i = 0; i < createRequest.Qty; i++)
                {
                    var ticket =new Ticket
                    {
                        TicketID = Guid.NewGuid(),
                        StartDate = createRequest.StartDate,
                        EndDate = createRequest.EndDate,
                        Discount = createRequest.Discount,
                        DeletedAt = null
                    };
                    tickets.Add(ticket);
                    _dbcontext.Ticket.Add(ticket);
                }
                var users = await _userService.GetAllUsers();
                int count = users.Count;
                for (int i = 0; i < count; i++){
                    for (int j = 0; j < createRequest.Qty; j++)
                    {
                        var userTicket = new TicketUser
                        {
                            UserID = users[i].UserID,
                            TicketID = tickets[j].TicketID
                        };
                        _dbcontext.TicketUser.Add(userTicket);
                    }
                }
                await _dbcontext.SaveChangesAsync();

            }catch (Exception e)
            {
                throw new Exception("Error in TicketService.CreateTicket" + e.Message);
            }
        }

        public async Task UpdateTicket(Guid ticketID, TicketUpdateRequest request)
        {
            var ticket = await _dbcontext.Ticket.FindAsync(ticketID); 

            if(ticket == null)
            {
                throw new Exception("Ticket not found");
            }

            try
            {
                if(request.StartDate.HasValue)
                    ticket.StartDate = request.StartDate.Value;
                
                if(request.EndDate.HasValue)
                    ticket.EndDate = request.EndDate.Value;

                if(request.Discount.HasValue)
                    ticket.Discount = request.Discount.Value;

                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Update ticket Error {ex.Message}");
                throw new Exception($"An error occurred while updating the ticket: {ex.Message}");
            }
        }

        public async Task SetUsedAt(Guid ticketID, Guid userID)
        {
            var ticket = await _dbcontext.Ticket
                .FirstOrDefaultAsync(t => t.TicketID == ticketID && t.DeletedAt == null);

            if (ticket == null)
                throw new Exception("Ticket not found");
            if (ticket.UsedAt != null)
                throw new Exception("Ticket đã được sử dụng");
            if (ticket.EndDate < DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)))
                throw new Exception("Ticket đã hết hạn");

            try
            {
                ticket.UsedAt = DateTime.UtcNow.AddHours(7);
                ticket.UsedBy = userID;
                await _dbcontext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Lỗi khi đánh dấu ticket đã dùng: {ex.Message}");
            }
        }

        public async Task SoftDeleteTicket(Guid ticketID)
        {
            var ticket = await _dbcontext.Ticket
                .FirstOrDefaultAsync(t => t.TicketID == ticketID &&
                                    t.DeletedAt == null);
            
            if(ticket == null)
            {
                throw new Exception("Ticket not found");
            }
            
            try
            {
                ticket.DeletedAt = DateTime.Now;
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Delete ticket Error {ex.Message}");
                throw new Exception("An error occurred while deleting ticket");
            }
        }
    }
}

