import { ProductwarehouseController } from "../../../apps/admin/controllers/productwarehouse";
import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { RepositoryConfigOptions } from "../../../core/mongoose-controller/repository";
import Productwarehouse, {
  ProductwarehouseModel,
} from "../../../repositories/admin/productWarehouse/model";
import { ProductVariantModel } from "../productVariant/model";
import ProductVariant from "./model";

export default class ProductWarehouseRepository extends BaseRepositoryService<Productwarehouse> {
  constructor(options?: RepositoryConfigOptions) {
    super(ProductwarehouseModel, options);
  }

  async findByProduct(productId: string) {
    return ProductVariantModel.find({ product: productId, active: true }).lean();
  }

  async findBySku(sku: string) {
    return ProductVariantModel.findOne({ sku }).lean();
  }
}

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