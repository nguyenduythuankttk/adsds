using Backend.Data;
using Backend.Models;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Implementations{
    public class PurchaseOrderService : IPurchaseOrderService{
        private readonly AppDbContext _dbContext;
        public PurchaseOrderService (AppDbContext dbContext){
            _dbContext = dbContext;
        }
        public async Task<List<PurchaseOrder>?> GetAllPOIn(DateOnly start, DateOnly end) =>
            await _dbContext.PurchaseOrder
                .AsNoTracking()
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated)
                    .Take(1))
                .Where(po => po.POApproval.Any() &&
                        po.POApproval.Max(poA => poA.LastUpdated) >= start.ToDateTime(TimeOnly.MinValue) &&
                        po.POApproval.Max(poA => poA.LastUpdated) <= end.ToDateTime(TimeOnly.MaxValue))
                .ToListAsync();
        public async Task<PurchaseOrder?> GetPOByID(Guid id) =>
            await _dbContext.PurchaseOrder
                .AsNoTracking()
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated))
                .FirstOrDefaultAsync(po => po.POID == id);
        public async Task CreatePO(POCreateRequest createRequest){
            try {
                var newPO = new PurchaseOrder{
                    StoreID    = createRequest.StoreID,
                    TaxRate    = createRequest.TaxRate,
                    Total      = createRequest.Total
                };
                var newPOA = new POApproval {
                    POID        = newPO.POID,
                    EmployeeID  = createRequest.EmployeeID,
                    LastUpdated = DateTime.UtcNow,
                    Comment     = createRequest.Comment,
                    Status      = PO_Status.Submitted
                };
                _dbContext.PurchaseOrder.Add(newPO);
                _dbContext.POApproval.Add(newPOA);
                await _dbContext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task UpdatePO(Guid id, POUpdateRequest updateRequest){
            try {
                var po = await _dbContext.PurchaseOrder
                    .FirstOrDefaultAsync(po => po.POID == id);
                if (po == null) return;
                var newChange = new POApproval {
                    POID  = id,
                    EmployeeID = updateRequest.EmployeeID,
                    Comment = updateRequest.Comment,
                    LastUpdated = DateTime.UtcNow,
                    Status = updateRequest.Status
                };
                _dbContext.POApproval.Add(newChange);
                await _dbContext.SaveChangesAsync();
            } catch (Exception e){
                Console.WriteLine(e.Message);
            }
        }
        public async Task<List<PurchaseOrder>?> GetAllPOByStore(int storeID) =>
            await _dbContext.PurchaseOrder
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated)
                    .Take(1))
                .Where(po => po.StoreID == storeID)
                .ToListAsync();
        public async Task<List<PurchaseOrder>?> GetAllPOBySupplier(int supplierID) =>
            await _dbContext.PurchaseOrder
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated)
                    .Take(1))
                .Where(po => po.SupplierID == supplierID)
                .ToListAsync();
        public async Task<List<PurchaseOrder>?> GetPOByStatus(PO_Status status) =>
            await _dbContext.PurchaseOrder
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated)
                    .Take(1))
                .Where(po => po.POApproval.Any() &&
                        po.POApproval
                            .OrderByDescending(poA => poA.LastUpdated)
                            .Select(poA => poA.Status)
                            .FirstOrDefault() == status)
                .ToListAsync();
        
        public async Task SoftDeletePO(Guid id){
            var po = await _dbContext.PurchaseOrder
                .FirstOrDefaultAsync(p => p.POID == id &&
                                    p.DeletedAt == null);
            
            if(po == null){
                throw new Exception("Purchase Order not found");
            }

            try{
                po.DeletedAt = DateTime.Now;
                await _dbContext.SaveChangesAsync();
            }catch(Exception ex){
                Console.WriteLine($"Soft delete purchase order error {ex.Message}");
                throw new Exception($"An error occurred while soft deleting purchase order: {ex.Message}");
            }
        }
    }
}