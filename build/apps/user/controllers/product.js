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
exports.UserProductController = void 0;
const method_1 = require("../../../core/decorators/method");
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
// import {Query} from "../../../core/decorators/parameters";
const zod_1 = __importDefault(require("zod"));
const repository_1 = __importDefault(require("../../../repositories/admin/product/repository"));
// import { Param } from "../../decorators/parameters";
const parameters_1 = require("../../../core/decorators/parameters");
// import { Body, Param, Query } from "../../../core/mongoose-controller/controller";
// import { Request, Response } from "express";
class UserProductController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
    }
    // async list11(req: Request, res: Response) {
    //     try {
    //         const { limit, page, sort } = req.query;
    //         const products = await ProductRepository.findAll(
    //             {},
    //             {
    //                 limit: Number(limit) || 20,
    //                 page: Number(page) || 1,
    //                 sort: sort ? JSON.parse(sort as string) : { created_at: -1 },
    //             }
    //         );
    //
    //         const pricedProducts = await ProductPriceService.calculateForList(products);
    //
    //         return res.status(200).json({
    //             success: true,
    //             data: pricedProducts,
    //         });
    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: "خطا در دریافت محصولات",
    //             // error: error.message,
    //         });
    //     }
    // }
    async list(page, limit, sort, filters) {
        const data = await this.repository.getProductList(page, limit, filters, sort);
        return {
            // status: 200,
            data,
        };
    }
    // @Get("/price")
    // async getFinalPrice(
    //     @Query({ schema: z.object({ productId: z.string(), variantFeatures: z.record(z.string()) }) })
    //     { productId, variantFeatures }: { productId: string; variantFeatures?: { [key: string]: string } }
    // ): Promise<Response> {
    //     const product = await this.repository.findById(productId);
    //     if (!product) return {status: 404, message: "Product not found"};
    //     // جمع‌آوری موجودی و قیمت واریانت
    //     const warehouses = product. || [];
    //     let basePrice = product.price;
    //     let stock = 0;
    //     if (variantFeatures) {
    //         // پیدا کردن واریانت مطابق ویژگی‌ها
    //         const matched = warehouses.filter(wh => {
    //             if (!wh.config) return true;
    //             return Object.keys(variantFeatures).every(key => wh.config[key] === variantFeatures[key]);
    //         });
    //         if (matched.length) {
    //             basePrice = Math.min(...matched.map(m => m.price));
    //             stock = matched.reduce((sum, m) => sum + m.quantity, 0);
    //         } else {
    //             stock = warehouses.reduce((sum, m) => sum + m.quantity, 0);
    //         }
    //     } else {
    //         stock = warehouses.reduce((sum, m) => sum + m.quantity, 0);
    //     }
    //     // پیدا کردن تخفیف‌ها
    //     const discounts = await this.discountRepo.findActiveForProductAndVariant(
    //         productId,
    //         product.category?._id?.toString(),
    //         product.brand?._id?.toString(),
    //         variantFeatures
    //     );
    //     let finalPrice = basePrice;
    //     discounts.forEach(discount => {
    //         if (discount.disValue.type === "fixed") {
    //             finalPrice -= discount.disValue.fixedAmount || 0;
    //         } else if (discount.disValue.type === "percent") {
    //             finalPrice -= (discount.disValue.fixedAmount! / 100) * finalPrice;
    //         }
    //     });
    //     return {
    //         status: 200,
    //         data: { productId, originalPrice: basePrice, finalPrice, stock, discounts },
    //     };
    // }
    // مشاهده تک محصول
    async getSingle(id, sku) {
        console.log('bbbbbb');
        const product = await this.repository.findById(id);
        if (!product)
            return { status: 404, message: "محصول پیدا نشد" };
        console.log('tttttt');
        if (sku) {
            console.log('ssssssssss');
            // اگر sku داده شده، جزییات واریانت را جدا کن و موجودی آن در انبارها را نشان بده
            const variant = product.variants.find((v) => v.sku === sku);
            if (!variant)
                return { status: 404, message: "واریانت پیدا نشد" };
            // موجودی هر انبار برای این واریانت
            const stockByWarehouse = (product.warehouses || [])
                .filter((w) => String(w.variant) === String(variant.variantId))
                .map((w) => ({ warehouse: w.warehouse, quantity: w.quantity, price: w.variantPrice }));
            return {
                status: 200,
                data: { productId: product._id, variant, stockByWarehouse }
            };
        }
        if (id) {
            console.log('fffffff');
            // اگر id داده شده، جزییات واریانت را جدا کن و موجودی آن در انبارها را نشان بده
            // var variant = await product.variants.findOne({
            //     user: user.id as string,
            // });
            const variant = product.variants.find((v) => v.id === id);
            if (!variant)
                return { status: 404, message: "واریانت پیدا نشد" };
            // موجودی هر انبار برای این واریانت
            const stockByWarehouse = (product.warehouses || [])
                .filter((w) => String(w.variant) === String(variant.variantId))
                .map((w) => ({ warehouse: w.warehouse, quantity: w.quantity, price: w.variantPrice }));
            return {
                status: 200,
                data: { productId: product._id, variant, stockByWarehouse }
            };
        }
        return { status: 200, data: product };
    }
    initApis() {
        super.initApis();
        this.exclude("/product", "delete");
        this.exclude("/product", "post");
    }
}
exports.UserProductController = UserProductController;
__decorate([
    (0, method_1.Get)("/list"),
    __param(0, (0, parameters_1.Query)({ destination: "page", schema: zod_1.default.coerce.number().default(1) })),
    __param(1, (0, parameters_1.Query)({ destination: "limit", schema: zod_1.default.coerce.number().default(10) })),
    __param(2, (0, parameters_1.Query)({ destination: "sort", schema: zod_1.default.string().optional() })),
    __param(3, (0, parameters_1.Query)({
        schema: zod_1.default.object({
            "category": controller_1.default.id.optional(),
            "brand": controller_1.default.id.optional(),
            "search": controller_1.default.id.optional(),
        })
    }))
], UserProductController.prototype, "list", null);
__decorate([
    (0, method_1.Get)("/:id"),
    __param(0, (0, parameters_1.Query)({ destination: "id", schema: zod_1.default.string() })),
    __param(1, (0, parameters_1.Query)({ destination: "sku", schema: zod_1.default.string().optional() }))
], UserProductController.prototype, "getSingle", null);
const userProduct = new UserProductController("/product", new repository_1.default(), {
    collectionName: "product",
});
exports.default = userProduct;
