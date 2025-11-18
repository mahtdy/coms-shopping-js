"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
const model_1 = require("./model");
const mongoose_1 = require("mongoose");
class ProductWarrantyRepository extends repository_1.default {
    constructor() {
        super(model_1.ProductWarrantyModel);
    }
    async findProductWarranties(productId, activeOnly = true) {
        const filter = { product: new mongoose_1.Types.ObjectId(productId) };
        if (activeOnly) {
            filter.isActive = true;
        }
        return this.findAll(filter, {
            population: [{ path: "warranty" }],
            sort: { isDefault: -1, createdAt: -1 },
        });
    }
    async findDefaultWarranty(productId) {
        return this.findOne({
            product: new mongoose_1.Types.ObjectId(productId),
            isDefault: true,
            isActive: true,
        }, {
            population: [{ path: "warranty" }],
        });
    }
    async findProductsWithWarranty(warrantyId) {
        return this.findAll({
            warranty: new mongoose_1.Types.ObjectId(warrantyId),
            isActive: true,
        }, {
            population: [{ path: "product", select: "title price image" }],
        });
    }
}
exports.default = ProductWarrantyRepository;
