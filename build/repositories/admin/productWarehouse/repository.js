"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
const model_1 = require("../../../repositories/admin/productWarehouse/model");
const model_2 = require("../productVariant/model");
class ProductWarehouseRepository extends repository_1.default {
    constructor(options) {
        super(model_1.ProductwarehouseModel, options);
    }
    async findByProduct(productId) {
        return model_2.ProductVariantModel.find({ product: productId, active: true }).lean();
    }
    async findBySku(sku) {
        return model_2.ProductVariantModel.findOne({ sku }).lean();
    }
}
exports.default = ProductWarehouseRepository;
// const productwarehouse = new ProductwarehouseController(
//   "/productwarehouse",
//   new ProductWarehouseRepository(),
//   {}
// );
// import BaseRepositoryService, {
//   RepositoryConfigOptions,
// } from "../../../core/mongoose-controller/repository";
// import { Inventory, InventoryModel } from "../inventory/model";
//
// export default class InventoryRepository extends BaseRepositoryService<Inventory> {
//   constructor(options?: RepositoryConfigOptions) {
//     super(InventoryModel, options);
//   }
//   async updateStock(
//       warehouse_id: string,
//       variant_id: string,
//       batch_number: string,
//       quantity: number,
//       variant_price: number,
//       purchase_price: number
//   ) {
//     const inventory = await this.model.findOneAndUpdate(
//         { warehouse_id, variant_id, batch_number },
//         {
//           $set: {
//             quantity,
//             variant_price,
//             purchase_price,
//             last_updated: new Date(),
//           },
//         },
//         { upsert: true, new: true }
//     );
//     return inventory;
//   }
//
//   async getLowStock(warehouse_id: string, threshold: number) {
//     return this.model.find({ warehouse_id, quantity: { $lte: threshold } });
//   }
// }
