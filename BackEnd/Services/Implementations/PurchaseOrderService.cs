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
                .Where(po => po.DeletedAt == null &&
                        po.POApproval.Any() &&
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
                .FirstOrDefaultAsync(po => po.POID == id && po.DeletedAt == null);
        public async Task<POCreateResponse> CreatePO(POCreateRequest createRequest){
            if (createRequest.Items == null || createRequest.Items.Count == 0)
                throw new Exception("PO must have at least one item.");

            if (createRequest.TaxRate < 0)
                throw new Exception("TaxRate cannot be negative.");

            var duplicateIDs = createRequest.Items
                .GroupBy(i => i.IngredientID)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();
            if (duplicateIDs.Count > 0)
                throw new Exception($"Duplicate IngredientID(s) in PO: {string.Join(", ", duplicateIDs)}");

            foreach (var item in createRequest.Items)
            {
                if (item.Quantity <= 0)
                    throw new Exception($"IngredientID {item.IngredientID}: Quantity must be > 0.");
                if (item.UnitPriceExpected <= 0)
                    throw new Exception($"IngredientID {item.IngredientID}: UnitPriceExpected must be > 0.");
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try {
                decimal subtotal = createRequest.Items.Sum(i => i.Quantity * i.UnitPriceExpected);
                decimal total = subtotal * (1 + createRequest.TaxRate);

                var newPO = new PurchaseOrder{
                    StoreID    = createRequest.StoreID,
                    SupplierID = createRequest.SupplierID,
                    TaxRate    = createRequest.TaxRate,
                    Total      = total
                };

                var details = createRequest.Items.Select(i => new PODetail{
                    POID              = newPO.POID,
                    IngredientID      = i.IngredientID,
                    Quantity          = i.Quantity,
                    UnitPriceExpected = i.UnitPriceExpected
                }).ToList();

                var approval = new POApproval{
                    POID        = newPO.POID,
                    EmployeeID  = createRequest.EmployeeID,
                    LastUpdated = DateTime.UtcNow.AddHours(7),
                    Comment     = createRequest.Comment,
                    POStatus      = PO_Status.Submitted
                };

                _dbContext.PurchaseOrder.Add(newPO);
                _dbContext.PODetail.AddRange(details);
                _dbContext.POApproval.Add(approval);
                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return new POCreateResponse{
                    POID       = newPO.POID,
                    StoreID    = newPO.StoreID,
                    SupplierID = newPO.SupplierID,
                    TaxRate    = newPO.TaxRate,
                    Total      = newPO.Total,
                    POStatus     = PO_Status.Submitted,
                    Items      = details.Select(d => new PODetailResponse{
                        IngredientID      = d.IngredientID,
                        Quantity          = d.Quantity,
                        UnitPriceExpected = d.UnitPriceExpected
                    }).ToList()
                };
            } catch (Exception e){
                await transaction.RollbackAsync();
                throw new Exception($"CreatePO failed: {e.Message}");
            }
        }
        private static readonly Dictionary<PO_Status, HashSet<PO_Status>> _validTransitions = new()
        {
            [PO_Status.Submitted] = [PO_Status.Ordered, PO_Status.Rejected],
            [PO_Status.Ordered]   = [PO_Status.Received, PO_Status.Cancelled],
        };

        public async Task UpdatePO(Guid id, POUpdateRequest updateRequest){
            var po = await _dbContext.PurchaseOrder
                .Include(p => p.POApproval.OrderByDescending(a => a.LastUpdated).Take(1))
                .FirstOrDefaultAsync(p => p.POID == id && p.DeletedAt == null)
                ?? throw new Exception("Purchase Order not found.");

            var currentStatus = po.POApproval
                .OrderByDescending(a => a.LastUpdated)
                .Select(a => a.POStatus)
                .FirstOrDefault();

            if (!_validTransitions.TryGetValue(currentStatus, out var allowed) ||
                !allowed.Contains(updateRequest.POStatus))
                throw new Exception($"Cannot transition from {currentStatus} to {updateRequest.POStatus}.");

            if (updateRequest.POStatus == PO_Status.Cancelled &&
                string.IsNullOrWhiteSpace(updateRequest.CancelledReason))
                throw new Exception("CancelledReason is required when cancelling a PO.");

            try {
                var newChange = new POApproval {
                    POID            = id,
                    EmployeeID      = updateRequest.EmployeeID,
                    Comment         = updateRequest.Comment,
                    CancelledReason = updateRequest.CancelledReason,
                    LastUpdated     = DateTime.UtcNow.AddHours(7),
                    POStatus          = updateRequest.POStatus
                };
                _dbContext.POApproval.Add(newChange);
                await _dbContext.SaveChangesAsync();
            } catch (Exception e){
                throw new Exception($"UpdatePO failed: {e.Message}");
            }
        }
        public async Task<List<PurchaseOrder>?> GetAllPOByStore(int storeID) =>
            await _dbContext.PurchaseOrder
                .AsNoTracking()
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated)
                    .Take(1))
                .Where(po => po.StoreID == storeID && po.DeletedAt == null)
                .ToListAsync();
        public async Task<List<PurchaseOrder>?> GetAllPOBySupplier(int supplierID) =>
            await _dbContext.PurchaseOrder
                .AsNoTracking()
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated)
                    .Take(1))
                .Where(po => po.SupplierID == supplierID && po.DeletedAt == null)
                .ToListAsync();
        public async Task<List<PurchaseOrder>?> GetPOByStatus(PO_Status status) =>
            await _dbContext.PurchaseOrder
                .AsNoTracking()
                .Include(po => po.PODetail)
                .Include(po => po.Store)
                .Include(po => po.Supplier)
                .Include(po => po.POApproval
                    .OrderByDescending(poA => poA.LastUpdated)
                    .Take(1))
                .Where(po => po.DeletedAt == null &&
                        po.POApproval.Any() &&
                        po.POApproval
                            .OrderByDescending(poA => poA.LastUpdated)
                            .Select(poA => poA.POStatus)
                            .FirstOrDefault() == status)
                .ToListAsync();
        
        public async Task SoftDeletePO(Guid id)
        {
            // TODO: kiểm tra điều kiện trước khi xoá — xem ghi chú trong IPurchaseOrderService.
            throw new NotImplementedException("SoftDeletePO chưa hoàn thiện.");

            // var po = await _dbContext.PurchaseOrder
            //     .FirstOrDefaultAsync(p => p.POID == id && p.DeletedAt == null);
            // if (po == null)
            //     throw new Exception("Purchase Order not found");
            // po.DeletedAt = DateTime.UtcNow;
            // await _dbContext.SaveChangesAsync();
        }
    }
}