using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using BackEnd.Migrations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace Backend.Services.Implementations
{
    public class SupplierService : ISupplierService
    {
        private readonly AppDbContext _dbcontext;
        public SupplierService(AppDbContext dbContext)
        {
            _dbcontext = dbContext;
        }
        public async Task<List<SupplierResponse>?> GetAllSuppliers() =>
            await _dbcontext.Supplier
                .Where(s => s.DeletedAt == null)
                .AsNoTracking()
                .Include(s => s.Address)
                .Select(s => new SupplierResponse
                {
                    SupplierID = s.SupplierID,
                    SupplierName = s.SupplierName,
                    Phone = s.Phone,
                    Email = s.Email,
                    TaxCode = s.TaxCode,
                    Address = new AddressResponse
                    {
                        AddressID = s.Address.AddressID,
                        HouseNumber = s.Address.HouseNumber,
                        Street = s.Address.Street,
                        Ward = s.Address.Ward,
                        District = s.Address.District,
                        Province = s.Address.Province,
                        Country = s.Address.Country
                    }
                })
                .ToListAsync();

        public async Task<SupplierResponse?> GetSupplierByID(int supplierID) =>
            await _dbcontext.Supplier
                .Where(s => s.SupplierID == supplierID && s.DeletedAt == null)
                .AsNoTracking()
                .Include(s => s.Address)
                .Select(s => new SupplierResponse
                {
                    SupplierID = s.SupplierID,
                    SupplierName = s.SupplierName,
                    Phone = s.Phone,
                    Email = s.Email,
                    TaxCode = s.TaxCode,
                    Address = new AddressResponse
                    {
                        AddressID = s.Address.AddressID,
                        HouseNumber = s.Address.HouseNumber,
                        Street = s.Address.Street,
                        Ward = s.Address.Ward,
                        District = s.Address.District,
                        Province = s.Address.Province,
                        Country = s.Address.Country
                    }
                })
                .FirstOrDefaultAsync();


        public async Task AddSupplier(SupplierCreateRequest createRequest)
        {
            try
            {
                var supplier = new Supplier
                {
                    SupplierName = createRequest.SupplierName,
                    Phone = createRequest.Phone,
                    Email = createRequest.Email,
                    TaxCode = createRequest.TaxCode,
                    DeletedAt = null

                };
                _dbcontext.Supplier.Add(supplier);
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Add Supplier Error: {ex.Message}");
                throw new Exception($"An error occurred while adding supplier {ex.Message}");
            }
        }

        public async Task UpdateSupplier(int supplierID, SupplierUpdateRequest updateRequest)
        {
            var supplier = await _dbcontext.Supplier.FindAsync(supplierID);

            if(supplier == null)
            {
                throw new Exception("Supplier not found");
            }

            try
            {
                if(updateRequest.SupplierName != null)
                    supplier.SupplierName = updateRequest.SupplierName;
                
                if(updateRequest.Phone != null)
                    supplier.Phone = updateRequest.Phone;

                if(updateRequest.Email != null)
                    supplier.Email = updateRequest.Email;

                if(updateRequest.TaxCode != null)
                    supplier.TaxCode = updateRequest.TaxCode;

                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Update supplier error: {ex.Message}");
                throw new Exception($"An error occurred while updating the user: {ex.Message}");
            }
        }

        public async Task SoftDeleteSupplier(int supplierID)
        {
            var supplier = await _dbcontext.Supplier
                .FirstOrDefaultAsync(s => s.SupplierID == supplierID &&
                                    s.DeletedAt == null);
            
            if(supplier == null)
            {
                throw new Exception("Supplier not found");
            }

            try
            {
                supplier.DeletedAt = DateTime.Now;
                await _dbcontext.SaveChangesAsync();
            }catch(Exception ex)
            {
                Console.WriteLine($"Delete supplier error {ex.Message}");
                throw new Exception($"An errorr occurred while deleting supplier: {ex.Message} ");
            }
        }
    }
}