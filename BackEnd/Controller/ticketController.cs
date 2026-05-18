using System.Linq.Expressions;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]

    public class ticketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public ticketController (ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [Authorize]
        [HttpGet("my-tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            try
            {
                var userID = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrWhiteSpace(userID))
                    return Unauthorized();
                var tickets = await _ticketService.GetMyTickets(Guid.Parse(userID));
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in ticketController.GetMyTickets {ex.Message}");
            }
        }

        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllTicketIn(DateOnly start, DateOnly end)
        {
            try
            {
                return Ok(await _ticketService.GetAllTicketIn(start, end));
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in ticketController.GetAllTicket {ex.Message}");
            }
        }

        [HttpGet("get/{ticketID}")]
        public async Task<IActionResult> GetTicketByID(Guid ticketID)
        {
            try
            {
                var ticket = await _ticketService.GetTicketByID(ticketID);
                if (ticket == null)
                    return NotFound("Ticket not found!");

                return Ok(ticket);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in ticketController.GetTicketByID {ex.Message}");
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> AddTicket([FromBody]TicketCreateRequest createRequest)
        {
            try
            {
                await _ticketService.AddTicket(createRequest);
                return Ok("Add ticket sucessfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in ticketController.AddTicket {ex.Message}");
            }
        }

        [HttpPut("update/{ticketID}")]
        public async Task<IActionResult> UpdateTicket(Guid ticketID, TicketUpdateRequest request)
        {
            try
            {
                await _ticketService.UpdateTicket(ticketID, request);
                return Ok("Update ticket sucessfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in ticketController.UpdateTicket {ex.Message}");
            }
        }

        [HttpDelete("Delete/{ticketID}")]
        public async Task<IActionResult> DeleteTicket(Guid ticketID)
        {
            try
            {
                await _ticketService.SoftDeleteTicket(ticketID);
                return Ok("Ticket delete successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in ticketController.TicketDelete {ex.Message}");
            }
        }
    }

}