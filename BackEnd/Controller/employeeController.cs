using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class employeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public employeeController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllEmployees()
        {
            var employees = await _employeeService.GetAllEmployees();
            if (employees == null || employees.Count == 0) return NotFound("Employee not found!");
            return Ok(employees);
        }

        [HttpGet("get/{employeeID}")]
        public async Task<IActionResult> GetEmployeeByID(Guid employeeID)
        {
            var employee = await _employeeService.GetEmployeeByID(employeeID);
            if (employee == null) return NotFound("Employee not found!");
            return Ok(employee);
        }

        [HttpGet("get-by-store/{storeID}")]
        public async Task<IActionResult> GetEmployeesByStoreID(int storeID)
        {
            var employees = await _employeeService.GetEmployeesByStoreID(storeID);
            if (employees == null) return NotFound("Employee in store not found!");
            return Ok(employees);
        }

        [HttpGet("get-manager/{storeID}")]
        public async Task<IActionResult> GetManagerByStoreID(int storeID)
        {
            var manager = await _employeeService.GetManagerByStoreID(storeID);
            if (manager == null) return NotFound("Không tìm thấy manager cho cửa hàng này");
            return Ok(manager);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddEmployee([FromBody] EmployeeCreateRequest request)
        {
            await _employeeService.AddEmployee(request);
            return Ok("Add employee successfully!");
        }

        [HttpPut("Update/{employeeID}")]
        public async Task<IActionResult> UpdateEmployee(Guid employeeID, [FromBody] EmployeeUpdateRequest request)
        {
            await _employeeService.UpdateEmployee(employeeID, request);
            return Ok("Update employee successfully!");
        }

        [HttpDelete("Delete/{employeeID}")]
        public async Task<IActionResult> SoftDeleteEmployee(Guid employeeID)
        {
            await _employeeService.SoftDeleteEmployee(employeeID);
            return Ok("Delete employee successfully!");
        }
    }
}
