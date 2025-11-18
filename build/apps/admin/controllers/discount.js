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
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const repository_1 = __importDefault(require("../../../repositories/admin/discount/repository"));
const repository_2 = __importDefault(require("../../../repositories/admin/order/repository"));
const zod_1 = require("zod");
const lodash_1 = require("lodash");
class DiscountController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.orderRepo = new repository_2.default();
    }
    async generateDiscountAfterInvoice(user, { orderId }) {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            return { status: 404, message: "Order not found" };
        }
        const totalCost = order.totalCost || 0;
        const totalPrice = order.totalPriceProducts || 0;
        const profit = totalPrice - totalCost;
        const activeDiscount = await this.repository.findOne({
            applyOnInvoice: true,
            isActive: true,
            disStart: { $lte: new Date() },
            disEnd: { $gte: new Date() },
        });
        if (!activeDiscount) {
            return { status: 404, message: "No active discount settings found" };
        }
        if (activeDiscount.firstInvoiceOnly) {
            const userOrders = await this.orderRepo.count({ user: user.id });
            if (userOrders > 1) {
                return { status: 400, message: "Discount only for first invoice" };
            }
        }
        if (order.totalPriceProducts < activeDiscount.amountRange.from ||
            order.totalPriceProducts > activeDiscount.amountRange.to) {
            return { status: 400, message: "Invoice amount out of range" };
        }
        let discountValue;
        if (activeDiscount.disValue.type === "fixed") {
            discountValue = activeDiscount.disValue.fixedAmount || 0;
        }
        else if (activeDiscount.disValue.type === "random") {
            const { from, to } = activeDiscount.disValue.randomRange;
            discountValue = Math.floor(Math.random() * (to - from + 1)) + from;
        }
        else {
            discountValue = (activeDiscount.disValue.fixedAmount / 100) * totalPrice;
        }
        if (activeDiscount.maxProfitLimit && discountValue > profit) {
            discountValue = profit;
        }
        let disCode = "";
        if (activeDiscount.generateCode) {
            disCode = this.generateDiscountCode(activeDiscount.codeSettings);
        }
        const newDiscountData = {
            // user: user.id,
            disTitle: activeDiscount.disTitle,
            disType: activeDiscount.disType,
            applyOnInvoice: activeDiscount.applyOnInvoice,
            autoApplyOnInvoice: activeDiscount.autoApplyOnInvoice,
            disStart: activeDiscount.disStart,
            disEnd: activeDiscount.disEnd,
            firstInvoiceOnly: activeDiscount.firstInvoiceOnly,
            amountRange: activeDiscount.amountRange,
            disValue: { type: "fixed", fixedAmount: discountValue },
            maxProfitLimit: activeDiscount.maxProfitLimit,
            usageCount: activeDiscount.usageCount,
            useInSpecialProducts: activeDiscount.useInSpecialProducts,
            generateCode: activeDiscount.generateCode,
            codeSettings: activeDiscount.codeSettings,
            disCode,
            filters: activeDiscount.filters,
            isActive: true,
            createdAt: new Date(),
        };
        const newDiscount = await this.repository.insert(newDiscountData);
        return { status: 200, message: "Discount code generated", data: newDiscount };
    }
    generateDiscountCode(settings) {
        const { charCount, randomDigitCount, prefix, type, fixedValue } = settings;
        if (type === "fixed")
            return fixedValue || "";
        let code = prefix || "";
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        if (type === "letters") {
            for (let i = code.length; i < charCount; i++) {
                code += letters[Math.floor(Math.random() * letters.length)];
            }
        }
        else if (type === "numbers") {
            for (let i = code.length; i < charCount; i++) {
                code += numbers[Math.floor(Math.random() * numbers.length)];
            }
        }
        return code;
    }
    async getDiscountList() {
        const discounts = await this.repository.findAll({}, { sort: { createdAt: -1 } });
        return { status: 200, data: discounts };
    }
}
exports.DiscountController = DiscountController;
__decorate([
    (0, method_1.Post)("/generate-after-invoice"),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({ schema: zod_1.z.object({ orderId: zod_1.z.string() }) }))
], DiscountController.prototype, "generateDiscountAfterInvoice", null);
__decorate([
    (0, method_1.Get)("/list")
], DiscountController.prototype, "getDiscountList", null);
const discount = new DiscountController("/discount", new repository_1.default(), {
    insertSchema: zod_1.z.object({
        // product: BaseController.id,
        // productwarehouse: BaseController.id,
        // price: z.coerce.number().positive().int(),
        // quantity: z.coerce.number().positive().int().default(1),
        // user: BaseController.id,
        disTitle: zod_1.z.coerce.string().default('discount title'),
        disType: zod_1.z.enum(["general", "special"]).default('general'),
        applyOnInvoice: zod_1.z.coerce.boolean().default(true),
        autoApplyOnInvoice: zod_1.z.coerce.boolean().default(true),
        disStart: zod_1.z.coerce.date(),
        disEnd: zod_1.z.coerce.date(),
        firstInvoiceOnly: zod_1.z.coerce.boolean().default(true),
        amountRange: zod_1.z.object({
            from: zod_1.z.coerce.number().positive().int().default(1),
            to: zod_1.z.coerce.number().positive().int().default(10)
        }),
        disValue: zod_1.z.object({
            type: zod_1.z.enum(["fixed", "random", "percent"]).default('fixed'),
            fixedAmount: zod_1.z.coerce.number().positive().int().default(1),
            randomRange: zod_1.z.object({
                from: zod_1.z.coerce.number().positive().int().default(1),
                to: zod_1.z.coerce.number().positive().int().default(10)
            }),
        }),
        maxProfitLimit: zod_1.z.coerce.boolean().default(true),
        usageCount: zod_1.z.coerce.number().positive().int().default(10),
        useInSpecialProducts: zod_1.z.coerce.boolean().default(true),
        generateCode: zod_1.z.coerce.boolean().default(true),
        codeSettings: controller_1.default.id,
        disCode: zod_1.z.coerce.string().default('discount&code' + (0, lodash_1.random)(100)),
        filters: zod_1.z.object({
            userFilter: zod_1.z.object({
                allUsers: zod_1.z.coerce.boolean().default(true),
                gender: zod_1.z.enum(["male", "female"]).default('male'),
                ageRange: zod_1.z.object({
                    from: zod_1.z.coerce.number().positive().int().default(20),
                    to: zod_1.z.coerce.number().positive().int().default(30)
                }),
            }),
            productFilter: zod_1.z.object({
                allProducts: zod_1.z.coerce.boolean().default(true),
                category: zod_1.z.array(zod_1.z.coerce.string().default('cat1,cat2,cat3')),
                brand: zod_1.z.array(zod_1.z.coerce.string().default('brand1,brand2,brand3')),
            }),
        }),
        isActive: zod_1.z.coerce.boolean().default(true),
        createdAt: zod_1.z.coerce.date(),
    }),
});
exports.default = discount;
