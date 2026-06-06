using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class receiptController : ControllerBase
    {
        private readonly IReceiptService _receiptService;

        public receiptController(IReceiptService receiptService)
        {
            _receiptService = receiptService;
        }

        [HttpGet("get-all/{start}/{end}")]
        public async Task<IActionResult> GetAllReceiptIn(DateOnly start, DateOnly end)
        {
            return Ok(await _receiptService.GetAllReceiptIn(start, end));
        }

        [HttpGet("getid/{receiptID}")]
        public async Task<IActionResult> GetReceiptByID(Guid receiptID)
        {
            var receipt = await _receiptService.GetReceiptByID(receiptID);
            if (receipt == null) return NotFound("Receipt not found!");
            return Ok(receipt);
        }

        [HttpGet("getbypo/{pOID}")]
        public async Task<IActionResult> GetReceiptByPO(Guid pOID)
        {
            return Ok(await _receiptService.GetReceiptByPO(pOID));
        }

        [HttpGet("getbystore/{storeID}")]
        public async Task<IActionResult> GetReceiptByStore(int storeID)
        {
            return Ok(await _receiptService.GetReceiptByStore(storeID));
        }

        // Admin dùng để liệt kê phiếu nhập trong store của mình theo khoảng thời gian.
        [HttpGet("by-store/{storeID}/{start}/{end}")]
        public async Task<IActionResult> GetByStoreInRange(int storeID, DateOnly start, DateOnly end)
        {
            return Ok(await _receiptService.GetReceiptsByStoreInRange(storeID, start, end));
        }

        [HttpGet("getbyemployee/{employeeID}")]
        public async Task<IActionResult> GetReceiptByEmployee(Guid employeeID)
        {
            return Ok(await _receiptService.GetReceiptByEmployee(employeeID));
        }

        [HttpGet("getbysupplier/{supplierID}")]
        public async Task<IActionResult> GetReceiptBySupplier(int supplierID)
        {
            return Ok(await _receiptService.GetReceiptBySupplier(supplierID));
        }

        [HttpGet("prefill-from-po/{poId}")]
        public async Task<IActionResult> GetPrefilledFromPO(Guid poId)
        {
            return Ok(await _receiptService.GetPrefilledFromPO(poId));
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateReceipt(ReceiptCreateRequest request)
        {
            try
            {
                var result = await _receiptService.CreateReceipt(request);
                return CreatedAtAction(nameof(GetReceiptByID), new { receiptID = result.ReceiptID }, result);
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        // Admin tạo phiếu nhập trực tiếp (không qua PO) cho store mình quản lý.
        [Authorize(Roles = "Manager")]
        [HttpPost("create-direct/{storeID}")]
        public async Task<IActionResult> CreateDirectReceipt(int storeID, [FromBody] DirectReceiptCreateRequest request)
        {
            try
            {
                var result = await _receiptService.CreateDirectReceipt(storeID, request);
                return CreatedAtAction(nameof(GetReceiptByID), new { receiptID = result.ReceiptID }, result);
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmReceipt(ConfirmReceiptRequest request)
        {
            return Ok(await _receiptService.ConfirmReceipt(request));
        }

        [HttpDelete("softdelete/{receiptID}")]
        public async Task<IActionResult> SoftDeleteReceipt(Guid receiptID)
        {
            await _receiptService.SoftDeleteReceipt(receiptID);
            return Ok("Soft delete successfully!");
        }
    }
}
