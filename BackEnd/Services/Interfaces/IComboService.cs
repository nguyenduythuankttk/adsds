using Backend.Models;
using Backend.Models.DTOs.Request;
using Backend.Models.DTOs.Reponse;
namespace Backend.Services.Interface
{
    public interface IComboService
    {
        Task <Product> GetAllProductInCombo(int comboID);
        Task CreateNewCombo(ComboCreateRequest request);
    }
}