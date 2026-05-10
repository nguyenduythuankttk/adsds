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
        Task HardDeleteProduct (int ProductID);
        Task SoftDeleteProduct(int productID);
        Task HardDeleteProductVarient (int productID, ProductSize size);
        Task <decimal> GetPriceByID (int productVarientID);
        Task SetIsActive(int productVarientID, bool isActive);
    }
}