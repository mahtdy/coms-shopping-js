"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
const model_1 = require("./model");
class ProductVariantRepository extends repository_1.default {
    constructor(options) {
        super(model_1.ProductVariantModel, options);
    }
    async findByProduct(productId) {
        return model_1.ProductVariantModel.find({ product: productId, active: true }).lean();
    }
    async findBySku(sku) {
        return model_1.ProductVariantModel.findOne({ sku }).lean();
    }
}
exports.default = ProductVariantRepository;
