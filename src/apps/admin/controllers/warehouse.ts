import Warehouse from "../../../repositories/admin/warehouse/model";
import BaseController, {
    ControllerOptions,
} from "../../../core/mongoose-controller/controller";
import WarehouseRepository from "../../../repositories/admin/warehouse/repository";
import ProductWarehouseRepository from "../../../repositories/admin/productWarehouse/repository";
import PurchaseInvoiceRepository from "../../../repositories/admin/purchaseInvoice/repository";
import PurchaseInvoiceItemRepository from "../../../repositories/admin/purchaseInvoiceItem/repository";
import SaleInvoiceRepository from "../../../repositories/admin/saleInvoice/repository";
import SaleInvoiceItemRepository from "../../../repositories/admin/saleInvoiceItem/repository";
import InventoryHistoryRepository from "../../../repositories/admin/inventoryHistory/repository";
import WarehouseTransferRepository from "../../../repositories/admin/warehouseTransfer/repository";
import {Get, Post, Put, Delete} from "../../../core/decorators/method";
import {Query, Body} from "../../../core/decorators/parameters";
import {z} from "zod";
import InventoryService from "../../services/inventoryService";
import InventoryReportService from "../../services/inventoryReportService";

export class WarehouseController extends BaseController<Warehouse> {
    private inventoryRepo: ProductWarehouseRepository;
    private purchaseInvoiceRepo: PurchaseInvoiceRepository;
    private purchaseInvoiceItemRepo: PurchaseInvoiceItemRepository;
    private saleInvoiceRepo: SaleInvoiceRepository;
    private saleInvoiceItemRepo: SaleInvoiceItemRepository;
    private inventoryHistoryRepo: InventoryHistoryRepository;
    private warehouseTransferRepo: WarehouseTransferRepository;
    private inventoryService: InventoryService;
    private inventoryReportService: InventoryReportService;
    private repo: any;

    constructor(
        baseRoute: string,
        repo: WarehouseRepository,
        options?: ControllerOptions
    ) {
        super(baseRoute, repo, options);
        this.inventoryRepo = new ProductWarehouseRepository();
        this.purchaseInvoiceRepo = new PurchaseInvoiceRepository();
        this.purchaseInvoiceItemRepo = new PurchaseInvoiceItemRepository();
        this.saleInvoiceRepo = new SaleInvoiceRepository();
        this.saleInvoiceItemRepo = new SaleInvoiceItemRepository();
        this.inventoryHistoryRepo = new InventoryHistoryRepository();
        this.warehouseTransferRepo = new WarehouseTransferRepository();
        this.inventoryService = new InventoryService();
        this.inventoryReportService = new InventoryReportService();
    }

    initApis() {
        super.initApis();
    }

    @Get("")
    async getWarehouses(@Query({schema: z.object({page: z.number().default(1), limit: z.number().default(10)})}) query: { page: number; limit: number }) {
        const {page, limit} = query;
        const warehouses = await this.repo.find({}, {skip: (page - 1) * limit, limit});
        const total = await this.repo.count({});
        return {warehouses, total};
    }

    @Post("")
    async createWarehouse(
        @Body({
            schema: z.object({
                title: z.string(),
                description: z.string().max(250).default("digital warehouse"),
                address: z.string().max(500).default("tehran"),
                phone: z.string().max(11).default("09123334444"),
                manager: BaseController.id,
                capacity: z.number().default(1000),
                is_active: z.boolean().default(true),
            }),
        })
        data: {
            title: string;
            description: string;
            address: string;
            phone: string;
            manager: string;
            capacity: number;
            is_active: boolean;
        }
    ) {
        return this.repo.create(data);
    }

