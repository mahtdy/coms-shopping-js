import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { ProductVariantModel } from "./model";
import ProductVariant from "./model";

export default class ProductVariantRepository extends BaseRepositoryService<ProductVariant> {
    constructor(options?: any) {
        super(ProductVariantModel, options);
    }

    async findByProduct(productId: string) {
        return ProductVariantModel.find({ product: productId, active: true }).lean();
    }

    async findBySku(sku: string) {
        return ProductVariantModel.findOne({ sku }).lean();
    }
}
