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
exports.ProductWarrantyController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/productWarranty/repository"));
const zod_1 = require("zod");
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const repository_2 = __importDefault(require("../../../repositories/admin/warranty/repository"));
const repository_3 = __importDefault(require("../../../repositories/admin/product/repository"));
const repository_4 = __importDefault(require("../../../core/mongoose-controller/repositories/category/repository"));
// import CategoryRepository from "../../../core/mongoose-controller/repositories/category/repository";
class ProductWarrantyController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.warrantyRepo = new repository_2.default();
        this.productRepo = new repository_3.default();
        this.catRepo = new repository_4.default();
    }
    async getAvailableWarrantiesForProduct(productId) {
        var _a;
        const product = await this.productRepo.findById(productId);
        if (!product) {
            return { status: 404, message: "محصول یافت نشد" };
        }
        const warranties = await this.warrantyRepo.findApplicableWarranties(product.category.toString(), (_a = product.brand) === null || _a === void 0 ? void 0 : _a.toString(), true);
        const warrantiesWithPrice = await Promise.all(warranties.map(async (warranty) => {
            let calculatedPrice = 0;
            switch (warranty.pricingType) {
                case "fixed":
                    calculatedPrice = warranty.fixedPrice || 0;
                    break;
                case "percentage":
                    calculatedPrice = (product.price * (warranty.percentagePrice || 0)) / 100;
                    break;
                case "tiered":
                    if (warranty.tieredPricing) {
                        const tier = warranty.tieredPricing.find(t => product.price >= t.minPrice && product.price <= t.maxPrice);
                        calculatedPrice = (tier === null || tier === void 0 ? void 0 : tier.price) || 0;
                    }
                    break;
                case "feature_based":
                    calculatedPrice = 0;
                    break;
            }
            return {
                id: warranty._id,
                title: warranty.title,
                description: warranty.description,
                duration: warranty.duration,
                services: warranty.services,
                pricingType: warranty.pricingType,
                calculatedPrice,
                featureBasedPricing: warranty.featureBasedPricing,
                terms: warranty.terms,
            };
        }));
        return {
            status: 200,
            data: warrantiesWithPrice,
        };
    }
    async calculateFinalWarrantyPrice(data) {
        const [product, warranty] = await Promise.all([
            this.productRepo.findById(data.productId),
            this.warrantyRepo.findById(data.warrantyId),
        ]);
        if (!product) {
            return { status: 404, message: "محصول یافت نشد" };
        }
        if (!warranty) {
            return { status: 404, message: "گارانتی یافت نشد" };
        }
        let finalPrice = 0;
        switch (warranty.pricingType) {
            case "fixed":
                finalPrice = warranty.fixedPrice || 0;
                break;
            case "percentage":
                finalPrice = (product.price * (warranty.percentagePrice || 0)) / 100;
                break;
            case "tiered":
                if (warranty.tieredPricing) {
                    const tier = warranty.tieredPricing.find(t => product.price >= t.minPrice && product.price <= t.maxPrice);
                    finalPrice = (tier === null || tier === void 0 ? void 0 : tier.price) || 0;
                }
                break;
            case "feature_based":
                if (data.selectedFeatures && warranty.featureBasedPricing) {
                    for (const selectedFeature of data.selectedFeatures) {
                        const featurePricing = warranty.featureBasedPricing.find(fp => fp.featureId.toString() === selectedFeature.featureId);
                        if (featurePricing) {
                            const valuePrice = featurePricing.valuePrices.find(vp => vp.value === selectedFeature.selectedValue);
                            if (valuePrice) {
                                finalPrice += valuePrice.additionalPrice;
                            }
                        }
                    }
                }
                break;
        }
        return {
            status: 200,
            data: {
                warrantyPrice: finalPrice,
                productPrice: product.price,
                totalPrice: product.price + finalPrice,
                warranty: {
                    id: warranty._id,
                    title: warranty.title,
                    duration: warranty.duration,
                    services: warranty.services,
                },
            },
        };
    }
    async assignWarrantyToProduct(admin, data) {
        const [product, warranty] = await Promise.all([
            this.productRepo.findById(data.productId),
            this.warrantyRepo.findById(data.warrantyId),
        ]);
        if (!product) {
            return { status: 404, message: "محصول یافت نشد" };
        }
        if (!warranty) {
            return { status: 404, message: "گارانتی یافت نشد" };
        }
        const existingConnection = await this.repository.findOne({
            product: data.productId,
            warranty: data.warrantyId,
        });
        if (existingConnection) {
            return { status: 400, message: "این گارانتی قبلاً به محصول اتصال داده شده است" };
        }
        if (data.isDefault) {
            await this.repository.updateMany({ product: data.productId, isDefault: true }, { $set: { isDefault: false } });
        }
        const productWarranty = await this.repository.insert({
            product: product._id,
            warranty: warranty._id,
            isDefault: data.isDefault,
            customPrice: data.customPrice,
            isActive: true,
            createdBy: admin._id,
            createdAt: new Date(),
        });
        return {
            status: 200,
            message: "گارانتی با موفقیت به محصول اتصال داده شد",
            data: productWarranty,
        };
    }
    async unassignWarrantyFromProduct(admin, productId, warrantyId) {
        const result = await this.repository.deleteOne({
            product: productId,
            warranty: warrantyId,
        });
        if (result.deletedCount === 0) {
            return { status: 404, message: "اتصال گارانتی یافت نشد" };
        }
        return {
            status: 200,
            message: "اتصال گارانتی با موفقیت حذف شد",
        };
    }
}
exports.ProductWarrantyController = ProductWarrantyController;
__decorate([
    (0, method_1.Get)("/product/:productId/available"),
    __param(0, (0, parameters_1.Query)({
        destination: "productId",
        schema: controller_1.default.id,
    }))
], ProductWarrantyController.prototype, "getAvailableWarrantiesForProduct", null);
__decorate([
    (0, method_1.Post)("/calculate-final-price"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            productId: controller_1.default.id,
            warrantyId: controller_1.default.id,
            selectedFeatures: zod_1.z.array(zod_1.z.object({
                featureId: controller_1.default.id,
                selectedValue: zod_1.z.any(),
            })).optional(),
        }),
    }))
], ProductWarrantyController.prototype, "calculateFinalWarrantyPrice", null);
__decorate([
    (0, method_1.Post)("/assign"),
    __param(0, (0, parameters_1.Admin)()),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            productId: controller_1.default.id,
            warrantyId: controller_1.default.id,
            isDefault: zod_1.z.boolean().default(false),
            customPrice: zod_1.z.coerce.number().optional(),
        }),
    }))
], ProductWarrantyController.prototype, "assignWarrantyToProduct", null);
__decorate([
    (0, method_1.Delete)("/unassign"),
    __param(0, (0, parameters_1.Admin)()),
    __param(1, (0, parameters_1.Query)({
        destination: "productId",
        schema: controller_1.default.id,
    })),
    __param(2, (0, parameters_1.Query)({
        destination: "warrantyId",
        schema: controller_1.default.id,
    }))
], ProductWarrantyController.prototype, "unassignWarrantyFromProduct", null);
const productWarranty = new ProductWarrantyController("/product-warranty", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        product: controller_1.default.id,
        warranty: controller_1.default.id,
        isDefault: zod_1.z.boolean().default(false),
        customPrice: zod_1.z.coerce.number().default(30000).optional(),
        isActive: zod_1.z.boolean().default(true),
        createdBy: controller_1.default.id,
    }),
});
exports.default = productWarranty;
