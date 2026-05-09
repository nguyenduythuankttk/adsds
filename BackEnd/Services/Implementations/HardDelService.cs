using Microsoft.EntityFrameworkCore;
using Backend.Data;

public class HardDeleteService : BackgroundService {
    private readonly IServiceProvider _ServiceProvider;
    private readonly ILogger<HardDeleteService> _Logger;

    public HardDeleteService(IServiceProvider serviceProvider, ILogger<HardDeleteService> logger){
        _Logger = logger;
        _ServiceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken token){
        _Logger.LogInformation("starting in 10s");
        await Task.Delay(TimeSpan.FromSeconds(10), token);

        while (!token.IsCancellationRequested){
            _Logger.LogInformation("Hard Delete is working");

            using (var scope = _ServiceProvider.CreateScope()){
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                try {
                    // Tính cutoff trước — EF Core/Pomelo không thể translate TimeSpan arithmetic sang SQL
                    var cutoff = DateTime.UtcNow.AddDays(-30);
                    var del = 0;
                    del += await db.Ticket.Where(x =>
                        (x.DeletedAt != null && x.DeletedAt < cutoff) ||
                        (x.EndDate < cutoff) ||
                        (x.UsedAt != null && x.UsedAt < cutoff)
                    ).ExecuteDeleteAsync(token);
                    del += await db.Bill.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.ProductVarient.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Receipt.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.PurchaseOrder.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Product.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.DiningTable.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Warehouse.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Combo.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Ingredient.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.DeliveryInfo.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Shift.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.User.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Store.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    del += await db.Supplier.Where(x => x.DeletedAt != null && x.DeletedAt < cutoff).ExecuteDeleteAsync(token);
                    _Logger.LogInformation("HardDeleteService: xoá {Count} bản ghi", del);
                } catch (Exception e){
                    _Logger.LogError(e, "Error in HardDeleteService");
                }
            }

            await Task.Delay(TimeSpan.FromDays(1), token);
        }
    }
}
