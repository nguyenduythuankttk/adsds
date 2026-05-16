using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class EmployeeService : IEmployeeService
    {
        private readonly AppDbContext _dbContext;
        private readonly IPasswordHasher<User> _passwordHasher;

        public EmployeeService(AppDbContext dbContext, IPasswordHasher<User> passwordHasher)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
        }

        // Get all employees
        public async Task<List<EmployeeResponse>?> GetAllEmployees() =>
            await _dbContext.Employee
                .Where(e => e.DeleteAt == null)
                .AsNoTracking()
                .Include(e => e.Store)
                    .ThenInclude(s => s.Address)
                .Select(e => new EmployeeResponse
                {
                    UserID = e.UserID,
                    UserName = e.UserName,
                    Email = e.Email,
                    Phone = e.Phone,
                    FullName = e.FullName,
                    Gender = e.Gender,
                    Birthday = e.BirthDate,
                    Role = e.Role,
                    StoreID = e.StoreID,
                    BasicSalary = e.BasicSalary,
                    Store = new StoreResponse
                    {
                        StoreID = e.Store.StoreID,
                        StoreName = e.Store.StoreName,
                        Phone = e.Store.Phone,
                        Email = e.Store.Email,
                        TotalReviews = e.Store.TotalReviews,
                        TotalPoints = e.Store.TotalPoints,
                        SeatingCapacity = e.Store.SeatingCapacity,
                        Address = new AddressResponse
                        {
                            AddressID = e.Store.Address.AddressID,
                            HouseNumber = e.Store.Address.HouseNumber,
                            Street = e.Store.Address.Street,
                            Ward = e.Store.Address.Ward,
                            District = e.Store.Address.District,
                            Province = e.Store.Address.Province,
                            Country = e.Store.Address.Country
                        }
                    }
                })
                .ToListAsync();

        public async Task<EmployeeResponse?> GetEmployeeByID(Guid employeeID) =>
            await _dbContext.Employee
                .Where(e => e.UserID == employeeID && e.DeleteAt == null)
                .AsNoTracking()
                .Include(e => e.Store)
                    .ThenInclude(s => s.Address)
                .Select(e => new EmployeeResponse
                {
                    UserID = e.UserID,
                    UserName = e.UserName,
                    Email = e.Email,
                    Phone = e.Phone,
                    FullName = e.FullName,
                    Gender = e.Gender,
                    Birthday = e.BirthDate,
                    Role = e.Role,
                    StoreID = e.StoreID,
                    BasicSalary = e.BasicSalary,
                    Store = new StoreResponse
                    {
                        StoreID = e.Store.StoreID,
                        StoreName = e.Store.StoreName,
                        Phone = e.Store.Phone,
                        Email = e.Store.Email,
                        TotalReviews = e.Store.TotalReviews,
                        TotalPoints = e.Store.TotalPoints,
                        SeatingCapacity = e.Store.SeatingCapacity,
                        Address = new AddressResponse
                        {
                            AddressID = e.Store.Address.AddressID,
                            HouseNumber = e.Store.Address.HouseNumber,
                            Street = e.Store.Address.Street,
                            Ward = e.Store.Address.Ward,
                            District = e.Store.Address.District,
                            Province = e.Store.Address.Province,
                            Country = e.Store.Address.Country
                        }
                    }
                })
                .FirstOrDefaultAsync();

        public async Task<List<EmployeeResponse>?> GetEmployeesByStoreID(int storeID) =>
            await _dbContext.Employee
                .Where(e => e.StoreID == storeID && e.DeleteAt == null)
                .AsNoTracking()
                .Include(e => e.Store)
                    .ThenInclude(s => s.Address)
                .Select(e => new EmployeeResponse
                {
                    UserID = e.UserID,
                    UserName = e.UserName,
                    Email = e.Email,
                    Phone = e.Phone,
                    FullName = e.FullName,
                    Gender = e.Gender,
                    Birthday = e.BirthDate,
                    Role = e.Role,
                    StoreID = e.StoreID,
                    BasicSalary = e.BasicSalary,
                    Store = new StoreResponse
                    {
                        StoreID = e.Store.StoreID,
                        StoreName = e.Store.StoreName,
                        Phone = e.Store.Phone,
                        Email = e.Store.Email,
                        TotalReviews = e.Store.TotalReviews,
                        TotalPoints = e.Store.TotalPoints,
                        SeatingCapacity = e.Store.SeatingCapacity,
                        Address = new AddressResponse
                        {
                            AddressID = e.Store.Address.AddressID,
                            HouseNumber = e.Store.Address.HouseNumber,
                            Street = e.Store.Address.Street,
                            Ward = e.Store.Address.Ward,
                            District = e.Store.Address.District,
                            Province = e.Store.Address.Province,
                            Country = e.Store.Address.Country
                        }
                    }
                })
                .ToListAsync();

        public async Task AddEmployee(EmployeeCreateRequest request)
        {
            try
            {
                var employee = new Employee
                {
                    UserID = Guid.NewGuid(),
                    UserName = request.UserName,
                    HashPassword = _passwordHasher.HashPassword(new Employee(), request.HashPassword),
                    BirthDate = request.BirthDate,
                    Email = request.Email,
                    Phone = request.Phone,
                    FullName = request.FullName,
                    Gender = request.Gender,
                    Role = request.Role,
                    StoreID = request.StoreID,
                    BasicSalary = request.BasicSalary,
                    CreateAt = DateTime.UtcNow
                };

                _dbContext.Employee.Add(employee);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddEmployee: {ex.Message}");
                throw;
            }
        }

        public async Task UpdateEmployee(Guid employeeID, EmployeeUpdateRequest request)
        {
            var employee = await _dbContext.Employee.FindAsync(employeeID);

            if (employee == null)
                throw new Exception("Employee not found");

            try
            {
                if (!string.IsNullOrEmpty(request.UserName))
                    employee.UserName = request.UserName;

                if (!string.IsNullOrEmpty(request.HashPassword))
                    employee.HashPassword = _passwordHasher.HashPassword(employee, request.HashPassword);

                if (request.BirthDate.HasValue)
                    employee.BirthDate = request.BirthDate.Value;

                if (!string.IsNullOrEmpty(request.Email))
                    employee.Email = request.Email;

                if (!string.IsNullOrEmpty(request.Phone))
                    employee.Phone = request.Phone;

                if (!string.IsNullOrEmpty(request.FullName))
                    employee.FullName = request.FullName;

                if (request.Gender.HasValue)
                    employee.Gender = request.Gender.Value;

                if (request.Role.HasValue)
                    employee.Role = request.Role.Value;

                if (request.StoreID.HasValue)
                    employee.StoreID = request.StoreID.Value;

                if (request.BasicSalary.HasValue)
                    employee.BasicSalary = request.BasicSalary.Value;

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateEmployee: {ex.Message}");
                throw;
            }
        }

        public async Task SoftDeleteEmployee(Guid employeeID)
        {
            var employee = await _dbContext.Employee.FindAsync(employeeID);

            if (employee == null)
                throw new Exception("Employee not found");

            try
            {
                employee.DeleteAt = DateTime.UtcNow.AddHours(7);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SoftDeleteEmployee: {ex.Message}");
                throw;
            }
        }
    }
}
