"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/warehouse/repository"));
const repository_2 = __importDefault(require("../../../repositories/admin/productWarehouse/repository"));
const repository_3 = __importDefault(require("../../../repositories/admin/purchaseInvoice/repository"));
const repository_4 = __importDefault(require("../../../repositories/admin/purchaseInvoiceItem/repository"));
const repository_5 = __importDefault(require("../../../repositories/admin/saleInvoice/repository"));
const repository_6 = __importDefault(require("../../../repositories/admin/saleInvoiceItem/repository"));
const repository_7 = __importDefault(require("../../../repositories/admin/inventoryHistory/repository"));
const repository_8 = __importDefault(require("../../../repositories/admin/warehouseTransfer/repository"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const zod_1 = require("zod");
class WarehouseController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.inventoryRepo = new repository_2.default();
        this.purchaseInvoiceRepo = new repository_3.default();
        this.purchaseInvoiceItemRepo = new repository_4.default();
        this.saleInvoiceRepo = new repository_5.default();
        this.saleInvoiceItemRepo = new repository_6.default();
        this.inventoryHistoryRepo = new repository_7.default();
        this.warehouseTransferRepo = new repository_8.default();
    }
    initApis() {
        super.initApis();
    }
    async getWarehouses(query) {
        const { page, limit } = query;
        const warehouses = await this.repo.find({}, { skip: (page - 1) * limit, limit });
        const total = await this.repo.count({});
        return { warehouses, total };
    }
    async createWarehouse(data) {
        return this.repo.create(data);
    }
    async updateWarehouse(warehouseId, data) {
        return this.repo.editById(warehouseId, { $set: { ...data, updated_at: new Date() } }, { new: true });
    }
    async deactivateWarehouse(warehouseId) {
        await this.repo.editById(warehouseId, { $set: { is_active: false, updated_at: new Date() } }, { new: true });
        return { message: "Warehouse deactivated" };
    }
    async getInventory(warehouseId, query) {
        const { page, limit } = query;
        const inventory = await this.inventoryRepo.find({ warehouseId }, { skip: (page - 1) * limit, limit });
        const total = await this.inventoryRepo.count({ warehouseId });
        return { inventory, total };
    }
    async addInventory(warehouseId, data) {
        const inventory = await this.inventoryRepo.updateStock(warehouseId, data.variantId, data.batch_number, data.quantity, data.variantPrice, data.purchasePrice);
        await this.inventoryHistoryRepo.create({
            inventory_id: inventory._id,
            change_type: "adjustment",
            quantity_changed: data.quantity,
            batch_number: data.batch_number,
            reason: "Manual inventory update",
        });
        return inventory;
    }
    async updateInventory(inventory_id, data) {
        const inventory = await this.inventoryRepo.editById(inventory_id, { $set: { ...data, last_updated: new Date() } }, { new: true });
        if (data.quantity) {
            await this.inventoryHistoryRepo.create({
                inventory_id,
                change_type: "adjustment",
                quantity_changed: data.quantity,
                batch_number: data.batch_number || inventory.batch_number,
                reason: "Inventory update",
            });
        }
        return inventory;
    }
    async createPurchaseInvoice(data) {
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
            const inventory = await this.inventoryRepo.updateStock(data.warehouseId, item.variantId, item.batch_number, item.quantity, item.unit_purchasePrice, // Assuming variantPrice is same as purchase price for simplicity
            item.unit_purchasePrice);
            await this.inventoryHistoryRepo.create({
                inventory_id: inventory._id,
                change_type: "purchase",
                quantity_changed: item.quantity,
                batch_number: item.batch_number,
                reason: `Purchase Invoice #${invoice._id}`,
            });
        }
        return { ...invoice.toObject(), items: data.items };
    }
    async getPurchaseInvoices(query) {
        const filter = {};
        if (query.warehouseId)
            filter.warehouseId = query.warehouseId;
        if (query.supplier_id)
            filter.supplier_id = query.supplier_id;
        if (query.status)
            filter.status = query.status;
        const invoices = await this.purchaseInvoiceRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.purchaseInvoiceRepo.count(filter);
        return { invoices, total };
    }
    async updatePurchaseInvoice(purchase_invoice_id, data) {
        return this.purchaseInvoiceRepo.editById(purchase_invoice_id, { $set: { status: data.status, updated_at: new Date() } }, { new: true });
    }
    async createSaleInvoice(data) {
        var _a;
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
            const inventory = await this.inventoryRepo.updateStock(data.warehouseId, item.variantId, item.batch_number, -item.quantity, // Decrease stock
            item.unit_sale_price, ((_a = (await this.inventoryRepo.findOne({ variantId: item.variantId, batch_number: item.batch_number }))) === null || _a === void 0 ? void 0 : _a.purchasePrice) || 0);
            await this.inventoryHistoryRepo.create({
                inventory_id: inventory._id,
                change_type: "sale",
                quantity_changed: -item.quantity,
                batch_number: item.batch_number,
                reason: `Sale Invoice #${invoice._id}`,
            });
        }
        return { ...invoice.toObject(), items: data.items };
    }
    async getSaleInvoices(query) {
        const filter = {};
        if (query.warehouseId)
            filter.warehouseId = query.warehouseId;
        if (query.buyer_id)
            filter.buyer_id = query.buyer_id;
        if (query.order_id)
            filter.order_id = query.order_id;
        if (query.status)
            filter.status = query.status;
        const invoices = await this.saleInvoiceRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.saleInvoiceRepo.count(filter);
        return { invoices, total };
    }
    async updateSaleInvoice(sale_invoice_id, data) {
        return this.saleInvoiceRepo.editById(sale_invoice_id, { $set: { status: data.status, updated_at: new Date() } }, { new: true });
    }
    async createWarehouseTransfer(data) {
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
        const fromInventoryUpdated = await this.inventoryRepo.updateStock(data.from_warehouseId, data.variantId, data.batch_number, -data.quantity, fromInventory.variantPrice, fromInventory.purchasePrice);
        const toInventory = await this.inventoryRepo.updateStock(data.to_warehouseId, data.variantId, data.batch_number, data.quantity, fromInventory.variantPrice, fromInventory.purchasePrice);
        await this.inventoryHistoryRepo.create({
            inventory_id: fromInventoryUpdated._id,
            change_type: "transfer",
            quantity_changed: -data.quantity,
            batch_number: data.batch_number,
            reason: `Transfer #${transfer._id} from warehouse ${data.from_warehouseId}`,
        });
        await this.inventoryHistoryRepo.create({
            inventory_id: toInventory._id,
            change_type: "transfer",
            quantity_changed: data.quantity,
            batch_number: data.batch_number,
            reason: `Transfer #${transfer._id} to warehouse ${data.to_warehouseId}`,
        });
        return transfer;
    }
    async getWarehouseTransfers(query) {
        const filter = {};
        if (query.from_warehouseId)
            filter.from_warehouseId = query.from_warehouseId;
        if (query.to_warehouseId)
            filter.to_warehouseId = query.to_warehouseId;
        if (query.status)
            filter.status = query.status;
        const transfers = await this.warehouseTransferRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.warehouseTransferRepo.count(filter);
        return { transfers, total };
    }
    async getLowStock(query) {
        const filter = { quantity: { $lte: query.threshold } };
        if (query.warehouseId)
            filter.warehouseId = query.warehouseId;
        const inventory = await this.inventoryRepo.find(filter);
        const total = await this.inventoryRepo.count(filter);
        return { inventory, total };
    }
    async getInventoryHistory(inventory_id, query) {
        const history = await this.inventoryHistoryRepo.find({ inventory_id }, { skip: (query.page - 1) * query.limit, limit: query.limit });
        const total = await this.inventoryHistoryRepo.count({ inventory_id });
        return { history, total };
    }
}
exports.WarehouseController = WarehouseController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({ schema: zod_1.z.object({ page: zod_1.z.number().default(1), limit: zod_1.z.number().default(10) }) }))
], WarehouseController.prototype, "getWarehouses", null);
__decorate([
    (0, method_1.Post)(""),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string().max(250).default("digital warehouse"),
            address: zod_1.z.string().max(500).default("tehran"),
            phone: zod_1.z.string().max(11).default("09123334444"),
            manager: controller_1.default.id,
            capacity: zod_1.z.number().default(1000),
            is_active: zod_1.z.boolean().default(true),
        }),
    }))
], WarehouseController.prototype, "createWarehouse", null);
__decorate([
    (0, method_1.Put)("/:warehouseId"),
    __param(0, (0, parameters_1.Query)({ destination: "warehouseId", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            title: zod_1.z.string().optional(),
            description: zod_1.z.string().max(250).optional(),
            address: zod_1.z.string().max(500).optional(),
            phone: zod_1.z.string().max(11).optional(),
            manager: controller_1.default.id.optional(),
            capacity: zod_1.z.number().optional(),
            is_active: zod_1.z.boolean().optional(),
        }),
    }))
], WarehouseController.prototype, "updateWarehouse", null);
__decorate([
    (0, method_1.Delete)("/:warehouseId"),
    __param(0, (0, parameters_1.Query)({ destination: "warehouseId", schema: controller_1.default.id }))
], WarehouseController.prototype, "deactivateWarehouse", null);
__decorate([
    (0, method_1.Get)("/:warehouseId/inventory"),
    __param(0, (0, parameters_1.Query)({ destination: "warehouseId", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Query)({ schema: zod_1.z.object({ page: zod_1.z.number().default(1), limit: zod_1.z.number().default(10) }) }))
], WarehouseController.prototype, "getInventory", null);
__decorate([
    (0, method_1.Post)("/:warehouseId/inventory"),
    __param(0, (0, parameters_1.Query)({ destination: "warehouseId", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            variantId: controller_1.default.id,
            quantity: zod_1.z.number().min(1),
            variantPrice: zod_1.z.number(),
            purchasePrice: zod_1.z.number(),
            min_stock_threshold: zod_1.z.number().default(10),
            batch_number: zod_1.z.string(),
        }),
    }))
], WarehouseController.prototype, "addInventory", null);
__decorate([
    (0, method_1.Put)("/inventory/:inventory_id"),
    __param(0, (0, parameters_1.Query)({ destination: "inventory_id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            quantity: zod_1.z.number().min(0).optional(),
            variantPrice: zod_1.z.number().optional(),
            purchasePrice: zod_1.z.number().optional(),
            min_stock_threshold: zod_1.z.number().optional(),
            batch_number: zod_1.z.string().optional(),
        }),
    }))
], WarehouseController.prototype, "updateInventory", null);
__decorate([
    (0, method_1.Post)("/purchase-invoices"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            warehouseId: controller_1.default.id,
            supplier_id: controller_1.default.id,
            invoice_date: zod_1.z.date().default(() => new Date()),
            items: zod_1.z.array(zod_1.z.object({
                variantId: controller_1.default.id,
                quantity: zod_1.z.number().min(1),
                unit_purchasePrice: zod_1.z.number(),
                batch_number: zod_1.z.string(),
            })),
        }),
    }))
], WarehouseController.prototype, "createPurchaseInvoice", null);
__decorate([
    (0, method_1.Get)("/purchase-invoices"),
    __param(0, (0, parameters_1.Query)({
        schema: zod_1.z.object({
            warehouseId: controller_1.default.id.optional(),
            supplier_id: controller_1.default.id.optional(),
            status: zod_1.z.enum(["pending", "confirmed", "canceled"]).optional(),
            page: zod_1.z.number().default(1),
            limit: zod_1.z.number().default(10),
        }),
    }))
], WarehouseController.prototype, "getPurchaseInvoices", null);
__decorate([
    (0, method_1.Put)("/purchase-invoices/:purchase_invoice_id"),
    __param(0, (0, parameters_1.Query)({ destination: "purchase_invoice_id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({ schema: zod_1.z.object({ status: zod_1.z.enum(["pending", "confirmed", "canceled"]) }) }))
], WarehouseController.prototype, "updatePurchaseInvoice", null);
__decorate([
    (0, method_1.Post)("/sale-invoices"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            warehouseId: controller_1.default.id,
            buyer_id: controller_1.default.id,
            order_id: controller_1.default.id,
            invoice_date: zod_1.z.date().default(() => new Date()),
            items: zod_1.z.array(zod_1.z.object({
                variantId: controller_1.default.id,
                quantity: zod_1.z.number().min(1),
                unit_sale_price: zod_1.z.number(),
                batch_number: zod_1.z.string(),
            })),
        }),
    }))
], WarehouseController.prototype, "createSaleInvoice", null);
__decorate([
    (0, method_1.Get)("/sale-invoices"),
    __param(0, (0, parameters_1.Query)({
        schema: zod_1.z.object({
            warehouseId: controller_1.default.id.optional(),
            buyer_id: controller_1.default.id.optional(),
            order_id: controller_1.default.id.optional(),
            status: zod_1.z.enum(["pending", "confirmed", "canceled"]).optional(),
            page: zod_1.z.number().default(1),
            limit: zod_1.z.number().default(10),
        }),
    }))
], WarehouseController.prototype, "getSaleInvoices", null);
__decorate([
    (0, method_1.Put)("/sale-invoices/:sale_invoice_id"),
    __param(0, (0, parameters_1.Query)({ destination: "sale_invoice_id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Body)({ schema: zod_1.z.object({ status: zod_1.z.enum(["pending", "confirmed", "canceled"]) }) }))
], WarehouseController.prototype, "updateSaleInvoice", null);
__decorate([
    (0, method_1.Post)("/warehouse-transfers"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            from_warehouseId: controller_1.default.id,
            to_warehouseId: controller_1.default.id,
            variantId: controller_1.default.id,
            quantity: zod_1.z.number().min(1),
            batch_number: zod_1.z.string(),
        }),
    }))
], WarehouseController.prototype, "createWarehouseTransfer", null);
__decorate([
    (0, method_1.Get)("/warehouse-transfers"),
    __param(0, (0, parameters_1.Query)({
        schema: zod_1.z.object({
            from_warehouseId: controller_1.default.id.optional(),
            to_warehouseId: controller_1.default.id.optional(),
            status: zod_1.z.enum(["pending", "confirmed", "canceled"]).optional(),
            page: zod_1.z.number().default(1),
            limit: zod_1.z.number().default(10),
        }),
    }))
], WarehouseController.prototype, "getWarehouseTransfers", null);
__decorate([
    (0, method_1.Get)("/inventory/low-stock"),
    __param(0, (0, parameters_1.Query)({
        schema: zod_1.z.object({
            warehouseId: controller_1.default.id.optional(),
            threshold: zod_1.z.number().default(10),
        }),
    }))
], WarehouseController.prototype, "getLowStock", null);
__decorate([
    (0, method_1.Get)("/inventory/history/:inventory_id"),
    __param(0, (0, parameters_1.Query)({ destination: "inventory_id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Query)({ schema: zod_1.z.object({ page: zod_1.z.number().default(1), limit: zod_1.z.number().default(10) }) }))
], WarehouseController.prototype, "getInventoryHistory", null);
const warehouse = new WarehouseController("/warehouse", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string().max(250).default("digital warehouse"),
        address: zod_1.z.string().max(500).default("tehran"),
        phone: zod_1.z.string().max(11).default("09123334444"),
        manager: controller_1.default.id,
        capacity: zod_1.z.number().default(1000),
        is_active: zod_1.z.boolean().default(true),
    }),
});
exports.default = warehouse;
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
