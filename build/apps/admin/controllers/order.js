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
exports.OrderController = void 0;
const repository_1 = __importDefault(require("../../../repositories/admin/order/repository"));
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const method_1 = require("../../../core/decorators/method");
const parameters_1 = require("../../../core/decorators/parameters");
const repository_2 = __importDefault(require("../../../repositories/admin/product/repository"));
const repository_3 = __importDefault(require("../../../repositories/admin/productWarehouse/repository"));
const discount_1 = require("./discount");
const zod_1 = __importDefault(require("zod"));
const repository_4 = __importDefault(require("../../../repositories/admin/discount/repository"));
class OrderController extends controller_1.default {
    constructor(baseRoute, repo) {
        super(baseRoute, repo);
        this.orderRepo = new repository_1.default();
        this.proRepo = new repository_2.default();
        this.prowareRepo = new repository_3.default();
        this.discountController = new discount_1.DiscountController("/discount", new repository_4.default());
    }
    async orderCheckout(user, data) {
        const newOrder = await this.createNewOrder(data, user.id);
        if (newOrder.status !== 200 || !newOrder.data) {
            return newOrder;
        }
        const orderId = newOrder.data._id;
        const discountResult = await this.discountController.generateDiscountAfterInvoice(user, { orderId });
        return {
            status: 200,
            message: "Order created and discount generated",
            data: { order: newOrder.data, discount: discountResult.data },
        };
    }
    async createNewOrder(data, userId) {
        try {
            data.user = userId;
            let totalCost = 0;
            let totalPriceProducts = 0;
            const orderLists = data.orderList;
            for (const item of orderLists) {
                const productwarehouse = await this.prowareRepo.findById(item.productwarehouse);
                if (!productwarehouse) {
                    return { status: 400, message: "Product in warehouse not found" };
                }
                if (productwarehouse.quantity < item.quantity) {
                    return { status: 400, message: "Not enough quantity" };
                }
                const product = await this.proRepo.findById(productwarehouse.product);
                item.price = productwarehouse.price;
                item.product = product === null || product === void 0 ? void 0 : product._id;
                totalPriceProducts += item.price * item.quantity;
                // totalCost += (productwarehouse.cost || 0) * item.quantity;
            }
            data.orderList = orderLists;
            data.totalCost = totalCost;
            data.totalPriceProducts = totalPriceProducts;
            const result = await this.repository.insert(data);
            return { status: 200, message: "Order created", data: result };
        }
        catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    }
}
exports.OrderController = OrderController;
__decorate([
    (0, method_1.Post)("/checkout", { loginRequired: true }),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({
        schema: zod_1.default.object({
            orderList: zod_1.default.array(zod_1.default.object({
                productwarehouse: controller_1.default.id,
                quantity: zod_1.default.number().positive().default(1),
            })),
        }),
    }))
], OrderController.prototype, "orderCheckout", null);
const order = new OrderController("/order", new repository_1.default());
exports.default = order;
