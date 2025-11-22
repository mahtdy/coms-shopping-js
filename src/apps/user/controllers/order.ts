import OrderRepository from "../../../repositories/admin/order/repository";
import BaseController, {
  ControllerOptions,
} from "../../../core/mongoose-controller/controller";
import Order, { OrderModel } from "../../../repositories/admin/order/model";
import z from "zod";
import ProductRepository from "../../../repositories/admin/product/repository";
import ProductWarehouseRepository from "../../../repositories/admin/productWarehouse/repository";
import { Get, Post } from "../../../core/decorators/method";
import { Response } from "../../../core/controller";
import { Body, Query, User } from "../../../core/decorators/parameters";
import { UserInfo } from "../../../core/mongoose-controller/auth/user/userAuthenticator";
import BasketOrderService, { CheckoutMeta } from "../../services/basketOrderService";
import DeliveryService from "../../services/deliveryService";
import OrderStatusService from "../../services/orderStatusService";

export class OrderController extends BaseController<Order> {
  proRepo: ProductRepository;
  prowareRepo: ProductWarehouseRepository;
  orderRepo: OrderRepository;
  basketOrderService: BasketOrderService;
  deliveryService: DeliveryService;
  orderStatusService: OrderStatusService;
  
  constructor(
    baseRoute: string,
    repo: OrderRepository,
    options?: ControllerOptions
  ) {
    super(baseRoute, repo, options);
    this.orderRepo = new OrderRepository();
    this.proRepo = new ProductRepository();
    this.prowareRepo = new ProductWarehouseRepository();
    // کامنت: استفاده از سرویس مشترک برای تبدیل سبد به سفارش
    this.basketOrderService = new BasketOrderService();
    // کامنت: استفاده از سرویس ارسال برای رهگیری
    this.deliveryService = new DeliveryService();
    // کامنت: استفاده از سرویس مدیریت وضعیت
    this.orderStatusService = new OrderStatusService();
  }
  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi2K3Ys9mGIiwiZmFtaWx5Ijoi2YXYrdmF2K_bjCIsImlkIjoiNjRiOTJiZDliYTI5YWFjZTMxMjliM2RlIiwicGhvbmVOdW1iZXIiOiIwOTM1ODcwMzUzNCIsImVtYWlsIjoiaC5tb2hhbW1hZGkuMjQ3N0BnbWFpbC5jb20iLCJpYXQiOjE3MjY2NDU3ODl9.IMnS_9ACJlV86lu1CI1z39-cd86wWRZ4oI0wmAWE3Jo
  // @PreExec({
  //   method: "delete",
  //   route: "",
  // })
  // async checkBeforeDelete(): Promise<Response> {
  //   console.log("checkBeforeDelete");
  //   return {
  //     // status: 200,
  //     next: true,
  //   };
  // }

