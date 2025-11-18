"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
const model_1 = require("../../../repositories/admin/discount/model");
class DiscountRepository extends repository_1.default {
    constructor(options) {
        super(model_1.DiscountModel, options);
    }
    async findActiveForProductAndVariant(productId, categoryId, brandId, variantFeatures // مثل { color: "red", size: "M" }
    ) {
        const now = new Date();
        const discounts = await this.findAll({
            isActive: true,
            $and: [{
                    $or: [
                        { applyOnProducts: productId },
                        { applyOnCategories: categoryId },
                        { applyOnBrands: brandId },
                    ],
                }, {
                    $or: [
                        { eventStart: { $lte: now }, eventEnd: { $gte: now } },
                        { disStart: { $lte: now }, disEnd: { $gte: now } },
                    ],
                }]
        });
        // فیلتر کردن بر اساس ویژگی واریانت‌ها
        return discounts.filter(discount => {
            if (!discount.variantFilter || discount.variantFilter.length === 0)
                return true;
            if (!variantFeatures)
                return false;
            return discount.variantFilter.every(vf => {
                const value = variantFeatures[vf.featureKey];
                if (!value)
                    return false;
                if (!vf.featureValues || vf.featureValues.length === 0)
                    return true;
                return vf.featureValues.includes(value);
            });
        });
    }
}
exports.default = DiscountRepository;
