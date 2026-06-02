using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class comboController : ControllerBase
    {
        private readonly IComboService _comboService;

        public comboController(IComboService comboService)
        {
            _comboService = comboService;
        }

        [HttpGet("detail/{comboID}")]
        public async Task<IActionResult> GetComboDetail(int comboID)
        {
            try
            {
                var detail = await _comboService.GetComboDetail(comboID);
                return Ok(detail);
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Manager")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateCombo(ComboCreateRequest request)
        {
            try
            {
                await _comboService.CreateNewCombo(request);
                return Ok("Combo created successfully!");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