  initApis() {
    super.initApis();
  }
  // checkout
  @Post("/checkout", {
    loginRequired: true,
  })
  async orderCheckout(
    @User() user: UserInfo,
    @Body({
      schema: z.object({
        address: BaseController.id.optional(),
        offCode: z.string().optional(),
        sendType: z.number().positive().optional(),
        sendTime: z.number().positive().optional(),
        sendDate: z.number().positive().optional(),
        isBig: z.number().positive().optional(),
        typePeyment: z.number().positive().optional(),
        totalPriceProducts: z.number().positive().optional(),
      }),
    })
    checkoutData: CheckoutMeta
  ): Promise<Response> {
    try {
      // کامنت: بررسی احراز هویت کاربر
      if (!user) {
        return {
          status: 401,
          message: "برای ادامه باید وارد حساب کاربری شوید.",
        };
      }

      // کامنت: آماده‌سازی متادیتای مربوط به پرداخت و ارسال
      const checkoutMeta: CheckoutMeta = {
        address: checkoutData.address,
        offCode: checkoutData.offCode,
        sendType: checkoutData.sendType,
        sendTime: checkoutData.sendTime,
        sendDate: checkoutData.sendDate,
        isBig: checkoutData.isBig,
        typePeyment: checkoutData.typePeyment,
        totalPriceProducts: checkoutData.totalPriceProducts,
      };

      // کامنت: فراخوانی سرویس مشترک برای نهایی کردن سبد و ایجاد سفارش
      return await this.basketOrderService.checkoutFromBasket(user, checkoutMeta);
    } catch (error: any) {
      // کامنت: مدیریت خطاهای احتمالی از سرویس
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
   * توضیح فارسی: رهگیری بسته با کد رهگیری
   */
  @Get("/track", {})
  async trackOrder(
    @Query({destination: "trackingCode", schema: z.string()}) trackingCode: string
  ): Promise<Response> {
    try {
      const trackingResult = await this.deliveryService.trackPackage(trackingCode);

      if (!trackingResult.package) {
        return {
          status: 404,
          message: "بسته با کد رهگیری مشخص شده یافت نشد.",
        };
      }

      return {
        status: 200,
        data: {
          package: trackingResult.package,
          order: trackingResult.order,
          courier: trackingResult.courier,
          estimatedDeliveryTime: trackingResult.estimatedDeliveryTime,
          route: trackingResult.route,
          statusHistory: trackingResult.statusHistory,
        },
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در رهگیری بسته",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت تاریخچه تغییرات وضعیت یک سفارش
   */
  @Get("/:orderId/status-history", {
    loginRequired: true,
  })
  async getOrderStatusHistory(
    @Query({destination: "orderId", schema: BaseController.id}) orderId: string,
    @User() user: UserInfo
  ): Promise<Response> {
    try {
      // کامنت: بررسی اینکه سفارش متعلق به کاربر است
      const order = await this.orderRepo.findById(orderId);
      if (!order) {
        return {
          status: 404,
          message: "سفارش یافت نشد.",
        };
      }

      if (order.user.toString() !== user.id) {
        return {
          status: 403,
          message: "شما دسترسی به این سفارش ندارید.",
        };
      }

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
  //
  // // quantity-increase
  // @Post("/increase")
  // async quantityIncrease(
  //   @User() user: UserInfo,
  //   @Body({
  //     destination: "productwarehouse",
  //     schema: BaseController.id,
  //   })
  //   productwarehouse: string
  //   // @Body({
  //   //   destination: "hash",
  //   //   schema: z.string(),
  //   // })
  //   // hash: string
  // ): Promise<Response> {
  //   try {
  //     var userorder = await this.repository.findOne({
  //       user: user.id as string,
  //     });
  //     if (userorder == null) {
  //       return { status: 404, message: "ID order not found" };
  //     }
  //     const bsktList = userorder?.orderList.find((orderItem: any) => {
  //       return orderItem.productwarehouse.equals(productwarehouse);
  //     });
  //     if (!bsktList) {
  //       return { status: 400, message: "Product in order not found" };
  //     }
  //     let productwarehouseCheck = await this.prowareRepo.findById(
  //       productwarehouse
  //     );
  //     if (!productwarehouseCheck) {
  //       return { status: 400, message: "Product in warehouse not found" };
  //     } else if (productwarehouseCheck.stock < Number(bsktList?.quantity) + 1) {
  //       return { status: 400, message: "Not enough stock" };
  //     }
  //     if (bsktList) {
  //       try {
  //         bsktList.quantity += 1;
  //       } catch (error) {
  //         console.error("Error updating order:", error);
  //       }
  //     }
  //     const result = await OrderModel.findByIdAndUpdate(userorder?._id, {
  //       $set: { orderList: userorder.orderList },
  //     });
  //
  //     if (!result) {
  //       return { status: 404, message: "User order not found" };
  //     }
  //     return { status: 200, message: "Order updated successfully" };
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  //
  // // quantity-decrease
  // @Post("/decrease")
  // // async quantityDecrease(
  // //   @User() user: UserInfo,
  // //   @Body({
  // //     destination: "productwarehouse",
  // //     schema: BaseController.id,
  // //   })
  // //   productwarehouse: string
  // // ): Promise<Response> {
  // //   try {
  // //     var userorder = await this.repository.findOne({
  // //       user: user.id as string,
  // //     });
  // //     if (userorder == null) {
  // //       return { status: 404, message: "ID order not found" };
  // //     }
  // //     const bsktList = userorder?.orderList.find((orderItem: any) => {
  // //       return orderItem.productwarehouse.equals(productwarehouse);
  // //     });
  // //     if (!bsktList) {
  // //       return { status: 400, message: "Product in order not found" };
  // //     }
  // //     let productwarehouseCheck = await this.prowareRepo.findById(
  // //       productwarehouse
  // //     );
  // //     if (!productwarehouseCheck) {
  // //       return { status: 400, message: "Product in warehouse not found" };
  // //     } else if (0 >= Number(bsktList?.quantity)) {
  // //       pull(userorder.orderList, bsktList);
  // //       const result = await OrderModel.findByIdAndUpdate(userorder?._id, {
  // //         $set: { orderList: userorder.orderList },
  // //       });
  // //       return { status: 400, message: "Not wwwwww enough stock" };
  // //     }
  // //     if (bsktList) {
  // //       try {
  // //         bsktList.quantity -= 1;
  // //       } catch (error) {
  // //         console.error("Error updating order:", error);
  // //       }
  // //     }
  // //     const result = await OrderModel.findByIdAndUpdate(userorder?._id, {
  // //       $set: { orderList: userorder.orderList },
  // //     });
  //
  // //     if (!result) {
  // //       return { status: 404, message: "User order not found" };
  // //     }
  // //     return { status: 200, message: "Order updated successfully" };
  // //   } catch (error) {
  // //     throw error;
  // //   }
  // // }
  // async push(
  //   @Body({
  //     destination: "id",
  //     schema: BaseController.id,
  //   })
  //   id: string,
  //   @Body({
  //     destination: "field",
  //     schema: z.string(),
  //   })
  //   field: string
  // ) {
  //   return this.editById(id, {
  //     $set: {
  //       product: field,
  //     },
  //   });
  // }
  //
  // // async deleteByPhone(
  // //   @Body({ destination: "phone", schema: z.string() }) phone: string
  // // ): Promise<Response> {
  // //   try {
  // //     await this.repository.findOneAndDelete({
  // //       "info.userInfo.phoneNumber": phone,
  // //     });
  // //     return {
  // //       status: 200,
  // //       data: {},
  // //     };
  // //   } catch (error) {
  // //     throw error;
  // //   }
  // // }
  // کامنت: متد create که قبلا استفاده می‌شد، حالا از BasketOrderService استفاده می‌کنیم
  // async create(data: Order, @User() user: UserInfo): Promise<Response> {
  //   let userorder = await this.orderRepo.findOne({ user: user.id as string });
  //   if (userorder == null) {
  //     return this.createNewOrder(data, user.id);
  //   } else {
  //     return this.updateExistingOrder(data, userorder);
  //   }
  // }

  // کامنت: متد createNewOrder که قبلا استفاده می‌شد، حالا منطق آن در BasketOrderService است
  // private async createNewOrder(
  //   data: Order,
  //   userId: string
  // ): Promise<Response> {
  //   // کد قدیمی که مستقیما سفارش را ایجاد می‌کرد
  //   return { status: 200, message: "its order" };
  // }

  // کامنت: متد updateExistingOrder که قبلا استفاده می‌شد، حالا منطق آن در BasketOrderService است
  // private async updateExistingOrder(
  //   data: Order,
  //   userorder: any
  // ): Promise<Response> {
  //   // کد قدیمی که مستقیما سفارش را به‌روزرسانی می‌کرد
  //   return { status: 200, message: "Order updated successfully" };
  // }
}

const order = new OrderController("/order", new OrderRepository(), {
  insertSchema: z.object({
    // product: BaseController.id,
    // orderList: z.array(
    //   z.object({
    //     productwarehouse: BaseController.id.optional(),
    //     // user: BaseController.id,
    //     // price: ,
    //     quantity: z.coerce.number().positive().int().default(1),
    //   })
    // ),
  }),
  apiDoc: {
    security: [
      {
        BasicAuth: [],
      },
    ],
  },
});

export default order;