    @Put("/:warehouseId")
    async updateWarehouse(
        @Query({destination: "warehouseId", schema: BaseController.id}) warehouseId: string,
        @Body({
            schema: z.object({
                title: z.string().optional(),
                description: z.string().max(250).optional(),
                address: z.string().max(500).optional(),
                phone: z.string().max(11).optional(),
                manager: BaseController.id.optional(),
                capacity: z.number().optional(),
                is_active: z.boolean().optional(),
            }),
        })
        data: {
            title?: string;
            description?: string;
            address?: string;
            phone?: string;
            manager?: string;
            capacity?: number;
            is_active?: boolean;
        }
    ) {
        return this.repo.editById(warehouseId, {$set: {...data, updated_at: new Date()}}, {new: true});
    }

    @Delete("/:warehouseId")
    async deactivateWarehouse(@Query({destination: "warehouseId", schema: BaseController.id}) warehouseId: string) {
        await this.repo.editById(warehouseId, {$set: {is_active: false, updated_at: new Date()}}, {new: true});
        return {message: "Warehouse deactivated"};
    }

    @Get("/:warehouseId/inventory")
    async getInventory(
        @Query({destination: "warehouseId", schema: BaseController.id}) warehouseId: string,
        @Query({schema: z.object({page: z.number().default(1), limit: z.number().default(10)})}) query: { page: number; limit: number }
    ) {
        const {page, limit} = query;
        const {inventory, total} = await this.inventoryService.listInventory(
            {warehouse: warehouseId},
            {skip: (page - 1) * limit, limit}
        );
        return {inventory, total};
    }

    @Post("/:warehouseId/inventory")
    async addInventory(
        @Query({destination: "warehouseId", schema: BaseController.id}) warehouseId: string,
        @Body({
            schema: z.object({
                variantId: BaseController.id,
                quantity: z.number().min(1),
                variantPrice: z.number(),
                purchasePrice: z.number(),
                min_stock_threshold: z.number().default(10),
                batch_number: z.string(),
            }),
        })
        data: {
            variantId: string;
            quantity: number;
            variantPrice: number;
            purchasePrice: number;
            min_stock_threshold: number;
            batch_number: string;
        }
    ) {
        // کد قبلی برای افزایش موجودی به شکل زیر بود و برای ردیابی نگهداری شده است:
        /*
        const inventory = await this.inventoryRepo.updateStock(...);
        await this.inventoryHistoryRepo.create({ ... });
        return inventory;
        */
        return this.inventoryService.adjustStock({
            warehouseId,
            variantId: data.variantId,
            batchNumber: data.batch_number,
            quantityDelta: data.quantity,
            variantPrice: data.variantPrice,
            purchasePrice: data.purchasePrice,
            reason: "Manual inventory update",
            changeType: "adjustment",
        });
    }

    @Put("/inventory/:inventory_id")
    async updateInventory(
        @Query({destination: "inventory_id", schema: BaseController.id}) inventory_id: string,
        @Body({
            schema: z.object({
                quantity: z.number().min(0).optional(),
                variantPrice: z.number().optional(),
                purchasePrice: z.number().optional(),
                min_stock_threshold: z.number().optional(),
                batch_number: z.string().optional(),
            }),
        })
        data: {
            quantity?: number;
            variantPrice?: number;
            purchasePrice?: number;
            min_stock_threshold?: number;
            batch_number?: string;
        }
    ) {
        // منطق قدیمی به شکل زیر بوده است و فقط برای رجوع در آینده نگهداری می‌شود:
        /*
        const inventory = await this.inventoryRepo.editById(...);
        if (data.quantity) { await this.inventoryHistoryRepo.create(...); }
        return inventory;
        */
        return this.inventoryService.updateInventoryRecord({
            inventoryId: inventory_id,
            data: {
                quantity: data.quantity,
                variantPrice: data.variantPrice,
                purchasePrice: data.purchasePrice,
                minStockThreshold: data.min_stock_threshold,
                batchNumber: data.batch_number,
            },
            reason: "Inventory update",
        });
    }

