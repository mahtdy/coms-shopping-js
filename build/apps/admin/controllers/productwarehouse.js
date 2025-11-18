"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductwarehouseController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/productWarehouse/repository"));
const zod_1 = require("zod");
class ProductwarehouseController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    initApis() {
        super.initApis();
    }
}
exports.ProductwarehouseController = ProductwarehouseController;
const productwarehouse = new ProductwarehouseController("/productwarehouse", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        product: controller_1.default.id,
        warehouse: controller_1.default.id,
        config: (0, zod_1.any)().optional(),
        lastUpdated: (0, zod_1.string)(),
        price: zod_1.z.coerce.number().positive().int().default(100),
        purchasePrice: zod_1.z.coerce.number().positive().int().default(85),
        minStockThreshold: zod_1.z.coerce.number().positive().int().default(5),
        quantity: zod_1.z.coerce.number().positive().int().default(10),
    }),
});
exports.default = productwarehouse;
