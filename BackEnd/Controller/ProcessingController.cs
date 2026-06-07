using Backend.Helpers;
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
            var result = await _processingService.CreateProcessing(request);
            return Ok(result);
        }

        [HttpGet("getid/{processingID}")]
        public async Task<IActionResult> GetProcessingByID(Guid processingID)
        {
            var result = await _processingService.GetProcessingByID(processingID);
            if (result == null) return NotFound("Processing log not found.");
            return Ok(result);
        }

        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllProcessing(DateOnly start, DateOnly end, [FromQuery] int? storeID = null)
        {
            // Nhân viên chỉ thấy log sơ chế của store mình (log ⇒ nhân viên thực hiện ⇒ store).
            return Ok(await _processingService.GetAllProcessing(start, end, User.GetStoreID() ?? storeID));
        }

        [HttpDelete("delete/{processingID}/{employeeID}")]
        public async Task<IActionResult> DeleteProcessing(Guid processingID, Guid employeeID)
        {
            await _processingService.DeleteProcessing(processingID, employeeID);
            return Ok("Processing log soft-deleted successfully.");
        }
    }
}
