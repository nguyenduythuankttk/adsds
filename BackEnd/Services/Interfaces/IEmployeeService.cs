using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;

namespace Backend.Services.Interface
{
    public interface IEmployeeService
    {
        Task<List<EmployeeResponse>?> GetAllEmployees();
        Task<EmployeeResponse?> GetEmployeeByID(Guid employeeID);
        Task<List<EmployeeResponse>?> GetEmployeesByStoreID(int storeID);
        Task AddEmployee(EmployeeCreateRequest request);
        Task UpdateEmployee(Guid employeeID, EmployeeUpdateRequest request);
        Task SoftDeleteEmployee(Guid employeeID);
    }
}
