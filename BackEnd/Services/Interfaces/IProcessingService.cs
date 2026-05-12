using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;

namespace Backend.Services.Interfaces
{
    public interface IProcessingService
    {
        Task<CreateProcessingResponse> CreateProcessing(CreateProcessingRequest request);
        Task DeleteProcessing(Guid processingID, Guid employeeID);
        Task<ProcessingLog?> GetProcessingByID(Guid processingID);
        Task<List<ProcessingLog>?> GetAllProcessing(DateOnly start, DateOnly end);
    }
}
