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
exports.DiscountController = void 0;
const repository_1 = __importDefault(require("../../../repositories/admin/discount/repository"));
const repository_2 = __importDefault(require("../../../repositories/admin/order/repository"));
const repository_3 = __importDefault(require("../../../repositories/admin/product/repository"));
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const zod_1 = __importDefault(require("zod"));
class DiscountController extends controller_1.default {
    constructor(baseRoute, repo) {
        super(baseRoute, repo);
        this.orderRepo = new repository_2.default();
        this.productRepo = new repository_3.default();
    }
    async generateDiscountAfterInvoice(user, { orderId }) {
        const order = await this.orderRepo.findById(orderId);
        if (!order)
            return { status: 404, message: "Order not found" };
        const totalCost = order.totalCost || 0;
        const totalPrice = order.totalPriceProducts || 0;
        const profit = totalPrice - totalCost;
        const activeDiscount = await this.repository.findOne({
            applyOnInvoice: true,
            isActive: true,
            disStart: { $lte: new Date() },
            disEnd: { $gte: new Date() },
        });
        if (!activeDiscount)
            return { status: 404, message: "No active discount settings found" };
        // ... بقیه منطق مشابه admin/controllers/discount.ts
        return { status: 200, message: "Discount code generated" };
    }
    async applyOnProduct(user, { productId }) {
        const product = await this.productRepo.findById(productId);
        if (!product)
            return { status: 404, message: "Product not found" };
        const discounts = await this.repository.findActiveForProduct(productId, product.category, product.brand);
        // محاسبه قیمت نهایی با تخفیف‌های فعال
        let finalPrice = product.price;
        discounts.forEach((discount) => {
            if (discount.disValue.type === "fixed") {
                finalPrice -= discount.disValue.fixedAmount || 0;
            }
            else if (discount.disValue.type === "percent") {
                finalPrice -= (discount.disValue.fixedAmount / 100) * finalPrice;
            }
        });
        return { status: 200, data: { productId, originalPrice: product.price, finalPrice, discounts } };
    }
}
exports.DiscountController = DiscountController;
__decorate([
    (0, method_1.Post)("/generate-after-invoice"),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({ schema: zod_1.default.object({ orderId: zod_1.default.string() }) }))
], DiscountController.prototype, "generateDiscountAfterInvoice", null);
__decorate([
    (0, method_1.Post)("/apply-on-product"),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({ schema: zod_1.default.object({ productId: zod_1.default.string() }) }))
], DiscountController.prototype, "applyOnProduct", null);
const discountController = new DiscountController("/discount", new repository_1.default());
exports.default = discountController; // نمونه صادر شده
