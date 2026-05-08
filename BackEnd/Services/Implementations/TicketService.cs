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
        public TicketService (AppDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }
        public async Task <List<Ticket>?> GetAllTicketIn(DateOnly start, DateOnly end) =>
            await _dbcontext.Ticket
            .AsNoTracking()
            .Where( b => b.EndDate >= start.ToDateTime(TimeOnly.MinValue) &&
                    b.StartDate <= end.ToDateTime(TimeOnly.MaxValue) &&
                    b.DeletedAt == null
                )
            .ToListAsync();

        public async Task <Ticket?> GetTicketByID(Guid ticketID) =>
            await _dbcontext.Ticket
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TicketID == ticketID && t.DeletedAt == null);

        public async Task AddTicket(TicketCreateRequest createRequest)
        {
            try
            {
                var startDate  = createRequest.StartDate.Date;  
                var endDate = createRequest.EndDate.Date;       
                var newticket = new Ticket
                {
                    TicketID = Guid.NewGuid(),
                    StartDate = new DateTime(startDate.Year, startDate.Month, startDate.Day, 0, 0, 0),  // 00:00:00
                    EndDate = new DateTime(endDate.Year, endDate.Month, endDate.Day, 23, 59, 59),      // 23:59:59
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

