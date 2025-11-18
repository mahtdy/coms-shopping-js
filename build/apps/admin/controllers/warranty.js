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
exports.WarrantyController = void 0;
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const repository_1 = __importDefault(require("../../../repositories/admin/warranty/repository"));
const zod_1 = require("zod");
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
class WarrantyController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    async calculateWarrantyPrice(warrantyId, productPrice) {
        const warranty = await this.repository.findById(warrantyId);
        if (!warranty) {
            return { status: 404, message: "گارانتی یافت نشد" };
        }
        let warrantyPrice = 0;
        switch (warranty.pricingType) {
            case "fixed":
                warrantyPrice = warranty.fixedPrice || 0;
                break;
            case "percentage":
                warrantyPrice = (productPrice * (warranty.percentagePrice || 0)) / 100;
                break;
            case "tiered":
                if (warranty.tieredPricing) {
                    const tier = warranty.tieredPricing.find(t => productPrice >= t.minPrice && productPrice <= t.maxPrice);
                    warrantyPrice = (tier === null || tier === void 0 ? void 0 : tier.price) || 0;
                }
                break;
        }
        return {
            status: 200,
            data: {
                warrantyPrice,
                warranty: {
                    id: warranty._id,
                    title: warranty.title,
                    duration: warranty.duration,
                    services: warranty.services,
                },
            },
        };
    }
    async calculateFeatureBasedPrice(data) {
        const warranty = await this.repository.findById(data.warrantyId);
        if (!warranty) {
            return { status: 404, message: "گارانتی یافت نشد" };
        }
        let totalPrice = 0;
        if (warranty.pricingType === "feature_based" && warranty.featureBasedPricing) {
            for (const selectedFeature of data.selectedFeatures) {
                const featurePricing = warranty.featureBasedPricing.find(fp => fp.featureId.toString() === selectedFeature.featureId);
                if (featurePricing) {
                    const valuePrice = featurePricing.valuePrices.find(vp => vp.value === selectedFeature.selectedValue);
                    if (valuePrice) {
                        totalPrice += valuePrice.additionalPrice;
                    }
                }
            }
        }
        return {
            status: 200,
            data: { warrantyPrice: totalPrice },
        };
    }
}
exports.WarrantyController = WarrantyController;
__decorate([
    (0, method_1.Get)("/calculate-price"),
    __param(0, (0, parameters_1.Query)({
        destination: "warrantyId",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Query)({
        destination: "productPrice",
        schema: zod_1.z.coerce.number().positive(),
    }))
], WarrantyController.prototype, "calculateWarrantyPrice", null);
__decorate([
    (0, method_1.Post)("/feature-price"),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            warrantyId: controller_1.default.id,
            selectedFeatures: zod_1.z.array(zod_1.z.object({
                featureId: controller_1.default.id,
                selectedValue: zod_1.z.any(),
            })),
        }),
    }))
], WarrantyController.prototype, "calculateFeatureBasedPrice", null);
const warranty = new WarrantyController("/warranty", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        title: zod_1.z.string().default("گارانتی ۱۲ ماهه شرکتی"),
        description: zod_1.z.string().default("گارانتی کامل شامل تعمیر و تعویض قطعات").optional(),
        duration: zod_1.z.object({
            value: zod_1.z.coerce.number().positive().int().default(12),
            unit: zod_1.z.enum(["day", "month", "year"]).default("month"),
        }),
        pricingType: zod_1.z.enum(["fixed", "percentage", "feature_based", "tiered"]).default("percentage"),
        fixedPrice: zod_1.z.coerce.number().positive().default(50000).optional(),
        percentagePrice: zod_1.z.coerce.number().min(0).max(100).default(5).optional(),
        featureBasedPricing: zod_1.z.array(zod_1.z.object({
            featureId: controller_1.default.id,
            featureName: zod_1.z.string().default("رنگ"),
            valuePrices: zod_1.z.array(zod_1.z.object({
                value: zod_1.z.any().default("قرمز"),
                additionalPrice: zod_1.z.coerce.number().default(10000),
            })),
        })).default([]).optional(),
        tieredPricing: zod_1.z.array(zod_1.z.object({
            minPrice: zod_1.z.coerce.number().min(0).default(0),
            maxPrice: zod_1.z.coerce.number().positive().default(1000000),
            price: zod_1.z.coerce.number().min(0).default(25000),
        })).default([]).optional(),
        services: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string().default("تعمیر رایگان"),
            description: zod_1.z.string().default("تعمیر رایگان در مدت گارانتی").optional(),
            isIncluded: zod_1.z.boolean().default(true),
        })).default([{ title: "تعمیر رایگان", description: "تعمیر رایگان در مدت گارانتی", isIncluded: true }]),
        applicableCategories: zod_1.z.array(controller_1.default.id).default([]).optional(),
        applicableBrands: zod_1.z.array(controller_1.default.id).default([]).optional(),
        isActive: zod_1.z.boolean().default(true),
        isPublic: zod_1.z.boolean().default(true),
        displayOrder: zod_1.z.coerce.number().default(0),
        terms: zod_1.z.string().default("شرایط و ضوابط گارانتی طبق قوانین حمایت از حقوق مصرف کننده").optional(),
        validFrom: zod_1.z.coerce.date().default(new Date()).optional(),
        validTo: zod_1.z.coerce.date().default(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)).optional(),
    }),
});
exports.default = warranty;
