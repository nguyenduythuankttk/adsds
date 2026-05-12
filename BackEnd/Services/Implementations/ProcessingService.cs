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
                    if (sourceBatch.QuantityOnHand <= 0)
                    {
                        sourceBatch.QuantityOnHand = 0;
                        sourceBatch.Status = BatchStatus.Depleted;
                    }
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

                    results.Add(new ProcessingResultLine
                    {
                        SourceBatchID  = sourceBatch.BatchID,
                        InputKg        = item.InputKg,
                        OutputBatchID  = outputBatch.BatchID,
                        OutputPieces   = item.OutputPieces,
                        OutputUnitCost = outputUnitCost,
                    });
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

        public async Task<ProcessingLog?> GetProcessingByID(Guid processingID) =>
            await _dbContext.ProcessingLog
                .AsNoTracking()
                .Include(p => p.Employee)
                .Include(p => p.Details)
                    .ThenInclude(d => d.SourceBatch)
                        .ThenInclude(b => b.Ingredient)
                .Include(p => p.Details)
                    .ThenInclude(d => d.OutputBatch)
                        .ThenInclude(b => b.Ingredient)
                .FirstOrDefaultAsync(p => p.ProcessingID == processingID);

        public async Task<List<ProcessingLog>?> GetAllProcessing(DateOnly start, DateOnly end) =>
            await _dbContext.ProcessingLog
                .AsNoTracking()
                .Where(p => p.ProcessedAt >= start.ToDateTime(TimeOnly.MinValue) &&
                            p.ProcessedAt <= end.ToDateTime(TimeOnly.MaxValue))
                .Include(p => p.Employee)
                .Include(p => p.Details)
                .ToListAsync();
    }
}
