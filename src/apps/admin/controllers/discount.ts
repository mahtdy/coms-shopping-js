import Discount, {DiscountModel, DiscountCodeSettings, DiscountFilter} from "../../../repositories/admin/discount/model";
import Order from "../../../repositories/admin/order/model"; // فرض می‌کنیم مدل فاکتور داریم
import BaseController, {
    ControllerOptions,
} from "../../../core/mongoose-controller/controller";
import {Response} from "../../../core/controller";
import {Post, Get} from "../../../core/decorators/method";
import {Body, User} from "../../../core/decorators/parameters";
import {UserInfo} from "../../../core/mongoose-controller/auth/user/userAuthenticator";
import DiscountRepository from "../../../repositories/admin/discount/repository";
import OrderRepository from "../../../repositories/admin/order/repository";
import {date, z} from "zod";
import {now, random} from "lodash";
import {time} from "speakeasy";

export class DiscountController extends BaseController<Discount> {
    private orderRepo: OrderRepository;

    constructor(
        baseRoute: string,
        repo: DiscountRepository,
        options?: ControllerOptions
    ) {
        super(baseRoute, repo, options);
        this.orderRepo = new OrderRepository();
    }



    @Post("/generate-after-invoice")
    async generateDiscountAfterInvoice(
        @User() user: UserInfo,
        @Body({schema: z.object({orderId: z.string()})})
        {orderId}: { orderId: string }
    ): Promise<Response> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            return {status: 404, message: "Order not found"};
        }

        const totalCost = order.totalCost || 0;
        const totalPrice = order.totalPriceProducts || 0;
        const profit = totalPrice - totalCost;

        const activeDiscount = await this.repository.findOne({
            applyOnInvoice: true,
            isActive: true,
            disStart: {$lte: new Date()},
            disEnd: {$gte: new Date()},
        });

        if (!activeDiscount) {
            return {status: 404, message: "No active discount settings found"};
        }

        if (activeDiscount.firstInvoiceOnly) {
            const userOrders = await this.orderRepo.count({user: user.id});
            if (userOrders > 1) {
                return {status: 400, message: "Discount only for first invoice"};
            }
        }

        if (
            order.totalPriceProducts < activeDiscount.amountRange.from ||
            order.totalPriceProducts > activeDiscount.amountRange.to
        ) {
            return {status: 400, message: "Invoice amount out of range"};
        }

        let discountValue: number;
        if (activeDiscount.disValue.type === "fixed") {
            discountValue = activeDiscount.disValue.fixedAmount || 0;
        } else if (activeDiscount.disValue.type === "random") {
            const {from, to} = activeDiscount.disValue.randomRange!;
            discountValue = Math.floor(Math.random() * (to - from + 1)) + from;
        } else {
            discountValue = (activeDiscount.disValue.fixedAmount! / 100) * totalPrice;
        }

        if (activeDiscount.maxProfitLimit && discountValue > profit) {
            discountValue = profit;
        }

        let disCode = "";
        if (activeDiscount.generateCode) {
            disCode = this.generateDiscountCode(activeDiscount.codeSettings!);
        }

        const newDiscountData: Partial<Discount> = {
            // user: user.id,
            disTitle: activeDiscount.disTitle,
            disType: activeDiscount.disType,
            applyOnInvoice: activeDiscount.applyOnInvoice,
            autoApplyOnInvoice: activeDiscount.autoApplyOnInvoice,
            disStart: activeDiscount.disStart,
            disEnd: activeDiscount.disEnd,
            firstInvoiceOnly: activeDiscount.firstInvoiceOnly,
            amountRange: activeDiscount.amountRange,
            disValue: {type: "fixed", fixedAmount: discountValue},
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

        const newDiscount = await this.repository.insert(newDiscountData as Discount);
        return {status: 200, message: "Discount code generated", data: newDiscount};
    }


    private generateDiscountCode(settings: DiscountCodeSettings): string {
        const {charCount, randomDigitCount, prefix, type, fixedValue} = settings;
        if (type === "fixed") return fixedValue || "";

        let code = prefix || "";
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";

        if (type === "letters") {
            for (let i = code.length; i < charCount; i++) {
                code += letters[Math.floor(Math.random() * letters.length)];
            }
        } else if (type === "numbers") {
            for (let i = code.length; i < charCount; i++) {
                code += numbers[Math.floor(Math.random() * numbers.length)];
            }
        }

        return code;
    }

    @Get("/list")
    async getDiscountList(): Promise<Response> {
        const discounts = await this.repository.findAll({}, {sort: {createdAt: -1}});
        return {status: 200, data: discounts};
    }
}

const discount = new DiscountController("/discount", new DiscountRepository(), {
    insertSchema: z.object({
        // product: BaseController.id,
        // productwarehouse: BaseController.id,
        // price: z.coerce.number().positive().int(),
        // quantity: z.coerce.number().positive().int().default(1),

        // user: BaseController.id,
        disTitle: z.coerce.string().default('discount title'),
        disType: z.enum(["general", "special"]).default('general'),
        applyOnInvoice: z.coerce.boolean().default(true),
        autoApplyOnInvoice: z.coerce.boolean().default(true),
        disStart: z.coerce.date(),
        disEnd: z.coerce.date(),
        firstInvoiceOnly: z.coerce.boolean().default(true),
        amountRange: z.object({
            from: z.coerce.number().positive().int().default(1),
            to: z.coerce.number().positive().int().default(10)
        }),
        disValue: z.object({
            type: z.enum(["fixed", "random", "percent"]).default('fixed'),
            fixedAmount: z.coerce.number().positive().int().default(1),
            randomRange: z.object({
                from: z.coerce.number().positive().int().default(1),
                to: z.coerce.number().positive().int().default(10)
            }),
        }),
        maxProfitLimit: z.coerce.boolean().default(true),
        usageCount: z.coerce.number().positive().int().default(10),
        useInSpecialProducts: z.coerce.boolean().default(true),
        generateCode: z.coerce.boolean().default(true),
        codeSettings: BaseController.id,
        disCode: z.coerce.string().default('discount&code'+random(100)),
        filters: z.object({
            userFilter: z.object({
                allUsers: z.coerce.boolean().default(true),
                gender: z.enum(["male", "female"]).default('male'),
                ageRange: z.object({
                    from: z.coerce.number().positive().int().default(20),
                    to: z.coerce.number().positive().int().default(30)
                }),
            }),
            productFilter: z.object({
                allProducts: z.coerce.boolean().default(true),
                category: z.array(z.coerce.string().default('cat1,cat2,cat3')),
                brand:  z.array(z.coerce.string().default('brand1,brand2,brand3')),

            }),
        }),
        isActive: z.coerce.boolean().default(true),
        createdAt: z.coerce.date(),
    }),
});
export default discount;