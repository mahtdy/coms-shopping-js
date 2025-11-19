import OrderRepository from "../../../repositories/admin/order/repository";
import BaseController from "../../../core/mongoose-controller/controller";
import {Response} from "../../../core/controller";

import {Post, Put, Get} from "../../../core/decorators/method";
import {Body, User, Query, Admin} from "../../../core/decorators/parameters";
import {UserInfo} from "../../../core/mongoose-controller/auth/user/userAuthenticator";
import {AdminInfo} from "../../../core/mongoose-controller/auth/admin/admin-logIn";
import Order from "../../../repositories/admin/order/model";
import {DiscountController} from "./discount";
import z from "zod";
import DiscountRepository from "../../../repositories/admin/discount/repository";
import BasketOrderService from "../../services/basketOrderService";
import OrderStatusService from "../../services/orderStatusService";


export class OrderController extends BaseController<Order> {
    discountController: DiscountController;
    basketOrderService: BasketOrderService;
    orderStatusService: OrderStatusService;

    constructor(baseRoute: string, repo: OrderRepository) {
        super(baseRoute, repo);
        this.discountController = new DiscountController("/discount", new DiscountRepository());
        this.basketOrderService = new BasketOrderService();
        this.orderStatusService = new OrderStatusService();
    }

    @Post("/checkout", {loginRequired: true})
    async orderCheckout(
        @User() user: UserInfo,
        @Body({
            schema: z.object({
                orderList: z.array(
                    z.object({
                        productwarehouse: BaseController.id,
                        quantity: z.number().positive().default(1),
                    })
                ),
            }),
        })
        data: Order
    ): Promise<Response> {
        try {
            const serviceResult = await this.basketOrderService.createOrderFromList(
                user.id,
                data.orderList
            );

            const orderId = serviceResult.order._id;
            const discountResult = await this.discountController.generateDiscountAfterInvoice(user, {orderId});

            return {
                status: 200,
                message: "Order created and discount generated",
                data: {
                    order: serviceResult.order,
                    discount: discountResult.data,
                    payment: serviceResult.paymentIntent,
                    totals: serviceResult.totals,
                },
            };
        } catch (error: any) {
            if (error?.status) {
                return {
                    status: error.status,
                    message: error.message,
                };
            }
            throw error;
        }
    }

    // نسخه قبلی متد createNewOrder به شکل زیر بوده است:
    /*
    private async createNewOrder(data: Order, userId: string): Promise<Response> {
        try {
            data.user = userId;
            let totalCost = 0;
            let totalPriceProducts = 0;

            const orderLists = data.orderList;
            for (const item of orderLists) {
                const productwarehouse = await this.prowareRepo.findById(item.productwarehouse as string);
                if (!productwarehouse) {
                    return {status: 400, message: "Product in warehouse not found"};
                }
                if (productwarehouse.quantity < item.quantity) {
                    return {status: 400, message: "Not enough quantity"};
                }
                const product = await this.proRepo.findById(productwarehouse.product as string);
                item.price = productwarehouse.price;
                item.product = product?._id;
                totalPriceProducts += item.price * item.quantity;
            }

            data.orderList = orderLists;
            data.totalCost = totalCost;
            data.totalPriceProducts = totalPriceProducts;

            const result = await this.repository.insert(data);
            return {status: 200, message: "Order created", data: result};
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    }
    */

    /**
     * توضیح فارسی: تغییر وضعیت سفارش (برای ادمین)
     */
    @Put("/:orderId/status", {})
    async changeOrderStatus(
        @Query({destination: "orderId", schema: BaseController.id}) orderId: string,
        @Admin() admin: AdminInfo,
        @Body({
            schema: z.object({
                newStatus: z.enum(["pending", "confirmed", "processing", "completed", "cancelled"]),
                reason: z.string().optional(),
                notes: z.string().optional(),
                sendNotification: z.boolean().default(true),
            }),
        })
        data: {
            newStatus: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
            reason?: string;
            notes?: string;
            sendNotification?: boolean;
        }
    ): Promise<Response> {
        try {
            const result = await this.orderStatusService.changeOrderStatus({
                orderId,
                newStatus: data.newStatus,
                changedBy: admin.id,
                reason: data.reason,
                notes: data.notes,
                sendNotification: data.sendNotification !== false,
            });

            return {
                status: 200,
                message: "وضعیت سفارش با موفقیت تغییر کرد.",
                data: result,
            };
        } catch (error: any) {
            if (error?.status) {
                return {
                    status: error.status,
                    message: error.message,
                };
            }
            throw error;
        }
    }

    /**
     * توضیح فارسی: دریافت تاریخچه تغییرات وضعیت یک سفارش (برای ادمین)
     */
    @Get("/:orderId/status-history", {})
    async getOrderStatusHistory(
        @Query({destination: "orderId", schema: BaseController.id}) orderId: string
    ): Promise<Response> {
        try {
            const history = await this.orderStatusService.getOrderStatusHistory(orderId);

            return {
                status: 200,
                data: history,
            };
        } catch (error: any) {
            return {
                status: 500,
                message: error.message || "خطا در دریافت تاریخچه وضعیت",
            };
        }
    }

    /**
     * توضیح فارسی: لغو سفارش (برای ادمین)
     */
    @Post("/:orderId/cancel", {})
    async cancelOrder(
        @Query({destination: "orderId", schema: BaseController.id}) orderId: string,
        @Admin() admin: AdminInfo,
        @Body({
            schema: z.object({
                reason: z.string(),
            }),
        })
        data: { reason: string }
    ): Promise<Response> {
        try {
            const result = await this.orderStatusService.cancelOrder(
                orderId,
                data.reason,
                admin.id
            );

            return {
                status: 200,
                message: "سفارش با موفقیت لغو شد.",
                data: result,
            };
        } catch (error: any) {
            if (error?.status) {
                return {
                    status: error.status,
                    message: error.message,
                };
            }
            throw error;
        }
    }

    /**
     * توضیح فارسی: همگام‌سازی وضعیت سفارش با وضعیت ارسال
     */
    @Post("/:orderId/sync-delivery-status", {})
    async syncDeliveryStatus(
        @Query({destination: "orderId", schema: BaseController.id}) orderId: string
    ): Promise<Response> {
        try {
            await this.orderStatusService.syncStatusWithDelivery(orderId);

            return {
                status: 200,
                message: "وضعیت سفارش با وضعیت ارسال همگام‌سازی شد.",
            };
        } catch (error: any) {
            return {
                status: 500,
                message: error.message || "خطا در همگام‌سازی وضعیت",
            };
        }
    }
}

const order = new OrderController("/order", new OrderRepository());
export default order;