    @Post("/purchase-invoices")
    async createPurchaseInvoice(
        @Body({
            schema: z.object({
                warehouseId: BaseController.id,
                supplier_id: BaseController.id,
                invoice_date: z.date().default(() => new Date()),
                items: z.array(
                    z.object({
                        variantId: BaseController.id,
                        quantity: z.number().min(1),
                        unit_purchasePrice: z.number(),
                        batch_number: z.string(),
                    })
                ),
            }),
        })
        data: {
            warehouseId: string;
            supplier_id: string;
            invoice_date: Date;
            items: Array<{
                variantId: string;
                quantity: number;
                unit_purchasePrice: number;
                batch_number: string;
            }>;
        }
    ) {
        const total_amount = data.items.reduce((sum, item) => sum + item.quantity * item.unit_purchasePrice, 0);
        const invoice = await this.purchaseInvoiceRepo.create({
            warehouseId: data.warehouseId,
            supplier_id: data.supplier_id,
            invoice_date: data.invoice_date,
            total_amount,
            status: "pending",
        });

        for (const item of data.items) {
            await this.purchaseInvoiceItemRepo.create({
                purchase_invoice_id: invoice._id,
                variantId: item.variantId,
                quantity: item.quantity,
                unit_purchasePrice: item.unit_purchasePrice,
                batch_number: item.batch_number,
            });

            // منطق قدیمی ذخیره موجودی در این بخش:
            /*
            const inventory = await this.inventoryRepo.updateStock(...);
            await this.inventoryHistoryRepo.create(...);
            */
            await this.inventoryService.adjustStock({
                warehouseId: data.warehouseId,
                variantId: item.variantId,
                batchNumber: item.batch_number,
                quantityDelta: item.quantity,
                variantPrice: item.unit_purchasePrice,
                purchasePrice: item.unit_purchasePrice,
                reason: `Purchase Invoice #${invoice._id}`,
                changeType: "purchase",
            });
        }

        return {...invoice.toObject(), items: data.items};
    }

    @Get("/purchase-invoices")
    async getPurchaseInvoices(
        @Query({
            schema: z.object({
                warehouseId: BaseController.id.optional(),
                supplier_id: BaseController.id.optional(),
                status: z.enum(["pending", "confirmed", "canceled"]).optional(),
                page: z.number().default(1),
                limit: z.number().default(10),
            }),
        })
        query: {
            warehouseId?: string;
            supplier_id?: string;
            status?: "pending" | "confirmed" | "canceled";
            page: number;
            limit: number;
        }
    ) {
        const filter: any = {};
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        if (query.supplier_id) filter.supplier_id = query.supplier_id;
        if (query.status) filter.status = query.status;

        const invoices = await this.purchaseInvoiceRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.purchaseInvoiceRepo.count(filter);
        return {invoices, total};
    }

    @Put("/purchase-invoices/:purchase_invoice_id")
    async updatePurchaseInvoice(
        @Query({destination: "purchase_invoice_id", schema: BaseController.id}) purchase_invoice_id: string,
        @Body({schema: z.object({status: z.enum(["pending", "confirmed", "canceled"])})}) data: { status: "pending" | "confirmed" | "canceled" }
    ) {
        return this.purchaseInvoiceRepo.editById(
            purchase_invoice_id,
            {$set: {status: data.status, updated_at: new Date()}},
            {new: true}
        );
    }

