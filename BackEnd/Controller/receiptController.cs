using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Services.Interface;
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
            try
            {
                var receipts = await _receiptService.GetAllReceiptIn(start, end);
                return Ok(receipts);
            } catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.GetAllReceiptIn {ex.Message}");
            }
        }

        [HttpGet("getid/{receiptID}")]
        public async Task<IActionResult> GetReceiptByID(Guid receiptID)
        {
            try
            {
                var receipt = await _receiptService.GetReceiptByID(receiptID);
                if(receipt == null)
                    return NotFound("Receipt not found!");
                return Ok(receipt);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.GetReceiptByID {ex.Message}");
            }
        }

        [HttpGet("getbypo/{pOID}")]
        public async Task<IActionResult> GetReceiptByPO(Guid pOID)
        {
            try
            {
                var receiptpos = await _receiptService.GetReceiptByPO(pOID);
                return Ok(receiptpos);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.GetReceiptByPO {ex.Message}");
            }
        }

        [HttpGet("getbystore/{storeID}")]
        public async Task<IActionResult> GetReceiptByStore(int storeID)
        {
            try
            {
                var receiptstores = await _receiptService.GetReceiptByStore(storeID);
                return Ok(receiptstores);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.GetReceiptByStore {ex.Message}");
            }
        }

        [HttpGet("getbyemployee/{employeeID}")]
        public async Task<IActionResult> GetReceiptByEmployee(Guid employeeID)
        {
            try
            {
                var receiptemployees = await _receiptService.GetReceiptByEmployee(employeeID);
                return Ok(receiptemployees);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.GetReceiptByEmployee {ex.Message}");
            }
        }

        [HttpGet("getbysupplier/{supplierID}")]
        public async Task<IActionResult> GetReceiptBySupplier(int supplierID)
        {
            try
            {
                var receiptsuppliers = await _receiptService.GetReceiptBySupplier(supplierID);
                return Ok(receiptsuppliers);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.GetReceiptBySupplier {ex.Message}");
            }
        }

        [HttpGet("prefill-from-po/{poId}")]
        public async Task<IActionResult> GetPrefilledFromPO(Guid poId)
        {
            try
            {
                var prefill = await _receiptService.GetPrefilledFromPO(poId);
                return Ok(prefill);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.GetPrefilledFromPO {ex.Message}");
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateReceipt(ReceiptCreateRequest request)
        {
            try
            {
                var result = await _receiptService.CreateReceipt(request);
                return CreatedAtAction(nameof(GetReceiptByID), new { receiptID = result.ReceiptID }, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.CreateReceipt {ex.Message}");
            }
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmReceipt(ConfirmReceiptRequest request)
        {
            try
            {
                var result = await _receiptService.ConfirmReceipt(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.ConfirmReceipt {ex.Message}");
            }
        }

        [HttpDelete("softdelete/{receiptID}")]
        public async Task<IActionResult> SoftDeleteReceipt(Guid receiptID)
        {
            try
            {
                await _receiptService.SoftDeleteReceipt(receiptID);
                return Ok("Soft delete successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in receiptController.SoftDeleteReceipt {ex.Message}");
            }
        }
    }
}