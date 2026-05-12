using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Implementations
{
    public class ProcessingService : IProcessingService
    {
        private readonly AppDbContext _dbContext;

        public ProcessingService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<CreateProcessingResponse> CreateProcessing(CreateProcessingRequest request)
        {
            if (request.Items == null || request.Items.Count == 0)
                throw new Exception("Processing must have at least one item.");

            var duplicateBatchIDs = request.Items
                .GroupBy(i => i.SourceBatchID)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();
            if (duplicateBatchIDs.Count > 0)
                throw new Exception($"Duplicate SourceBatchID(s) in request: {string.Join(", ", duplicateBatchIDs)}");

            var employee = await _dbContext.Employee
                .FirstOrDefaultAsync(e => e.UserID == request.EmployeeID && e.DeleteAt == null);
            _ = employee ?? throw new Exception($"Employee {request.EmployeeID} not found.");

            var warehouse = await _dbContext.Warehouse
                .FirstOrDefaultAsync(w => w.WarehouseID == request.WarehouseID && w.DeletedAt == null);
            _ = warehouse ?? throw new Exception($"Warehouse {request.WarehouseID} not found.");
            if (warehouse.StoreID != employee.StoreID)
                throw new Exception($"Warehouse {request.WarehouseID} does not belong to the store of employee {request.EmployeeID} (StoreID: {employee.StoreID}).");

            var outputIngredientIDs = request.Items.Select(i => i.OutputIngredientID).Distinct().ToList();
            var outputIngredients = await _dbContext.Ingredient
                .Where(i => outputIngredientIDs.Contains(i.IngredientID) && i.DeletedAt == null)
                .ToDictionaryAsync(i => i.IngredientID);

            var sourceBatchIDs = request.Items.Select(i => i.SourceBatchID).ToList();
            var sourceBatches = await _dbContext.InventoryBatch
                .Where(b => sourceBatchIDs.Contains(b.BatchID))
                .ToDictionaryAsync(b => b.BatchID);

            foreach (var item in request.Items)
            {
                if (!sourceBatches.TryGetValue(item.SourceBatchID, out var batch))
                    throw new Exception($"SourceBatch {item.SourceBatchID} not found.");
                if (batch.BatchType != BatchType.Raw)
                    throw new Exception($"Batch {item.SourceBatchID} is not a Raw batch.");
                if (batch.Status != BatchStatus.Available)
                    throw new Exception($"Batch {item.SourceBatchID} is not Available (status: {batch.Status}).");
                if (item.InputKg <= 0)
                    throw new Exception($"Batch {item.SourceBatchID}: InputKg must be > 0.");
                if (item.InputKg > batch.QuantityOnHand)
                    throw new Exception($"Batch {item.SourceBatchID}: InputKg ({item.InputKg}) exceeds QuantityOnHand ({batch.QuantityOnHand}).");
                if (item.OutputPieces <= 0)
                    throw new Exception($"Batch {item.SourceBatchID}: OutputPieces must be > 0.");
                if (item.BagCount <= 0)
                    throw new Exception($"Batch {item.SourceBatchID}: BagCount must be > 0.");
                if (item.PiecesPerBag <= 0)
                    throw new Exception($"Batch {item.SourceBatchID}: PiecesPerBag must be > 0.");
                if (item.Mfd >= item.Exp)
                    throw new Exception($"Batch {item.SourceBatchID}: Mfd must be before Exp.");
                if (!outputIngredients.TryGetValue(item.OutputIngredientID, out var outIngredient))
                    throw new Exception($"OutputIngredientID {item.OutputIngredientID} not found.");
                if (outIngredient.IngredientUnit != IngredientUnit.Unit)
                    throw new Exception($"OutputIngredientID {item.OutputIngredientID} must be IngredientUnit.Unit (got {outIngredient.IngredientUnit}).");
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var processedAt = DateTime.UtcNow;

                var log = new ProcessingLog
                {
                    ProcessingID = Guid.NewGuid(),
                    EmployeeID   = request.EmployeeID,
                    ProcessedAt  = processedAt,
                    Note         = request.Note,
                };
                _dbContext.ProcessingLog.Add(log);

                var results = new List<ProcessingResultLine>();

                foreach (var item in request.Items)
                {
                    var sourceBatch = sourceBatches[item.SourceBatchID];

                    var outputUnitCost = (item.InputKg * sourceBatch.UnitCost) / item.OutputPieces;

                    sourceBatch.QuantityOnHand -= item.InputKg;
                    if (sourceBatch.QuantityOnHand == 0)
                        sourceBatch.Status = BatchStatus.Depleted;
                    sourceBatch.UpdatedAt = processedAt;

                    var movementOut = new StockMovement
                    {
                        StockMovementID = Guid.NewGuid(),
                        BatchID         = sourceBatch.BatchID,
                        EmployeeID      = request.EmployeeID,
                        QtyChange       = -item.InputKg,
                        MovementType    = StockMovementType.Processing,
                        ReferenceType   = StockReferenceType.Manual,
                        ReferenceID     = log.ProcessingID,
                        TimeStamp       = processedAt,
                    };

                    var outputBatch = new InventoryBatch
                    {
                        BatchID          = Guid.NewGuid(),
                        IngredientID     = item.OutputIngredientID,
                        WarehouseID      = request.WarehouseID,
                        BatchType        = BatchType.Processed,
                        Status           = BatchStatus.Available,
                        QuantityOriginal = item.OutputPieces,
                        QuantityOnHand   = item.OutputPieces,
                        UnitCost         = outputUnitCost,
                        ImportDate       = processedAt,
                        Mfd              = item.Mfd,
                        Exp              = item.Exp,
                        BatchCode        = $"BP-{item.OutputIngredientID}-{processedAt:yyyyMMdd}",
                    };

                    var movementIn = new StockMovement
                    {
                        StockMovementID = Guid.NewGuid(),
                        BatchID         = outputBatch.BatchID,
                        EmployeeID      = request.EmployeeID,
                        QtyChange       = item.OutputPieces,
                        MovementType    = StockMovementType.Processing,
                        ReferenceType   = StockReferenceType.Manual,
                        ReferenceID     = log.ProcessingID,
                        TimeStamp       = processedAt,
                    };

                    var detail = new ProcessingDetail
                    {
                        ProcessingID       = log.ProcessingID,
                        SourceBatchID      = sourceBatch.BatchID,
                        InputKg            = item.InputKg,
                        OutputIngredientID = item.OutputIngredientID,
                        OutputPieces       = item.OutputPieces,
                        BagCount           = item.BagCount,
                        PiecesPerBag       = item.PiecesPerBag,
                        WasteNote          = item.WasteNote,
                        OutputBatchID      = outputBatch.BatchID,
                    };

                    _dbContext.InventoryBatch.Add(outputBatch);
                    _dbContext.StockMovement.Add(movementOut);
                    _dbContext.StockMovement.Add(movementIn);
                    _dbContext.ProcessingDetail.Add(detail);

                    var resultLine = new ProcessingResultLine
                    {
                        SourceBatchID  = sourceBatch.BatchID,
                        InputKg        = item.InputKg,
                        OutputBatchID  = outputBatch.BatchID,
                        OutputPieces   = item.OutputPieces,
                        OutputUnitCost = outputUnitCost,
                    };
                    results.Add(resultLine);
                }

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return new CreateProcessingResponse
                {
                    ProcessingID = log.ProcessingID,
                    ProcessedAt  = processedAt,
                    Results      = results,
                };
            }
            catch (Exception e)
            {
                await transaction.RollbackAsync();
                throw new Exception($"CreateProcessing failed: {e.Message}");
            }
        }

        public async Task DeleteProcessing(Guid processingID, Guid employeeID)
        {
            var log = await _dbContext.ProcessingLog
                .Include(p => p.Details)
                    .ThenInclude(d => d.SourceBatch)
                .Include(p => p.Details)
                    .ThenInclude(d => d.OutputBatch)
                .FirstOrDefaultAsync(p => p.ProcessingID == processingID);

            if (log == null)
                throw new Exception($"ProcessingLog {processingID} not found.");
            if (log.DeletedAt != null)
                throw new Exception($"ProcessingLog {processingID} has already been deleted.");

            foreach (var detail in log.Details)
            {
                if (detail.OutputBatch.QuantityOnHand != detail.OutputBatch.QuantityOriginal)
                    throw new Exception(
                        $"Cannot reverse processing: OutputBatch {detail.OutputBatchID} has already been partially or fully consumed " +
                        $"(OnHand={detail.OutputBatch.QuantityOnHand}, Original={detail.OutputBatch.QuantityOriginal}).");
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.UtcNow;

                foreach (var detail in log.Details)
                {
                    var sourceBatch = detail.SourceBatch;
                    sourceBatch.QuantityOnHand += detail.InputKg;
                    if (sourceBatch.Status == BatchStatus.Depleted)
                        sourceBatch.Status = BatchStatus.Available;
                    sourceBatch.UpdatedAt = now;

                    _dbContext.StockMovement.Add(new StockMovement
                    {
                        StockMovementID = Guid.NewGuid(),
                        BatchID         = sourceBatch.BatchID,
                        EmployeeID      = employeeID,
                        QtyChange       = detail.InputKg,
                        MovementType    = StockMovementType.ManualAdjustment,
                        ReferenceType   = StockReferenceType.Manual,
                        ReferenceID     = processingID,
                        TimeStamp       = now,
                        Note            = $"Reversal of ProcessingLog {processingID}",
                    });

                    var outputBatch = detail.OutputBatch;
                    outputBatch.Status         = BatchStatus.Cancelled;
                    outputBatch.QuantityOnHand = 0;
                    outputBatch.UpdatedAt      = now;

                    _dbContext.StockMovement.Add(new StockMovement
                    {
                        StockMovementID = Guid.NewGuid(),
                        BatchID         = outputBatch.BatchID,
                        EmployeeID      = employeeID,
                        QtyChange       = -detail.OutputPieces,
                        MovementType    = StockMovementType.ManualAdjustment,
                        ReferenceType   = StockReferenceType.Manual,
                        ReferenceID     = processingID,
                        TimeStamp       = now,
                        Note            = $"Reversal of ProcessingLog {processingID}",
                    });
                }

                log.DeletedAt = now;

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception e)
            {
                await transaction.RollbackAsync();
                throw new Exception($"DeleteProcessing failed: {e.Message}");
            }
        }

        public async Task<ProcessingLog?> GetProcessingByID(Guid processingID) =>
            await _dbContext.ProcessingLog
                .AsNoTracking()
                .Where(p => p.ProcessingID == processingID && p.DeletedAt == null)
                .Include(p => p.Employee)
                .Include(p => p.Details)
                    .ThenInclude(d => d.SourceBatch)
                        .ThenInclude(b => b.Ingredient)
                .Include(p => p.Details)
                    .ThenInclude(d => d.OutputBatch)
                        .ThenInclude(b => b.Ingredient)
                .FirstOrDefaultAsync();

        public async Task<List<ProcessingLog>?> GetAllProcessing(DateOnly start, DateOnly end) =>
            await _dbContext.ProcessingLog
                .AsNoTracking()
                .Where(p => p.DeletedAt == null &&
                            p.ProcessedAt >= start.ToDateTime(TimeOnly.MinValue) &&
                            p.ProcessedAt <= end.ToDateTime(TimeOnly.MaxValue))
                .Include(p => p.Employee)
                .Include(p => p.Details)
                .ToListAsync();
    }
}