    @Post("/sale-invoices")
    async createSaleInvoice(
        @Body({
            schema: z.object({
                warehouseId: BaseController.id,
                buyer_id: BaseController.id,
                order_id: BaseController.id,
                invoice_date: z.date().default(() => new Date()),
                items: z.array(
                    z.object({
                        variantId: BaseController.id,
                        quantity: z.number().min(1),
                        unit_sale_price: z.number(),
                        batch_number: z.string(),
                    })
                ),
            }),
        })
        data: {
            warehouseId: string;
            buyer_id: string;
            order_id: string;
            invoice_date: Date;
            items: Array<{
                variantId: string;
                quantity: number;
                unit_sale_price: number;
                batch_number: string;
            }>;
        }
    ) {
        // Check stock availability
        for (const item of data.items) {
            const inventory = await this.inventoryRepo.findOne({
                warehouseId: data.warehouseId,
                variantId: item.variantId,
                batch_number: item.batch_number,
            });
            if (!inventory || inventory.quantity < item.quantity) {
                throw new Error(`Insufficient stock for variant ${item.variantId} in batch ${item.batch_number}`);
            }
        }

        const total_amount = data.items.reduce((sum, item) => sum + item.quantity * item.unit_sale_price, 0);
        const invoice = await this.saleInvoiceRepo.create({
            warehouseId: data.warehouseId,
            buyer_id: data.buyer_id,
            order_id: data.order_id,
            invoice_date: data.invoice_date,
            total_amount,
            status: "pending",
        });

        for (const item of data.items) {
            await this.saleInvoiceItemRepo.create({
                sale_invoice_id: invoice._id,
                variantId: item.variantId,
                quantity: item.quantity,
                unit_sale_price: item.unit_sale_price,
                batch_number: item.batch_number,
            });

            // منطق قبلی به شکل زیر بوده است:
            /*
            const inventory = await this.inventoryRepo.updateStock(...);
            await this.inventoryHistoryRepo.create(...);
            */
            await this.inventoryService.adjustStock({
                warehouseId: data.warehouseId,
                variantId: item.variantId,
                batchNumber: item.batch_number,
                quantityDelta: -item.quantity,
                variantPrice: item.unit_sale_price,
                purchasePrice: item.unit_sale_price,
                reason: `Sale Invoice #${invoice._id}`,
                changeType: "sale",
            });
        }

        return {...invoice.toObject(), items: data.items};
    }

    @Get("/sale-invoices")
    async getSaleInvoices(
        @Query({
            schema: z.object({
                warehouseId: BaseController.id.optional(),
                buyer_id: BaseController.id.optional(),
                order_id: BaseController.id.optional(),
                status: z.enum(["pending", "confirmed", "canceled"]).optional(),
                page: z.number().default(1),
                limit: z.number().default(10),
            }),
        })
        query: {
            warehouseId?: string;
            buyer_id?: string;
            order_id?: string;
            status?: "pending" | "confirmed" | "canceled";
            page: number;
            limit: number;
        }
    ) {
        const filter: any = {};
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        if (query.buyer_id) filter.buyer_id = query.buyer_id;
        if (query.order_id) filter.order_id = query.order_id;
        if (query.status) filter.status = query.status;

        const invoices = await this.saleInvoiceRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.saleInvoiceRepo.count(filter);
        return {invoices, total};
    }

    @Put("/sale-invoices/:sale_invoice_id")
    async updateSaleInvoice(
        @Query({destination: "sale_invoice_id", schema: BaseController.id}) sale_invoice_id: string,
        @Body({schema: z.object({status: z.enum(["pending", "confirmed", "canceled"])})}) data: { status: "pending" | "confirmed" | "canceled" }
    ) {
        return this.saleInvoiceRepo.editById(
            sale_invoice_id,
            {$set: {status: data.status, updated_at: new Date()}},
            {new: true}
        );
    }

    @Post("/warehouse-transfers")
    async createWarehouseTransfer(
        @Body({
            schema: z.object({
                from_warehouseId: BaseController.id,
                to_warehouseId: BaseController.id,
                variantId: BaseController.id,
                quantity: z.number().min(1),
                batch_number: z.string(),
            }),
        })
        data: {
            from_warehouseId: string;
            to_warehouseId: string;
            variantId: string;
            quantity: number;
            batch_number: string;
        }
    ) {
        const fromInventory = await this.inventoryRepo.findOne({
            warehouseId: data.from_warehouseId,
            variantId: data.variantId,
            batch_number: data.batch_number,
        });
        if (!fromInventory || fromInventory.quantity < data.quantity) {
            throw new Error(`Insufficient stock in source warehouse for variant ${data.variantId}`);
        }

        const transfer = await this.warehouseTransferRepo.create({
            from_warehouseId: data.from_warehouseId,
            to_warehouseId: data.to_warehouseId,
            variantId: data.variantId,
            quantity: data.quantity,
            batch_number: data.batch_number,
            status: "pending",
        });

        // منطق قدیمی بروزرسانی موجودی‌ها در انتقال در بلوک زیر نگهداری شده است:
        /*
        const fromInventoryUpdated = await this.inventoryRepo.updateStock(...);
        const toInventory = await this.inventoryRepo.updateStock(...);
        await this.inventoryHistoryRepo.create(...);
        */
        await this.inventoryService.transferStock({
            fromWarehouseId: data.from_warehouseId,
            toWarehouseId: data.to_warehouseId,
            variantId: data.variantId,
            batchNumber: data.batch_number,
            quantity: data.quantity,
            variantPrice: fromInventory.variantPrice,
            purchasePrice: fromInventory.purchasePrice,
            transferId: transfer._id.toString(),
        });

        return transfer;
    }

