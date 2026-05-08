using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class akd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BlackListedToken",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Token = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiryDate = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlackListedToken", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Category",
                columns: table => new
                {
                    CategoryID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Image = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Category", x => x.CategoryID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Combo",
                columns: table => new
                {
                    ComboID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ComboName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FixedPrice = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Img = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Combo", x => x.ComboID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Ingredient",
                columns: table => new
                {
                    IngredientID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IngredientName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IngredientUnit = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CostPerUnit = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ingredient", x => x.IngredientID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Store",
                columns: table => new
                {
                    StoreID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StoreName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TotalReviews = table.Column<int>(type: "int", nullable: false),
                    TotalPoints = table.Column<int>(type: "int", nullable: false),
                    SeatingCapacity = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Store", x => x.StoreID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Supplier",
                columns: table => new
                {
                    SupplierID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SupplierName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(11)", maxLength: 11, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TaxCode = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supplier", x => x.SupplierID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Product",
                columns: table => new
                {
                    ProductID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CategoryID = table.Column<int>(type: "int", nullable: false),
                    ProductName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProductType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Image = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Product", x => x.ProductID);
                    table.ForeignKey(
                        name: "FK_Product_Category_CategoryID",
                        column: x => x.CategoryID,
                        principalTable: "Category",
                        principalColumn: "CategoryID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DiningTable",
                columns: table => new
                {
                    TableID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StoreID = table.Column<int>(type: "int", nullable: false),
                    TableNumber = table.Column<int>(type: "int", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    IsBooking = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiningTable", x => x.TableID);
                    table.ForeignKey(
                        name: "FK_DiningTable_Store_StoreID",
                        column: x => x.StoreID,
                        principalTable: "Store",
                        principalColumn: "StoreID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserName = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HashPassword = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BirthDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CreateAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Email = table.Column<string>(type: "varchar(255)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FullName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Gender = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    IsVerified = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    EmailVerified = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VerifiedExp = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PasswordEmail = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordEmailExp = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Discriminator = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Role = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StoreID = table.Column<int>(type: "int", nullable: true),
                    BasicSalary = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    DeleteAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UserID);
                    table.ForeignKey(
                        name: "FK_User_Store_StoreID",
                        column: x => x.StoreID,
                        principalTable: "Store",
                        principalColumn: "StoreID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Warehouse",
                columns: table => new
                {
                    WarehouseID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StoreID = table.Column<int>(type: "int", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Warehouse", x => x.WarehouseID);
                    table.ForeignKey(
                        name: "FK_Warehouse_Store_StoreID",
                        column: x => x.StoreID,
                        principalTable: "Store",
                        principalColumn: "StoreID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Address",
                columns: table => new
                {
                    AddressID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    HouseNumber = table.Column<int>(type: "int", nullable: true),
                    Street = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ward = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    District = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Province = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Country = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StoreID = table.Column<int>(type: "int", nullable: true),
                    SupplierID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Address", x => x.AddressID);
                    table.ForeignKey(
                        name: "FK_Address_Store_StoreID",
                        column: x => x.StoreID,
                        principalTable: "Store",
                        principalColumn: "StoreID");
                    table.ForeignKey(
                        name: "FK_Address_Supplier_SupplierID",
                        column: x => x.SupplierID,
                        principalTable: "Supplier",
                        principalColumn: "SupplierID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PurchaseOrder",
                columns: table => new
                {
                    POID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StoreID = table.Column<int>(type: "int", nullable: false),
                    SupplierID = table.Column<int>(type: "int", nullable: false),
                    TaxRate = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrder", x => x.POID);
                    table.ForeignKey(
                        name: "FK_PurchaseOrder_Store_StoreID",
                        column: x => x.StoreID,
                        principalTable: "Store",
                        principalColumn: "StoreID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurchaseOrder_Supplier_SupplierID",
                        column: x => x.SupplierID,
                        principalTable: "Supplier",
                        principalColumn: "SupplierID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ProductVarient",
                columns: table => new
                {
                    ProductVarientID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ProductID = table.Column<int>(type: "int", nullable: false),
                    Size = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Price = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVarient", x => x.ProductVarientID);
                    table.ForeignKey(
                        name: "FK_ProductVarient_Product_ProductID",
                        column: x => x.ProductID,
                        principalTable: "Product",
                        principalColumn: "ProductID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Booking",
                columns: table => new
                {
                    BookingID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ScheduledTime = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    NumberOfGuess = table.Column<int>(type: "int", nullable: false),
                    GuestComment = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TableID = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Booking", x => x.BookingID);
                    table.ForeignKey(
                        name: "FK_Booking_DiningTable_TableID",
                        column: x => x.TableID,
                        principalTable: "DiningTable",
                        principalColumn: "TableID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Booking_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "EmailVerificationToken",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Token = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiryDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsUsed = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailVerificationToken", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailVerificationToken_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Shift",
                columns: table => new
                {
                    ShiftID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TimeIn = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TimeOut = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CheckIn = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CheckOut = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shift", x => x.ShiftID);
                    table.ForeignKey(
                        name: "FK_Shift_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Ticket",
                columns: table => new
                {
                    TicketID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UserID = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ticket", x => x.TicketID);
                    table.ForeignKey(
                        name: "FK_Ticket_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UserAddress",
                columns: table => new
                {
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    AddressID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    IsDefault = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAddress", x => new { x.UserID, x.AddressID });
                    table.ForeignKey(
                        name: "FK_UserAddress_Address_AddressID",
                        column: x => x.AddressID,
                        principalTable: "Address",
                        principalColumn: "AddressID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserAddress_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "POApproval",
                columns: table => new
                {
                    POApprovalID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    POID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    LastUpdated = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Comment = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POApproval", x => x.POApprovalID);
                    table.ForeignKey(
                        name: "FK_POApproval_PurchaseOrder_POID",
                        column: x => x.POID,
                        principalTable: "PurchaseOrder",
                        principalColumn: "POID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_POApproval_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PODetail",
                columns: table => new
                {
                    POID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    IngredientID = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    UnitPriceExpected = table.Column<decimal>(type: "decimal(65,30)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PODetail", x => new { x.POID, x.IngredientID });
                    table.ForeignKey(
                        name: "FK_PODetail_Ingredient_IngredientID",
                        column: x => x.IngredientID,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PODetail_PurchaseOrder_POID",
                        column: x => x.POID,
                        principalTable: "PurchaseOrder",
                        principalColumn: "POID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Receipt",
                columns: table => new
                {
                    ReceiptID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DateReceive = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StoreID = table.Column<int>(type: "int", nullable: false),
                    SupplierID = table.Column<int>(type: "int", nullable: false),
                    POID = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receipt", x => x.ReceiptID);
                    table.ForeignKey(
                        name: "FK_Receipt_PurchaseOrder_POID",
                        column: x => x.POID,
                        principalTable: "PurchaseOrder",
                        principalColumn: "POID");
                    table.ForeignKey(
                        name: "FK_Receipt_Store_StoreID",
                        column: x => x.StoreID,
                        principalTable: "Store",
                        principalColumn: "StoreID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Receipt_Supplier_SupplierID",
                        column: x => x.SupplierID,
                        principalTable: "Supplier",
                        principalColumn: "SupplierID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Receipt_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ComboProduct",
                columns: table => new
                {
                    ComboID = table.Column<int>(type: "int", nullable: false),
                    ProductVarientID = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(65,30)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComboProduct", x => new { x.ComboID, x.ProductVarientID });
                    table.ForeignKey(
                        name: "FK_ComboProduct_Combo_ComboID",
                        column: x => x.ComboID,
                        principalTable: "Combo",
                        principalColumn: "ComboID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComboProduct_ProductVarient_ProductVarientID",
                        column: x => x.ProductVarientID,
                        principalTable: "ProductVarient",
                        principalColumn: "ProductVarientID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Receipe",
                columns: table => new
                {
                    IngredientID = table.Column<int>(type: "int", nullable: false),
                    ProductVarientID = table.Column<int>(type: "int", nullable: false),
                    QtyBeforeProcess = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    QtyAfterProcess = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receipe", x => new { x.IngredientID, x.ProductVarientID });
                    table.ForeignKey(
                        name: "FK_Receipe_Ingredient_IngredientID",
                        column: x => x.IngredientID,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Receipe_ProductVarient_ProductVarientID",
                        column: x => x.ProductVarientID,
                        principalTable: "ProductVarient",
                        principalColumn: "ProductVarientID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BookingChange",
                columns: table => new
                {
                    ChangeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    BookingStatus = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    comment = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangeAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    BookingID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingChange", x => x.ChangeID);
                    table.ForeignKey(
                        name: "FK_BookingChange_Booking_BookingID",
                        column: x => x.BookingID,
                        principalTable: "Booking",
                        principalColumn: "BookingID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingChange_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Bill",
                columns: table => new
                {
                    BillID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StoreID = table.Column<int>(type: "int", nullable: false),
                    VAT = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    PaymentMethods = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Note = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TicketID = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Total = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Paid = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MoneyReceived = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MoneyGiveBack = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bill", x => x.BillID);
                    table.ForeignKey(
                        name: "FK_Bill_Store_StoreID",
                        column: x => x.StoreID,
                        principalTable: "Store",
                        principalColumn: "StoreID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bill_Ticket_TicketID",
                        column: x => x.TicketID,
                        principalTable: "Ticket",
                        principalColumn: "TicketID");
                    table.ForeignKey(
                        name: "FK_Bill_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TicketUser",
                columns: table => new
                {
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TicketID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketUser", x => new { x.TicketID, x.UserID });
                    table.ForeignKey(
                        name: "FK_TicketUser_Ticket_TicketID",
                        column: x => x.TicketID,
                        principalTable: "Ticket",
                        principalColumn: "TicketID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketUser_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ReceiptChange",
                columns: table => new
                {
                    ReceiptChangeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ReceiptID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UpdateAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReceiptChange", x => x.ReceiptChangeID);
                    table.ForeignKey(
                        name: "FK_ReceiptChange_Receipt_ReceiptID",
                        column: x => x.ReceiptID,
                        principalTable: "Receipt",
                        principalColumn: "ReceiptID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReceiptChange_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ReceiptDetail",
                columns: table => new
                {
                    GoodsReceiptID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    IngredientID = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    GoodQuantity = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(65,30)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReceiptDetail", x => new { x.GoodsReceiptID, x.IngredientID });
                    table.ForeignKey(
                        name: "FK_ReceiptDetail_Ingredient_IngredientID",
                        column: x => x.IngredientID,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReceiptDetail_Receipt_GoodsReceiptID",
                        column: x => x.GoodsReceiptID,
                        principalTable: "Receipt",
                        principalColumn: "ReceiptID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BillChange",
                columns: table => new
                {
                    BillChangeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    BillID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ChangeAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillChange", x => x.BillChangeID);
                    table.ForeignKey(
                        name: "FK_BillChange_Bill_BillID",
                        column: x => x.BillID,
                        principalTable: "Bill",
                        principalColumn: "BillID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BillChange_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BillDetail",
                columns: table => new
                {
                    BillID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ProductVarientID = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    InlineTotal = table.Column<decimal>(type: "decimal(65,30)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillDetail", x => new { x.BillID, x.ProductVarientID });
                    table.ForeignKey(
                        name: "FK_BillDetail_Bill_BillID",
                        column: x => x.BillID,
                        principalTable: "Bill",
                        principalColumn: "BillID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BillDetail_ProductVarient_ProductVarientID",
                        column: x => x.ProductVarientID,
                        principalTable: "ProductVarient",
                        principalColumn: "ProductVarientID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DeliveryInfo",
                columns: table => new
                {
                    DeliveryID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    BillID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    AddressID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ShippingFee = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Note = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryInfo", x => x.DeliveryID);
                    table.ForeignKey(
                        name: "FK_DeliveryInfo_Address_AddressID",
                        column: x => x.AddressID,
                        principalTable: "Address",
                        principalColumn: "AddressID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeliveryInfo_Bill_BillID",
                        column: x => x.BillID,
                        principalTable: "Bill",
                        principalColumn: "BillID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeliveryInfo_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "InventoryBatch",
                columns: table => new
                {
                    BatchID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    WarehouseID = table.Column<int>(type: "int", nullable: false),
                    ImportDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Exp = table.Column<DateOnly>(type: "date", nullable: false),
                    Mfd = table.Column<DateOnly>(type: "date", nullable: false),
                    QuantityOriginal = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    QuantityOnHand = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UnitCost = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    BatchCode = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Note = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IngredientID = table.Column<int>(type: "int", nullable: false),
                    GoodsReceiptID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ReceiptDetailGoodsReceiptID = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    ReceiptDetailIngredientID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryBatch", x => x.BatchID);
                    table.ForeignKey(
                        name: "FK_InventoryBatch_Ingredient_IngredientID",
                        column: x => x.IngredientID,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InventoryBatch_ReceiptDetail_ReceiptDetailGoodsReceiptID_Rec~",
                        columns: x => new { x.ReceiptDetailGoodsReceiptID, x.ReceiptDetailIngredientID },
                        principalTable: "ReceiptDetail",
                        principalColumns: new[] { "GoodsReceiptID", "IngredientID" });
                    table.ForeignKey(
                        name: "FK_InventoryBatch_Warehouse_WarehouseID",
                        column: x => x.WarehouseID,
                        principalTable: "Warehouse",
                        principalColumn: "WarehouseID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DeliveryLog",
                columns: table => new
                {
                    LogID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangeAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Note = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryLog", x => x.LogID);
                    table.ForeignKey(
                        name: "FK_DeliveryLog_DeliveryInfo_DeliveryID",
                        column: x => x.DeliveryID,
                        principalTable: "DeliveryInfo",
                        principalColumn: "DeliveryID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeliveryLog_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StockMovement",
                columns: table => new
                {
                    StockMovementID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    BatchID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    QtyChange = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MovementType = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReferenceType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TimeStamp = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Reason = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Note = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeleteAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    IngredientID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockMovement", x => x.StockMovementID);
                    table.ForeignKey(
                        name: "FK_StockMovement_Ingredient_IngredientID",
                        column: x => x.IngredientID,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientID");
                    table.ForeignKey(
                        name: "FK_StockMovement_InventoryBatch_BatchID",
                        column: x => x.BatchID,
                        principalTable: "InventoryBatch",
                        principalColumn: "BatchID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StockMovement_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Address_StoreID",
                table: "Address",
                column: "StoreID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Address_SupplierID",
                table: "Address",
                column: "SupplierID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bill_StoreID",
                table: "Bill",
                column: "StoreID");

            migrationBuilder.CreateIndex(
                name: "IX_Bill_TicketID",
                table: "Bill",
                column: "TicketID");

            migrationBuilder.CreateIndex(
                name: "IX_Bill_UserID",
                table: "Bill",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_BillChange_BillID",
                table: "BillChange",
                column: "BillID");

            migrationBuilder.CreateIndex(
                name: "IX_BillChange_EmployeeID",
                table: "BillChange",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_BillDetail_ProductVarientID",
                table: "BillDetail",
                column: "ProductVarientID");

            migrationBuilder.CreateIndex(
                name: "IX_BlackListedToken_Token",
                table: "BlackListedToken",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Booking_TableID",
                table: "Booking",
                column: "TableID");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_UserID",
                table: "Booking",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingChange_BookingID",
                table: "BookingChange",
                column: "BookingID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingChange_EmployeeID",
                table: "BookingChange",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_ComboProduct_ProductVarientID",
                table: "ComboProduct",
                column: "ProductVarientID");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryInfo_AddressID",
                table: "DeliveryInfo",
                column: "AddressID");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryInfo_BillID",
                table: "DeliveryInfo",
                column: "BillID");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryInfo_UserID",
                table: "DeliveryInfo",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryLog_DeliveryID",
                table: "DeliveryLog",
                column: "DeliveryID");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryLog_EmployeeID",
                table: "DeliveryLog",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_DiningTable_StoreID",
                table: "DiningTable",
                column: "StoreID");

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationToken_UserID",
                table: "EmailVerificationToken",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryBatch_IngredientID",
                table: "InventoryBatch",
                column: "IngredientID");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryBatch_ReceiptDetailGoodsReceiptID_ReceiptDetailIngr~",
                table: "InventoryBatch",
                columns: new[] { "ReceiptDetailGoodsReceiptID", "ReceiptDetailIngredientID" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryBatch_WarehouseID",
                table: "InventoryBatch",
                column: "WarehouseID");

            migrationBuilder.CreateIndex(
                name: "IX_POApproval_EmployeeID",
                table: "POApproval",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_POApproval_POID",
                table: "POApproval",
                column: "POID");

            migrationBuilder.CreateIndex(
                name: "IX_PODetail_IngredientID",
                table: "PODetail",
                column: "IngredientID");

            migrationBuilder.CreateIndex(
                name: "IX_Product_CategoryID",
                table: "Product",
                column: "CategoryID");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVarient_ProductID",
                table: "ProductVarient",
                column: "ProductID");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrder_StoreID",
                table: "PurchaseOrder",
                column: "StoreID");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrder_SupplierID",
                table: "PurchaseOrder",
                column: "SupplierID");

            migrationBuilder.CreateIndex(
                name: "IX_Receipe_ProductVarientID",
                table: "Receipe",
                column: "ProductVarientID");

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_EmployeeID",
                table: "Receipt",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_POID",
                table: "Receipt",
                column: "POID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_StoreID",
                table: "Receipt",
                column: "StoreID");

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_SupplierID",
                table: "Receipt",
                column: "SupplierID");

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptChange_EmployeeID",
                table: "ReceiptChange",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptChange_ReceiptID",
                table: "ReceiptChange",
                column: "ReceiptID");

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptDetail_IngredientID",
                table: "ReceiptDetail",
                column: "IngredientID");

            migrationBuilder.CreateIndex(
                name: "IX_Shift_EmployeeID",
                table: "Shift",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovement_BatchID",
                table: "StockMovement",
                column: "BatchID");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovement_EmployeeID",
                table: "StockMovement",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovement_IngredientID",
                table: "StockMovement",
                column: "IngredientID");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_UserID",
                table: "Ticket",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_TicketUser_UserID",
                table: "TicketUser",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_User_Email",
                table: "User",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_Phone",
                table: "User",
                column: "Phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_StoreID",
                table: "User",
                column: "StoreID");

            migrationBuilder.CreateIndex(
                name: "IX_User_UserName",
                table: "User",
                column: "UserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserAddress_AddressID",
                table: "UserAddress",
                column: "AddressID");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouse_StoreID",
                table: "Warehouse",
                column: "StoreID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillChange");

            migrationBuilder.DropTable(
                name: "BillDetail");

            migrationBuilder.DropTable(
                name: "BlackListedToken");

            migrationBuilder.DropTable(
                name: "BookingChange");

            migrationBuilder.DropTable(
                name: "ComboProduct");

            migrationBuilder.DropTable(
                name: "DeliveryLog");

            migrationBuilder.DropTable(
                name: "EmailVerificationToken");

            migrationBuilder.DropTable(
                name: "POApproval");

            migrationBuilder.DropTable(
                name: "PODetail");

            migrationBuilder.DropTable(
                name: "Receipe");

            migrationBuilder.DropTable(
                name: "ReceiptChange");

            migrationBuilder.DropTable(
                name: "Shift");

            migrationBuilder.DropTable(
                name: "StockMovement");

            migrationBuilder.DropTable(
                name: "TicketUser");

            migrationBuilder.DropTable(
                name: "UserAddress");

            migrationBuilder.DropTable(
                name: "Booking");

            migrationBuilder.DropTable(
                name: "Combo");

            migrationBuilder.DropTable(
                name: "DeliveryInfo");

            migrationBuilder.DropTable(
                name: "ProductVarient");

            migrationBuilder.DropTable(
                name: "InventoryBatch");

            migrationBuilder.DropTable(
                name: "DiningTable");

            migrationBuilder.DropTable(
                name: "Address");

            migrationBuilder.DropTable(
                name: "Bill");

            migrationBuilder.DropTable(
                name: "Product");

            migrationBuilder.DropTable(
                name: "ReceiptDetail");

            migrationBuilder.DropTable(
                name: "Warehouse");

            migrationBuilder.DropTable(
                name: "Ticket");

            migrationBuilder.DropTable(
                name: "Category");

            migrationBuilder.DropTable(
                name: "Ingredient");

            migrationBuilder.DropTable(
                name: "Receipt");

            migrationBuilder.DropTable(
                name: "PurchaseOrder");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "Supplier");

            migrationBuilder.DropTable(
                name: "Store");
        }
    }
}
