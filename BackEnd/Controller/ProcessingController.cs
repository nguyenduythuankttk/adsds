using Backend.Models.DTOs.Request;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class ProcessingController : ControllerBase
    {
        private readonly IProcessingService _processingService;

        public ProcessingController(IProcessingService processingService)
        {
            _processingService = processingService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateProcessing(CreateProcessingRequest request)
        {
            try
            {
                var result = await _processingService.CreateProcessing(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in ProcessingController.CreateProcessing: {ex.Message}");
            }
        }

        [HttpGet("getid/{processingID}")]
        public async Task<IActionResult> GetProcessingByID(Guid processingID)
        {
            try
            {
                var result = await _processingService.GetProcessingByID(processingID);
                if (result == null)
                    return NotFound("Processing log not found.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in ProcessingController.GetProcessingByID: {ex.Message}");
            }
        }

        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllProcessing(DateOnly start, DateOnly end)
        {
            try
            {
                var result = await _processingService.GetAllProcessing(start, end);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in ProcessingController.GetAllProcessing: {ex.Message}");
            }
        }

        [HttpDelete("delete/{processingID}/{employeeID}")]
        public async Task<IActionResult> DeleteProcessing(Guid processingID, Guid employeeID)
        {
            try
            {
                await _processingService.DeleteProcessing(processingID, employeeID);
                return Ok("Processing log soft-deleted successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in ProcessingController.DeleteProcessing: {ex.Message}");
            }
        }
    }
}
