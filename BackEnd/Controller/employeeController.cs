using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
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
            try
            {
                var employees = await _employeeService.GetAllEmployees();
                if (employees == null || employees.Count == 0)
                    return NotFound("Employee not found!");
                return Ok(employees);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in employeeController.GetAllEmployees: {ex.Message}");
            }
        }

        [HttpGet("get/{employeeID}")]
        public async Task<IActionResult> GetEmployeeByID(Guid employeeID)
        {
            try
            {
                var employee = await _employeeService.GetEmployeeByID(employeeID);
                if (employee == null)
                    return NotFound("Employee not found!");

                return Ok(employee);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in employeeController.GetEmployeeByID: {ex.Message}");
            }
        }

        [HttpGet("get-by-store/{storeID}")]
        public async Task<IActionResult> GetEmployeesByStoreID(int storeID)
        {
            try
            {
                var employees = await _employeeService.GetEmployeesByStoreID(storeID);
                if (employees == null)
                    return NotFound("Employee in store not found!");

                return Ok(employees);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in employeeController.GetEmployeesByStoreID: {ex.Message}");
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddEmployee([FromBody] EmployeeCreateRequest request)
        {
            try
            {
                await _employeeService.AddEmployee(request);
                return Ok("Add employee successfully!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in employeeController.AddEmployee: {ex.Message}");
            }
        }

        [HttpPut("Update/{employeeID}")]
        public async Task<IActionResult> UpdateEmployee(Guid employeeID, [FromBody] EmployeeUpdateRequest request)
        {
            try
            {
                await _employeeService.UpdateEmployee(employeeID, request);
                return Ok("Update employee successfully!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in employeeController.UpdateEmployee: {ex.Message}");
            }
        }

        [HttpDelete("Delete/{employeeID}")]
        public async Task<IActionResult> SoftDeleteEmployee(Guid employeeID)
        {
            try
            {
                await _employeeService.SoftDeleteEmployee(employeeID);
                return Ok("Delete employee successfully!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in employeeController.SoftDeleteEmployee: {ex.Message}");
            }
        }
    }
}
