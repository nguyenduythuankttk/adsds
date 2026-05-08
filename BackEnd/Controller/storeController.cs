using Backend.Models;
using Backend.Services.Interface;
using Backend.Models.DTOs.Request;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controller
{
    [ApiController]
    [Route("api/pbl3/[controller]")]
    public class storeController : ControllerBase
    {
        private readonly IStoreService _storeService;

        public storeController(IStoreService storeService)
        {
            _storeService = storeService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllStore()
        {
            try
            {
                var stores = await _storeService.GetAllStore();
                return Ok(stores);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in storeController.GetAllStore {ex.Message}");
            }
        }

        [HttpGet("get/{storeID}")]
        public async Task<IActionResult> GetStoreByID(int storeID)
        {
            try
            {
                var store = await _storeService.GetStoreByID(storeID);
                if(store == null)
                    return NotFound("Store not found!");

                return Ok(store);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error ocurred in storeController.GetStoreByID {ex.Message}");
            }
        }

        [HttpGet("get-byaddress/{addressID}")]
        public async Task<IActionResult> GetStoreByAddress(Guid addressID)
        {
            try
            {
                var storeaddress = await _storeService.GetStoreByAdress(addressID);
                if(storeaddress == null)
                    return NotFound("Store not found!");

                return Ok(storeaddress);
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occrred in storeController.GetStoreByAddress {ex.Message}");
            }
        }

        [HttpPost("add/{store}")]
        public async Task<IActionResult> AddStore(Store store)
        {
            try
            {
                await _storeService.AddStore(store);
                return Ok("Add store sucessfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in storeController.AddStore {ex.Message}");
            }
        }

        [HttpPut("update/{storeID}")]
        public async Task<IActionResult> UpdateStore(int storeID, StoreUpdateRequest request)
        {
            try
            {
                await _storeService.UpdateStore(storeID, request);
                return Ok("Update store successfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in storeController.UpdateStore {ex.Message}");
            }
        }

        [HttpDelete("softdelete/{storeID}")]
        public async Task<IActionResult> SoftDeleteStore(int storeID)
        {
            try
            {
                await _storeService.SoftDeleteStore(storeID);
                return Ok("Soft delete store succesfully!");
            }catch(Exception ex)
            {
                return StatusCode(500, $"An error occurred in storeController.SoftDeletingStore {ex.Message}");
            }
        }
    }
}