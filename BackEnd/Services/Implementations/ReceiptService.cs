using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Data;
using Backend.Helpers;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
 {
    public class ReceiptService : IReceiptService
    {
        private readonly AppDbContext _dbContext;

        public ReceiptService(AppDbContext dbContext)
        {
             _dbContext = dbContext;
        }

        public async Task<ReceiptPrefillResponse> GetPrefilledFromPO(Guid poId)
        {
            var po = await _dbContext.PurchaseOrder
                .AsNoTracking()
                .Include(p => p.Supplier)
                .Include(p => p.POApproval.OrderByDescending(a => a.LastUpdated).Take(1))
                .Include(p => p.PODetail)
                    .ThenInclude(d => d.Ingredient)
                .FirstOrDefaultAsync(p => p.POID == poId && p.DeletedAt == null)
                ?? throw new Exception("Purchase Order not found.");

            var latestStatus = po.POApproval
                .OrderByDescending(a => a.LastUpdated)
                .Select(a => a.POStatus)
                .FirstOrDefault();

            if (latestStatus != PO_Status.Ordered)
                throw new Exception($"PO must be in Ordered status to create receipt. Current status: {latestStatus}.");

            return new ReceiptPrefillResponse
            {
                POID         = po.POID,
                SupplierID   = po.SupplierID,
                SupplierName = po.Supplier.SupplierName,
                StoreID      = po.StoreID,
                PODetailLines =  po.PODetail.Select(d => new ReceiptDetailPrefill
                {
                    IngredientID      = d.IngredientID,
                    IngredientName    = d.Ingredient.IngredientName,
                    QuantityExpected  = d.Quantity,
                    UnitPriceExpected = d.UnitPriceExpected
                }).ToList()
            };
        }

        public async Task<ReceiptCreateResponse> CreateReceipt(ReceiptCreateRequest request)
        {
            if (request.ReceiptLines == null || request.ReceiptLines.Count == 0)
                throw new Exception("Receipt must have at least one item.");

            var existingReceipt = await _dbContext.Receipt
                .AnyAsync(r => r.POID == request.POID && r.DeletedAt == null);
            if (existingReceipt)
                throw new Exception("Phiếu nhập cho đơn hàng PO này đã được tạo.");

            var po = await _dbContext.PurchaseOrder
                .Include(p => p.POApproval.OrderByDescending(a => a.LastUpdated).Take(1))
                .Include(p => p.PODetail)
                .FirstOrDefaultAsync(p => p.POID == request.POID && p.DeletedAt == null)
                ?? throw new Exception("Purchase Order not found.");

            var latestStatus = po.POApproval
                .OrderByDescending(a => a.LastUpdated)
                .Select(a => a.POStatus)
                .FirstOrDefault();

            if (latestStatus != PO_Status.Ordered)
                throw new Exception($"PO must be in Ordered status. Current status: {latestStatus}.");

            var validIngredientIDs = po.PODetail.Select(d => d.IngredientID).ToHashSet();
            var invalidLines = request.ReceiptLines
                .Where(i => !validIngredientIDs.Contains(i.IngredientID))
                .Select(i => i.IngredientID)
                .ToList();
            if (invalidLines.Count > 0)
                throw new Exception($"IngredientID(s) not in PO: {string.Join(", ", invalidLines)}");

            foreach (var line in request.ReceiptLines)
            {
                if (line.Quantity <= 0)
                    throw new Exception($"IngredientID {line.IngredientID}: Quantity must be > 0.");
                if (line.GoodQuantity < 0 || line.GoodQuantity > line.Quantity)
                    throw new Exception($"IngredientID {line.IngredientID}: GoodQuantity must be between 0 and Quantity.");
                if (line.UnitPrice <= 0)
                    throw new Exception($"IngredientID {line.IngredientID}: UnitPrice must be > 0.");
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var receipt = new Receipt
                {
                    ReceiptID   = Guid.NewGuid(),
                    POID        = po.POID,
                    SupplierID  = po.SupplierID,
                    StoreID     = po.StoreID,
                    EmployeeID  = request.EmployeeID,
                    DateReceive = VnTime.Now,
                };

                var details = request.ReceiptLines.Select(i => new ReceiptDetail
                {
                    GoodsReceiptID = receipt.ReceiptID,
                    IngredientID   = i.IngredientID,
                    Quantity       = i.Quantity,
                    GoodQuantity   = i.GoodQuantity,
                    UnitPrice      = i.UnitPrice
                }).ToList();

                _dbContext.Receipt.Add(receipt);
                _dbContext.ReceiptDetail.AddRange(details);
                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ReceiptCreateResponse
                {
                    ReceiptID   = receipt.ReceiptID,
                    POID        = receipt.POID!.Value,
                    SupplierID  = receipt.SupplierID,
                    StoreID     = receipt.StoreID,
                    EmployeeID  = receipt.EmployeeID,
                    DateReceive = receipt.DateReceive,
                    ReceiptDetailLines =  details.Select(d => new ReceiptDetailSaved
                    {
                        IngredientID = d.IngredientID,
                        Quantity     = d.Quantity,
                        GoodQuantity = d.GoodQuantity,
                        UnitPrice    = d.UnitPrice
                    }).ToList()
                };
            }
            catch (Exception e)
            {
                await transaction.RollbackAsync();
                throw new Exception($"CreateReceipt failed: {e.Message}");
            }
        }

        // Admin/Manager tạo phiếu nhập trực tiếp không qua PO. Khác với CreateReceipt:
        //   - Không validate IngredientID theo PODetail (admin tự chọn nguyên liệu).
        //   - Bắt buộc EmployeeID + SupplierID + tất cả Ingredient phải tồn tại.
        //   - Bắt buộc EmployeeID phải thuộc storeID truyền vào → chống admin store A
        //     ghi nhận phiếu cho store B.
        public async Task<ReceiptCreateResponse> CreateDirectReceipt(int storeID, DirectReceiptCreateRequest request)
        {
            if (request.ReceiptLines == null || request.ReceiptLines.Count == 0)
                throw new Exception("Phiếu nhập phải có ít nhất một dòng nguyên liệu.");

            var emp = await _dbContext.Employee
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserID == request.EmployeeID && e.DeleteAt == null)
                ?? throw new Exception("Nhân viên không tồn tại.");
            if (emp.StoreID != storeID)
                throw new Exception("Nhân viên không thuộc cửa hàng này.");

            var supplier = await _dbContext.Supplier
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SupplierID == request.SupplierID && s.DeletedAt == null)
                ?? throw new Exception("Nhà cung cấp không tồn tại.");

            var ingredientIDs = request.ReceiptLines.Select(l => l.IngredientID).Distinct().ToList();
            var validIngredients = await _dbContext.Ingredient
                .AsNoTracking()
                .Where(i => ingredientIDs.Contains(i.IngredientID) && i.DeletedAt == null)
                .Select(i => new { i.IngredientID, i.IngredientName })
                .ToListAsync();
            if (validIngredients.Count != ingredientIDs.Count) {
                var missing = ingredientIDs.Except(validIngredients.Select(x => x.IngredientID));
                throw new Exception($"Nguyên liệu không tồn tại: {string.Join(", ", missing)}");
            }

            foreach (var line in request.ReceiptLines)
            {
                if (line.Quantity <= 0)
                    throw new Exception($"Nguyên liệu {line.IngredientID}: Số lượng phải > 0.");
                if (line.GoodQuantity < 0 || line.GoodQuantity > line.Quantity)
                    throw new Exception($"Nguyên liệu {line.IngredientID}: Số lượng tốt phải nằm trong khoảng [0, Số lượng].");
                if (line.UnitPrice <= 0)
                    throw new Exception($"Nguyên liệu {line.IngredientID}: Đơn giá phải > 0.");
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var confirmedAt = VnTime.Now;
                var warehouse = await _dbContext.Warehouse
                    .FirstOrDefaultAsync(w => w.StoreID == storeID && w.DeletedAt == null)
                    ?? throw new Exception("Không tìm thấy kho hàng cho cửa hàng này.");

                var receipt = new Receipt
                {
                    ReceiptID   = Guid.NewGuid(),
                    POID        = null,
                    SupplierID  = request.SupplierID,
                    StoreID     = storeID,
                    EmployeeID  = request.EmployeeID,
                    DateReceive = confirmedAt,
                    ConfirmedAt = confirmedAt
                };

                var details = request.ReceiptLines.Select(i => new ReceiptDetail
                {
                    GoodsReceiptID = receipt.ReceiptID,
                    IngredientID   = i.IngredientID,
                    Quantity       = i.Quantity,
                    GoodQuantity   = i.GoodQuantity,
                    UnitPrice      = i.UnitPrice
                }).ToList();

                _dbContext.Receipt.Add(receipt);
                _dbContext.ReceiptDetail.AddRange(details);

                // Auto-confirm direct receipts: Create InventoryBatch and StockMovement records
                foreach (var detail in details)
                {
                    var batchCode = $"BT-{detail.IngredientID}-{confirmedAt:yyyyMMdd}";
                    var batch = new InventoryBatch
                    {
                        BatchID          = Guid.NewGuid(),
                        IngredientID     = detail.IngredientID,
                        GoodsReceiptID   = receipt.ReceiptID,
                        WarehouseID      = warehouse.WarehouseID,
                        BatchType        = BatchType.Raw,
                        Status           = BatchStatus.Available,
                        QuantityOriginal = detail.GoodQuantity,
                        QuantityOnHand   = detail.GoodQuantity,
                        UnitCost         = detail.UnitPrice,
                        ImportDate       = confirmedAt,
                        Mfd              = DateOnly.FromDateTime(confirmedAt),
                        Exp              = DateOnly.FromDateTime(confirmedAt.AddDays(30)),
                        BatchCode        = batchCode,
                    };

                    _dbContext.InventoryBatch.Add(batch);

                    _dbContext.StockMovement.Add(new StockMovement
                    {
                        StockMovementID = Guid.NewGuid(),
                        BatchID         = batch.BatchID,
                        EmployeeID      = request.EmployeeID,
                        QtyChange       = detail.GoodQuantity,
                        MovementType    = StockMovementType.PurchaseReceipt,
                        ReferenceType   = StockReferenceType.GoodsReceipt,
                        ReferenceID     = receipt.ReceiptID,
                        TimeStamp       = confirmedAt,
                    });
                }

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                var ingNameMap = validIngredients.ToDictionary(x => x.IngredientID, x => x.IngredientName);
                return new ReceiptCreateResponse
                {
                    ReceiptID   = receipt.ReceiptID,
                    POID        = null,
                    SupplierID  = receipt.SupplierID,
                    StoreID     = receipt.StoreID,
                    EmployeeID  = receipt.EmployeeID,
                    DateReceive = receipt.DateReceive,
                    ReceiptDetailLines = details.Select(d => new ReceiptDetailSaved
                    {
                        IngredientID = d.IngredientID,
                        IngredientName = ingNameMap.GetValueOrDefault(d.IngredientID),
                        Quantity     = d.Quantity,
                        GoodQuantity = d.GoodQuantity,
                        UnitPrice    = d.UnitPrice
                    }).ToList()
                };
            }
            catch (Exception e)
            {
                await transaction.RollbackAsync();
                throw new Exception($"CreateDirectReceipt failed: {e.Message}");
            }
        }

        //GET ALL
        public async Task<List<Receipt>?> GetAllReceiptIn(DateOnly start, DateOnly end) =>
            await _dbContext.Receipt
                .AsNoTracking()
                .Where(b => b.DeletedAt == null &&
                            b.DateReceive >= start.ToDateTime(TimeOnly.MinValue) &&
                            b.DateReceive <= end.ToDateTime(TimeOnly.MaxValue))
                .Include(r => r.Employee)
                .Include(r => r.Store)
                .Include(r => r.Supplier)
                .ToListAsync();
        
        public async Task<Receipt?> GetReceiptByID(Guid receiptID) =>
            await _dbContext.Receipt    
                .AsNoTracking()
                .Include(r => r.Employee)
                .Include(r => r.Store)
                    .ThenInclude(c => c.Address)
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                    .ThenInclude(c => c.Address)
                .Include(r => r.ReceiptDetail)
                    .ThenInclude(d => d.Ingredient)
                .FirstOrDefaultAsync(r => r.ReceiptID == receiptID && r.DeletedAt == null);
        
        public async Task<List<Receipt>?> GetReceiptByPO(Guid pOID) =>
            await _dbContext.Receipt
                .AsNoTracking()
                .Where(r => r.POID == pOID && r.DeletedAt == null)
                .Include(r => r.Employee)
                .Include(r => r.Store)
                    .ThenInclude(c => c.Address)
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                    .ThenInclude(c => c.Address)
                .Include(r => r.ReceiptDetail)
                    .ThenInclude(d => d.Ingredient)
                .ToListAsync();

        public async Task<List<Receipt>?> GetReceiptByStore(int storeID) =>
            await _dbContext.Receipt
                .AsNoTracking()
                .Where(r => r.StoreID == storeID && r.DeletedAt == null)
                .Include(r => r.Employee)
                .Include(r => r.Store)
                    .ThenInclude(c => c.Address)
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                    .ThenInclude(c => c.Address)
                .ToListAsync();

        // List phẳng cho admin: chỉ trả về trường cần hiển thị, không nạp entity con
        // để tránh lỗi tuần hoàn và vượt size payload.
        public async Task<List<ReceiptListResponse>> GetReceiptsByStoreInRange(int storeID, DateOnly start, DateOnly end) {
            var s = start.ToDateTime(TimeOnly.MinValue);
            var e = end.ToDateTime(TimeOnly.MaxValue);
            return await _dbContext.Receipt
                .AsNoTracking()
                .Where(r => r.StoreID == storeID && r.DeletedAt == null
                    && r.DateReceive >= s && r.DateReceive <= e)
                .OrderByDescending(r => r.DateReceive)
                .Select(r => new ReceiptListResponse {
                    ReceiptID = r.ReceiptID,
                    POID = r.POID,
                    StoreID = r.StoreID,
                    StoreName = r.Store != null ? r.Store.StoreName : null,
                    SupplierID = r.SupplierID,
                    SupplierName = r.Supplier != null ? r.Supplier.SupplierName : null,
                    EmployeeID = r.EmployeeID,
                    EmployeeName = r.Employee != null ? r.Employee.FullName : null,
                    DateReceive = r.DateReceive,
                    ConfirmedAt = r.ConfirmedAt,
                    LineCount = r.ReceiptDetail.Count,
                    TotalAmount = r.ReceiptDetail.Sum(d => d.GoodQuantity * d.UnitPrice)
                })
                .ToListAsync();
        }

        public async Task<List<Receipt>?> GetReceiptByEmployee(Guid employeeID) =>
            await _dbContext.Receipt
                .AsNoTracking()
                .Include(r => r.Employee)
                .Include(r => r.Store)
                    .ThenInclude(c => c.Address)
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                    .ThenInclude(c => c.Address)
                .Where(r => r.EmployeeID == employeeID && r.DeletedAt == null)
                .ToListAsync();

        public async Task<List<Receipt>?> GetReceiptBySupplier(int supplierID) =>
            await _dbContext.Receipt
                .AsNoTracking()
                .Include(r => r.Employee)
                .Include(r => r.Store)
                    .ThenInclude(c => c.Address)
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                    .ThenInclude(c => c.Address)
                .Where(r => r.SupplierID == supplierID && r.DeletedAt == null)
                .ToListAsync();
        

        public async Task<ConfirmReceiptResponse> ConfirmReceipt(ConfirmReceiptRequest request)
        {
            var receipt = await _dbContext.Receipt
                .Include(r => r.ReceiptDetail)
                    .ThenInclude(d => d.Ingredient)
                .FirstOrDefaultAsync(r => r.ReceiptID == request.ReceiptID && r.DeletedAt == null)
                ?? throw new Exception("Receipt not found.");

            if (receipt.ConfirmedAt != null)
                throw new Exception("Receipt already confirmed.");

            if (receipt.POID == null)
                throw new Exception("Receipt has no linked PO.");

            var missingLines = receipt.ReceiptDetail
                .Where(d => !request.Lines.Any(l => l.IngredientID == d.IngredientID))
                .Select(d => d.IngredientID)
                .ToList();
            if (missingLines.Count > 0)
                throw new Exception($"Missing confirm lines for IngredientID(s): {string.Join(", ", missingLines)}");

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var confirmedAt = VnTime.Now;

                foreach (var detail in receipt.ReceiptDetail)
                {
                    var line = request.Lines.First(l => l.IngredientID == detail.IngredientID);

                    var batchCode = string.IsNullOrWhiteSpace(line.BatchCode)
                        ? $"BT-{detail.IngredientID}-{confirmedAt:yyyyMMdd}"
                        : line.BatchCode;

                    var batch = new InventoryBatch
                    {
                        BatchID          = Guid.NewGuid(),
                        IngredientID     = detail.IngredientID,
                        GoodsReceiptID   = receipt.ReceiptID,
                        WarehouseID      = line.WarehouseID,
                        BatchType        = BatchType.Raw,
                        Status           = BatchStatus.Available,
                        QuantityOriginal = detail.GoodQuantity,
                        QuantityOnHand   = detail.GoodQuantity,
                        UnitCost         = detail.UnitPrice,
                        ImportDate       = confirmedAt,
                        Mfd              = line.Mfd,
                        Exp              = line.Exp,
                        BatchCode        = batchCode,
                    };

                    _dbContext.InventoryBatch.Add(batch);
                    _dbContext.StockMovement.Add(new StockMovement
                    {
                        StockMovementID = Guid.NewGuid(),
                        BatchID         = batch.BatchID,
                        EmployeeID      = request.EmployeeID,
                        QtyChange       = detail.GoodQuantity,
                        MovementType    = StockMovementType.PurchaseReceipt,
                        ReferenceType   = StockReferenceType.GoodsReceipt,
                        ReferenceID     = receipt.ReceiptID,
                        TimeStamp       = confirmedAt,
                    });
                }

                receipt.ConfirmedAt = confirmedAt;

                _dbContext.POApproval.Add(new POApproval
                {
                    POApprovalID = Guid.NewGuid(),
                    POID         = receipt.POID.Value,
                    EmployeeID   = request.EmployeeID,
                    POStatus     = PO_Status.Received,
                    LastUpdated  = confirmedAt,
                });

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                var batchesCreated = await _dbContext.InventoryBatch
                    .AsNoTracking()
                    .Where(b => b.GoodsReceiptID == receipt.ReceiptID)
                    .Include(b => b.Ingredient)
                    .Select(b => new BatchCreatedLine
                    {
                        BatchID        = b.BatchID,
                        IngredientID   = b.IngredientID,
                        IngredientName = b.Ingredient.IngredientName,
                        QuantityOnHand = b.QuantityOnHand,
                        BatchCode      = b.BatchCode ?? "",
                    })
                    .ToListAsync();

                return new ConfirmReceiptResponse
                {
                    ReceiptID      = receipt.ReceiptID,
                    ConfirmedAt    = confirmedAt,
                    BatchesCreated = batchesCreated,
                };
            }
            catch (Exception e)
            {
                await transaction.RollbackAsync();
                throw new Exception($"ConfirmReceipt failed: {e.Message}");
            }
        }

        public async Task SoftDeleteReceipt(Guid receiptID)
        {
            // TODO: kiểm tra InventoryBatch trước khi xoá — xem ghi chú trong IReceiptService.
            throw new NotImplementedException("SoftDeleteReceipt chưa hoàn thiện.");

            // var receipt = await _dbContext.Receipt
            //     .FirstOrDefaultAsync(r => r.ReceiptID == receiptID && r.DeletedAt == null);
            // if (receipt == null)
            //     throw new Exception("Receipt not found!");
            // receipt.DeletedAt = DateTime.UtcNow;
            // await _dbContext.SaveChangesAsync();
        }
        

        }
        
}

