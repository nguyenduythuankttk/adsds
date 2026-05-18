using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class ticketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public ticketController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [Authorize]
        [HttpGet("my-tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var tickets = await _ticketService.GetMyTickets(ClaimsHelper.GetUserId(User));
            return Ok(tickets);
        }

        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllTicketIn(DateOnly start, DateOnly end)
        {
            return Ok(await _ticketService.GetAllTicketIn(start, end));
        }

        [HttpGet("get/{ticketID}")]
        public async Task<IActionResult> GetTicketByID(Guid ticketID)
        {
            var ticket = await _ticketService.GetTicketByID(ticketID);
            if (ticket == null) return NotFound("Ticket not found!");
            return Ok(ticket);
        }

        [HttpPost("create")]
        public async Task<IActionResult> AddTicket([FromBody] TicketCreateRequest createRequest)
        {
            await _ticketService.AddTicket(createRequest);
            return Ok("Add ticket successfully!");
        }

        [HttpPut("update/{ticketID}")]
        public async Task<IActionResult> UpdateTicket(Guid ticketID, TicketUpdateRequest request)
        {
            await _ticketService.UpdateTicket(ticketID, request);
            return Ok("Update ticket successfully!");
        }

        [HttpDelete("Delete/{ticketID}")]
        public async Task<IActionResult> DeleteTicket(Guid ticketID)
        {
            await _ticketService.SoftDeleteTicket(ticketID);
            return Ok("Ticket delete successfully!");
        }
    }
}