    @Get("/warehouse-transfers")
    async getWarehouseTransfers(
        @Query({
            schema: z.object({
                from_warehouseId: BaseController.id.optional(),
                to_warehouseId: BaseController.id.optional(),
                status: z.enum(["pending", "confirmed", "canceled"]).optional(),
                page: z.number().default(1),
                limit: z.number().default(10),
            }),
        })
        query: {
            from_warehouseId?: string;
            to_warehouseId?: string;
            status?: "pending" | "confirmed" | "canceled";
            page: number;
            limit: number;
        }
    ) {
        const filter: any = {};
        if (query.from_warehouseId) filter.from_warehouseId = query.from_warehouseId;
        if (query.to_warehouseId) filter.to_warehouseId = query.to_warehouseId;
        if (query.status) filter.status = query.status;

        const transfers = await this.warehouseTransferRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.warehouseTransferRepo.count(filter);
        return {transfers, total};
    }

    @Get("/inventory/low-stock")
    async getLowStock(
        @Query({
            schema: z.object({
                warehouseId: BaseController.id.optional(),
                threshold: z.number().default(10),
            }),
        })
        query: { warehouseId?: string; threshold: number }
    ) {
        const filter: any = {quantity: {$lte: query.threshold}};
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        const inventory = await this.inventoryRepo.find(filter);
        const total = await this.inventoryRepo.count(filter);
        return {inventory, total};
    }

    @Get("/inventory/history/:inventory_id")
    async getInventoryHistory(
        @Query({destination: "inventory_id", schema: BaseController.id}) inventory_id: string,
        @Query({schema: z.object({page: z.number().default(1), limit: z.number().default(10)})}) query: { page: number; limit: number }
    ) {
        const history = await this.inventoryHistoryRepo.find(
            {inventory_id},
            {skip: (query.page - 1) * query.limit, limit: query.limit}
        );
        const total = await this.inventoryHistoryRepo.count({inventory_id});
        return {history, total};
    }

    /**
     * توضیح فارسی: دریافت گزارش موجودی کم
     */
    @Get("/reports/low-stock")
    async getLowStockReport(
        @Query({
            schema: z.object({
                warehouseId: BaseController.id.optional(),
                threshold: z.number().default(10),
            }),
        })
        query: { warehouseId?: string; threshold: number }
    ) {
        const report = await this.inventoryReportService.getLowStockReport(
            query.warehouseId,
            query.threshold
        );
        return { report, total: report.length };
    }

    /**
     * توضیح فارسی: دریافت تاریخچه حرکت موجودی
     */
    @Get("/reports/movements")
    async getMovementHistory(
        @Query({
            schema: z.object({
                inventoryId: BaseController.id.optional(),
                warehouseId: BaseController.id.optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                changeType: z.enum(["purchase", "sale", "transfer", "adjustment"]).optional(),
                page: z.number().default(1),
                limit: z.number().default(50),
            }),
        })
        query: {
            inventoryId?: string;
            warehouseId?: string;
            startDate?: string;
            endDate?: string;
            changeType?: "purchase" | "sale" | "transfer" | "adjustment";
            page: number;
            limit: number;
        }
    ) {
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        const endDate = query.endDate ? new Date(query.endDate) : undefined;
        
        const result = await this.inventoryReportService.getMovementHistory(
            query.inventoryId,
            query.warehouseId,
            startDate,
            endDate,
            query.changeType,
            query.page,
            query.limit
        );
        return result;
    }

