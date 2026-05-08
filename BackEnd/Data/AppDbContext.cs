//:qa
using Microsoft.EntityFrameworkCore;
using Backend.Models;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Backend.Data {
    public class AppDbContext : DbContext {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<User> User { get; set; }
        public DbSet<Employee> Employee { get; set; }
        public DbSet<Address> Address { get; set; }
        public DbSet<UserAddress> UserAddress { get; set; }
        public DbSet<Store> Store { get; set; }
        public DbSet<Shift> Shift { get; set; }
        public DbSet<Category> Category { get; set; }
        public DbSet<Product> Product { get; set; }
        public DbSet<ProductVarient> ProductVarient { get; set; }
        public DbSet<Combo> Combo { get; set; }
        public DbSet<ComboProduct> ComboProduct { get; set; }
        public DbSet<Receipe> Receipe { get; set; }
        public DbSet<Bill> Bill { get; set; }
        public DbSet<BillDetail> BillDetail { get; set; }
        public DbSet<BillChange> BillChange { get; set; }
        public DbSet<Ticket> Ticket { get; set; }
        public DbSet<DiningTable> DiningTable { get; set; }
        public DbSet<Booking> Booking { get; set; }
        public DbSet<BookingChange> BookingChange {get; set; }
        public DbSet<DeliveryInfo> DeliveryInfo { get; set; }
        public DbSet<DeliveryLog> DeliveryLog { get; set; }
        public DbSet<Supplier> Supplier { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrder { get; set; }
        public DbSet<PODetail> PODetail { get; set; }
        public DbSet<POApproval> POApproval { get; set; }
        public DbSet<Receipt> Receipt { get; set; }
        public DbSet<ReceiptDetail> ReceiptDetail { get; set; }
        public DbSet<Warehouse> Warehouse { get; set; }
        public DbSet<Ingredient> Ingredient { get; set; }
        public DbSet<InventoryBatch> InventoryBatch { get; set; }
        public DbSet<StockMovement> StockMovement { get; set; }
        public DbSet<ReceiptChange> ReceiptChange {get; set;}
        public DbSet<TicketUser> TicketUser {get; set;}
        public DbSet<BlacklistedToken> BlackListedToken {get; set;}
        public DbSet<EmailVerificationToken> EmailVerificationToken {get; set;}

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            base.OnModelCreating(modelBuilder);

            // many to many
            modelBuilder.Entity<UserAddress>()
                .HasKey(x => new { x.UserID, x.AddressID });
            modelBuilder.Entity<UserAddress>()
                .HasOne(x => x.User).WithMany(u => u.UserAddress).HasForeignKey(x => x.UserID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<UserAddress>()
                .HasOne(x => x.Address).WithMany(a => a.UserAddresses).HasForeignKey(x => x.AddressID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BillDetail>()
                .HasKey(x => new { x.BillID, x.ProductVarientID });
            modelBuilder.Entity<BillDetail>()
                .HasOne(x => x.Bill).WithMany(b => b.BillDetail).HasForeignKey(x => x.BillID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BillDetail>()
                .HasOne(x => x.ProductVarient).WithMany(p => p.BillDetail).HasForeignKey(x => x.ProductVarientID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ComboProduct>()
                .HasKey(x => new { x.ComboID, x.ProductVarientID });
            modelBuilder.Entity<ComboProduct>()
                .HasOne(x => x.Combo).WithMany(c => c.ComboProduct).HasForeignKey(x => x.ComboID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ComboProduct>()
                .HasOne(x => x.ProductVarient).WithMany(p => p.ComboProduct).HasForeignKey(x => x.ProductVarientID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Receipe>()
                .HasKey(x => new { x.IngredientID, x.ProductVarientID });
            modelBuilder.Entity<Receipe>()
                .HasOne(x => x.Ingredient).WithMany(i => i.Recipe).HasForeignKey(x => x.IngredientID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Receipe>()
                .HasOne(x => x.ProductVarient).WithMany(p => p.Recipe).HasForeignKey(x => x.ProductVarientID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PODetail>()
                .HasKey(x => new { x.POID, x.IngredientID });
            modelBuilder.Entity<PODetail>()
                .HasOne(x => x.PurchaseOrder).WithMany(p => p.PODetail).HasForeignKey(x => x.POID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PODetail>()
                .HasOne(x => x.Ingredient).WithMany(i => i.PODetail).HasForeignKey(x => x.IngredientID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReceiptDetail>()
                .HasKey(x => new { x.GoodsReceiptID, x.IngredientID });
            modelBuilder.Entity<ReceiptDetail>()
                .HasOne(x => x.Receipt).WithMany(r => r.ReceiptDetail).HasForeignKey(x => x.GoodsReceiptID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ReceiptDetail>()
                .HasOne(x => x.Ingredient).WithMany(i => i.ReceiptDetail).HasForeignKey(x => x.IngredientID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TicketUser>()
                .HasKey(x => new { x.TicketID, x.UserID });
            modelBuilder.Entity<TicketUser>()
                .HasOne(x => x.Ticket).WithMany(t => t.TicketUser).HasForeignKey(x => x.TicketID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<TicketUser>()
                .HasOne(x => x.User).WithMany(u => u.TicketUser).HasForeignKey(x => x.UserID).OnDelete(DeleteBehavior.Cascade);


            // one to many
 /*           modelBuilder.Entity<User>()
                .HasMany(u => u.Ticket)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<User>()
                .HasMany<Bill>()
                .WithOne(b => b.User)
                .HasForeignKey(b => b.UserID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<User>()
                .HasMany<DeliveryInfo>()
                .WithOne(d => d.User)
                .HasForeignKey(d => d.UserID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<User>()
                .HasMany<Booking>()
                .WithOne(b => b.User)
                .HasForeignKey(b => b.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Store>()
                .HasMany(s => s.Employee)
                .WithOne(e => e.Store)
                .HasForeignKey(e => e.StoreID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Store>()
                .HasMany(s => s.Warehouse)
                .WithOne(w => w.Store)
                .HasForeignKey(w => w.StoreID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Store>()
                .HasMany(s => s.DiningTable)
                .WithOne(d => d.Store)
                .HasForeignKey(d => d.StoreID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Store>()
                .HasMany<Bill>()
                .WithOne(b => b.Store)
                .HasForeignKey(b => b.StoreID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Store>()
                .HasMany<PurchaseOrder>()
                .WithOne(p => p.Store)
                .HasForeignKey(p => p.StoreID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Store>()
                .HasMany<Receipt>()
                .WithOne(r => r.Store)
                .HasForeignKey(r => r.StoreID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Employee>()
                .HasMany(e => e.Shift)
                .WithOne(s => s.Employee)
                .HasForeignKey(s => s.EmployeeID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Employee>()
                .HasMany(e => e.POApproval)
                .WithOne(p => p.Employee)
                .HasForeignKey(p => p.EmployeeID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Category>()
                .HasMany(c => c.Product)
                .WithOne(p => p.Category)
                .HasForeignKey(p => p.CategoryID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Product>()
                .HasMany(p => p.ProductVarient)
                .WithOne(pv => pv.Product)
                .HasForeignKey(pv => pv.ProductID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Bill>()
                .HasMany(b => b.BillChange)
                .WithOne(bc => bc.Bill)
                .HasForeignKey(bc => bc.BillID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Bill>()
                .HasMany<DeliveryInfo>().WithOne(d => d.Bill).HasForeignKey(d => d.BillID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DiningTable>()
                .HasMany(d => d.Booking).WithOne(b => b.Table).HasForeignKey(b => b.TableID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Supplier>()
                .HasMany<PurchaseOrder>().WithOne(p => p.Supplier).HasForeignKey(p => p.SupplierID).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Supplier>()
                .HasMany<Receipt>().WithOne(r => r.Supplier).HasForeignKey(r => r.SupplierID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseOrder>()
                .HasMany(p => p.POApproval).WithOne(pa => pa.PurchaseOrder).HasForeignKey(pa => pa.POID).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Receipt>()
                .HasMany(r => r.ReceiptDetail)
                .WithOne(rd => rd.Receipt)
                .HasForeignKey(rd => rd.GoodsReceiptID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Receipt>()
                .HasMany<ReceiptChange>()
                .WithOne(rc => rc.Receipt)
                .HasForeignKey(rc => rc.ReceiptID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Warehouse>()
                .HasMany(w => w.InventoryBatch)
                .WithOne(ib => ib.Warehouse)
                .HasForeignKey(ib => ib.WarehouseID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Ingredient>()
                .HasMany(i => i.InventoryBatch)
                .WithOne(ib => ib.Ingredient)
                .HasForeignKey(ib => ib.IngredientID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InventoryBatch>()
                .HasMany(ib => ib.StockMovement)
                .WithOne(sm => sm.Batch)
                .HasForeignKey(sm => sm.BatchID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Address>()
                .HasMany(a => a.DeliveryInfos)
                .WithOne(d => d.Address)
                .HasForeignKey(d => d.AddressID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DeliveryInfo>()
                .HasMany(d => d.DeliveryLog)
                .WithOne(dl => dl.DeliveryInfo)
                .HasForeignKey(dl => dl.DeliveryID)
                .OnDelete(DeleteBehavior.Cascade);

            //one to one
            modelBuilder.Entity<Store>()
                .HasOne(s => s.Address)
                .WithOne(a => a.Store)
                .HasForeignKey<Address>(s => s.StoreID);
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Supplier>()
                .HasOne(s => s.Address)
                .WithOne(a => a.Supplier)
                .HasForeignKey<Address>(a => a.SupplierID);
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Receipt>()
                .HasOne(r => r.PurchaseOrder)
                .WithOne(p => p.Receipt)
                .HasForeignKey<Receipt>(r => r.POID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.BookingChange)
                .WithOne(bc => bc.Booking)
                .HasForeignKey<BookingChange>("BookingID")
                .OnDelete(DeleteBehavior.Cascade);*/


            // convert string
            modelBuilder.Entity<User>()
                .Property(x=> x.Gender)
                .HasConversion<string>().HasMaxLength(10).IsRequired();
            modelBuilder.Entity<Employee>()
                .Property(x => x.Role)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<DiningTable>()
                .Property(x=> x.Status)
                .HasConversion<string>().HasMaxLength(30).IsRequired();

            modelBuilder.Entity<Bill>()
                .Property(x => x.PaymentMethods)
                .HasConversion<string>().HasMaxLength(20).IsRequired();
            
            modelBuilder.Entity<BookingChange>()
                .Property(x => x.BookingStatus)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<Product>()
                .Property(x => x.ProductType)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<ProductVarient>()
                .Property(x => x.Size)
                .HasConversion<string>().HasMaxLength(10).IsRequired();

            modelBuilder.Entity<ReceiptChange>()
                .Property(x => x.Status)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<InventoryBatch>()
                .Property(x => x.Status)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<StockMovement>()
                .Property(x => x.MovementType)
                .HasConversion<string>().HasMaxLength(30).IsRequired();

            modelBuilder.Entity<StockMovement>()
                .Property(x => x.ReferenceType)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<POApproval>()
                .Property(x => x.Status)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<Ingredient>()
                .Property(x => x.IngredientUnit)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<EmailVerificationToken>()
                .Property(x => x.Type)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<BillChange>()
                .Property(x => x.Status)
                .HasConversion<string>().HasMaxLength(20).IsRequired();

            modelBuilder.Entity<DeliveryLog>()
                .Property(x => x.Status)
                .HasConversion<string>().HasMaxLength(20).IsRequired();
        }
    }
}
