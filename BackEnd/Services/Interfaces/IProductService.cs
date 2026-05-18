using Backend.Models;
using Backend.Models.DTOs.Reponse;
using Backend.Models.DTOs.Request;
namespace Backend.Services.Interface{
    public interface IProductService{
        Task <List<Product>?> GetAllProduct();
        Task <Product?> GetProductByID(int productID);
        Task <List<Product>?> GetProductByType (ProductType type);
        Task AddProduct(ProductCreateRequest request);
        Task AddProductVarient(ProductVarientCreate request);
        Task ProductUpdate (ProductUpdateRequest request, int productID);
        Task ProductVarientUpdate (ProductVarientUpdateRequest request, int productID, ProductSize productSize);
        Task SoftDeleteProduct(int productID);
        Task <decimal> GetPriceByID (int productVarientID);
        Task SetIsActive(int productVarientID, bool isActive);
    }
}