    /**
     * توضیح فارسی: دریافت گزارش موجودی بر اساس انبار
     */
    @Get("/reports/warehouse-inventory")
    async getWarehouseInventoryReport(
        @Query({
            schema: z.object({
                warehouseId: BaseController.id.optional(),
            }),
        })
        query: { warehouseId?: string }
    ) {
        const report = await this.inventoryReportService.getWarehouseInventoryReport(
            query.warehouseId
        );
        return { report };
    }

    /**
     * توضیح فارسی: دریافت خلاصه موجودی (برای داشبورد)
     */
    @Get("/reports/summary")
    async getInventorySummary() {
        const summary = await this.inventoryReportService.getInventorySummary();
        return { summary };
    }

    /**
     * توضیح فارسی: دریافت گزارش موجودی یک محصول خاص
     */
    @Get("/reports/product/:productId")
    async getProductInventoryReport(
        @Query({destination: "productId", schema: BaseController.id}) productId: string
    ) {
        const report = await this.inventoryReportService.getProductInventoryReport(productId);
        return { report };
    }
}

const warehouse = new WarehouseController("/warehouse", new WarehouseRepository(), {
    insertSchema: z.object({
        title: z.string(),
        description: z.string().max(250).default("digital warehouse"),
        address: z.string().max(500).default("tehran"),
        phone: z.string().max(11).default("09123334444"),
        manager: BaseController.id,
        capacity: z.number().default(1000),
        is_active: z.boolean().default(true),
    }),
});

export default warehouse;


// import Warehouse from "../../../repositories/admin/warehouse/model";
// import BaseController, {
//   ControllerOptions,
// } from "../../../core/mongoose-controller/controller";
// import WarehouseRepository from "../../../repositories/admin/warehouse/repository";
// import { Put } from "../../../core/decorators/method";
// import { Query, Body } from "../../../core/decorators/parameters";
// import {boolean, z} from "zod";
// import {now} from "moment-jalaali";
//
// export class WarehouseController extends BaseController<Warehouse> {
//   constructor(
//     baseRoute: string,
//     repo: WarehouseRepository,
//     options?: ControllerOptions
//   ) {
//     super(baseRoute, repo, options);
    //   }
    //
    //   initApis() {
//     super.initApis();
//   }
//
//   // @Put("/update", {
//   //   absolute: true,
//   // })
//   // async update()
//   // @Query({
//   //   destination: "id",
//   //   schema: BaseController.id,
//   // })
//   // id: string,
//   // @Body({
//   //   schema: z.object({
//   //     title: z.string(),
//   //     description: z.string().max(250).default("digital warehouse"),
//   //     address: z.string().max(500).default("tehran"),
//   //     phone: z.string().max(11).default("09123334444"),
//   //   }),
//   // })
//   // data: {
//   //   title: string;
//   //   description: string;
//   //   address: string;
//   //   phone: string;
//   // }
//   // {
//   //   return this.editById(
//   //     id,
//   //     {
//   //       $set: data,
//   //     },
//   //     {
//   //       ok: true,
//   //     }
//   //   );
//   // }
// }
// const warehouse = new WarehouseController(
//   "/warehouse",
//   new WarehouseRepository(),
//   {
//     insertSchema: z.object({
//       title: z.string(),
//       description: z.string().max(250).default("digital warehouse"),
//       address: z.string().max(500).default("tehran"),
//       phone: z.string().max(11).default("09123334444"),
//       manager: BaseController.id,
//       is_actvie: boolean().default(true),
//       // created_at: z.timestamp without time zone,
//     }),
//   }
// );
// export default warehouse;
//
// // console.log("shah meyti");
//
// // data: any
// // ) {
// //   return this.editById(
// //     id,
// //     {
// //       $set: data,
// //     },
// //     {
// //       ok: true,
// //     }
// //   );
// // }
