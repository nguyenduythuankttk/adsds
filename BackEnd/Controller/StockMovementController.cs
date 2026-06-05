using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class StockMovementController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StockMovementController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllMovements([FromQuery] int? storeID)
        {
            try
            {
                var query = _context.StockMovement
                    .AsNoTracking()
                    .Where(m => m.DeleteAt == null);

                if (storeID.HasValue && storeID.Value > 0)
                {
                    query = query.Where(m => m.Batch.Warehouse.StoreID == storeID.Value);
                }

                var result = await query
                    .OrderByDescending(m => m.TimeStamp)
                    .Select(m => new
                    {
                        StockMovementID = m.StockMovementID,
                        BatchID         = m.BatchID,
                        BatchCode       = m.Batch.BatchCode,
                        IngredientID    = m.Batch.IngredientID,
                        IngredientName  = m.Batch.Ingredient.IngredientName,
                        IngredientUnit  = m.Batch.Ingredient.IngredientUnit.ToString(),
                        QtyChange       = m.QtyChange,
                        MovementType    = m.MovementType.ToString(),
                        ReferenceType   = m.ReferenceType.ToString(),
                        ReferenceID     = m.ReferenceID,
                        TimeStamp       = m.TimeStamp,
                        Reason          = m.Reason,
                        Note            = m.Note,
                        EmployeeID      = m.EmployeeID,
                        EmployeeName    = m.Employee != null ? m.Employee.FullName : null
                    })
                    .ToListAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error fetching stock movements: {ex.Message}" });
            }
        }
    }
}
