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
const repository_3 = __importDefault(require("../../../repositories/admin/saleInvoice/repository"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const zod_1 = require("zod");
class WarehouseController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.warehouseRepo = new repository_1.default();
        this.productWarehouseRepo = new repository_2.default();
        this.saleInvoiceRepo = new repository_3.default();
    }
    async getWarehouses(query) {
        const { page, limit } = query;
        const warehouses = await this.warehouseRepo.find({ is_active: true }, { skip: (page - 1) * limit, limit }, { projection: { title: 1, address: 1 } });
        const total = await this.warehouseRepo.count({ is_active: true });
        return { warehouses, total };
    }
    async getProductWarehouse(warehouse_id, query) {
        const filter = { warehouse_id };
        if (query.variant_id)
            filter.variant_id = query.variant_id;
        // Assuming product_id is linked via variant_id in product_variant table
        const productWarehouse = await this.productWarehouseRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.productWarehouseRepo.count(filter);
        return { productWarehouse, total };
    }
    async getSaleInvoice(saleInvoiceId) {
        const invoice = await this.saleInvoiceRepo.findById(saleInvoiceId);
        const items = await this.saleInvoiceRepo.find({ saleInvoiceId });
        return { ...invoice, items };
    }
}
exports.WarehouseController = WarehouseController;
__decorate([
    (0, method_1.Get)(""),
    __param(0, (0, parameters_1.Query)({ schema: zod_1.z.object({ page: zod_1.z.number().default(1), limit: zod_1.z.number().default(10) }) }))
], WarehouseController.prototype, "getWarehouses", null);
__decorate([
    (0, method_1.Get)("/:warehouse_id/productWarehouse"),
    __param(0, (0, parameters_1.Query)({ destination: "warehouse_id", schema: controller_1.default.id })),
    __param(1, (0, parameters_1.Query)({
        schema: zod_1.z.object({
            variant_id: controller_1.default.id.optional(),
            product_id: controller_1.default.id.optional(),
            page: zod_1.z.number().default(1),
            limit: zod_1.z.number().default(10),
        }),
    }))
], WarehouseController.prototype, "getProductWarehouse", null);
__decorate([
    (0, method_1.Get)("/sale-invoices/:saleInvoiceId"),
    __param(0, (0, parameters_1.Query)({ destination: "saleInvoiceId", schema: controller_1.default.id }))
], WarehouseController.prototype, "getSaleInvoice", null);
const warehouse = new WarehouseController("/warehouse", new repository_1.default(), {});
exports.default = warehouse;
