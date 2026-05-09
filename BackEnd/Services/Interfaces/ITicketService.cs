using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;

namespace Backend.Services.Interface{
    public interface ITicketService {
        Task <List<Ticket>?> GetAllTicketIn(DateOnly start, DateOnly end);
        Task <Ticket?> GetTicketByID(Guid ticketID);
        Task AddTicket(TicketCreateRequest createRequest);
        Task UpdateTicket(Guid ticketID, TicketUpdateRequest request);
        Task SoftDeleteTicket(Guid ticketID);
        Task SetUsedAt(Guid ticketID, Guid userID);
    }
}