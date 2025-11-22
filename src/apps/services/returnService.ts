import OrderReturnRepository from "../../repositories/admin/orderReturn/repository";
import OrderRepository from "../../repositories/admin/order/repository";
import InventoryService from "./inventoryService";
import PaymentService from "./paymentService";
import OrderReturn from "../../repositories/admin/orderReturn/model";
import Order from "../../repositories/admin/order/model";
import { Types } from "mongoose";

/**
 * توضیح فارسی: گزینه‌های ایجاد درخواست بازگشت
 */
export interface CreateReturnRequest {
  orderId: string;
  userId: string;
  items: Array<{
    product: string;
    productwarehouse: string;
    quantity: number;
    reason: string;
  }>;
  reason: string;
  userNotes?: string;
}

/**
 * توضیح فارسی: سرویس مدیریت بازگشت کالا
 */
export default class ReturnService {
  private returnRepo: OrderReturnRepository;
  private orderRepo: OrderRepository;
  private inventoryService: InventoryService;
  private paymentService: PaymentService;

  constructor() {
    this.returnRepo = new OrderReturnRepository();
    this.orderRepo = new OrderRepository();
    this.inventoryService = new InventoryService();
    this.paymentService = new PaymentService();
  }

  /**
   * توضیح فارسی: ایجاد درخواست بازگشت کالا
   */
  async createReturnRequest(data: CreateReturnRequest): Promise<OrderReturn> {
    // کامنت: بررسی وجود سفارش
    const order = await this.orderRepo.findById(data.orderId);
    if (!order) {
      throw {
        status: 404,
        message: "سفارش یافت نشد.",
      };
    }

    // کامنت: بررسی اینکه سفارش متعلق به کاربر است
    if (order.user.toString() !== data.userId) {
      throw {
        status: 403,
        message: "شما مجاز به بازگشت این سفارش نیستید.",
      };
    }

    // کامنت: بررسی وضعیت سفارش (فقط سفارش‌های تکمیل شده قابل بازگشت هستند)
    if (order.orderStatus !== "completed") {
      throw {
        status: 400,
        message: "فقط سفارش‌های تکمیل شده قابل بازگشت هستند.",
      };
    }

    // کامنت: بررسی اینکه قبلاً درخواست بازگشت برای این سفارش وجود ندارد
    const existingReturn = await this.returnRepo.findOne({
      order: data.orderId,
      status: { $in: ["pending", "approved", "processing"] },
    });

    if (existingReturn) {
      throw {
        status: 400,
        message: "درخواست بازگشت فعال برای این سفارش وجود دارد.",
      };
    }

    // کامنت: محاسبه مبلغ بازگشت
    let refundAmount = 0;
    const returnItems: any[] = [];

    for (const item of data.items) {
      // کامنت: بررسی اینکه محصول در سفارش وجود دارد
      const orderItem = order.orderList.find(
        (oi) =>
          oi.product.toString() === item.product &&
          oi.productwarehouse.toString() === item.productwarehouse
      );

      if (!orderItem) {
        throw {
          status: 400,
          message: `محصول با شناسه ${item.product} در سفارش یافت نشد.`,
        };
      }

      // کامنت: بررسی تعداد
      if (item.quantity > orderItem.quantity) {
        throw {
          status: 400,
          message: `تعداد درخواستی بیشتر از تعداد سفارش است.`,
        };
      }

      refundAmount += orderItem.price * item.quantity;

      returnItems.push({
        product: item.product,
        productwarehouse: item.productwarehouse,
        quantity: item.quantity,
        price: orderItem.price,
        reason: item.reason,
      });
    }

    // کامنت: ایجاد درخواست بازگشت
    const returnRequest = await this.returnRepo.insert({
      order: data.orderId,
      user: data.userId,
      items: returnItems,
      reason: data.reason,
      status: "pending",
      refundAmount,
      refundStatus: "pending",
      userNotes: data.userNotes,
    } as any);

    return returnRequest;
  }

  /**
   * توضیح فارسی: تایید درخواست بازگشت
   */
  async approveReturn(
    returnId: string,
    adminId: string,
    adminNotes?: string
  ): Promise<OrderReturn> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) {
      throw {
        status: 404,
        message: "درخواست بازگشت یافت نشد.",
      };
    }

    if (returnRequest.status !== "pending") {
      throw {
        status: 400,
        message: "فقط درخواست‌های در انتظار تایید قابل تایید هستند.",
      };
    }

    // کامنت: به‌روزرسانی وضعیت
    const updated = await this.returnRepo.editById(returnId, {
      $set: {
        status: "approved",
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes,
      },
    });

    // کامنت: بازگشت موجودی به انبار
    for (const item of returnRequest.items) {
      await this.inventoryService.adjustStock({
        productId: item.product.toString(),
        warehouseId: item.productwarehouse.toString(),
        quantityDelta: item.quantity,
        changeType: "return",
        reason: `بازگشت کالا - درخواست ${returnId}`,
      });
    }

    return updated as OrderReturn;
  }

  /**
   * توضیح فارسی: رد درخواست بازگشت
   */
  async rejectReturn(
    returnId: string,
    adminId: string,
    adminNotes: string
  ): Promise<OrderReturn> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) {
      throw {
        status: 404,
        message: "درخواست بازگشت یافت نشد.",
      };
    }

    if (returnRequest.status !== "pending") {
      throw {
        status: 400,
        message: "فقط درخواست‌های در انتظار تایید قابل رد هستند.",
      };
    }

    const updated = await this.returnRepo.editById(returnId, {
      $set: {
        status: "rejected",
        rejectedAt: new Date(),
        adminNotes,
      },
    });

    return updated as OrderReturn;
  }

  /**
   * توضیح فارسی: پردازش بازگشت وجه
   */
  async processRefund(returnId: string): Promise<OrderReturn> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) {
      throw {
        status: 404,
        message: "درخواست بازگشت یافت نشد.",
      };
    }

    if (returnRequest.status !== "approved") {
      throw {
        status: 400,
        message: "فقط درخواست‌های تایید شده قابل پردازش هستند.",
      };
    }

    // کامنت: به‌روزرسانی وضعیت بازگشت وجه
    await this.returnRepo.editById(returnId, {
      $set: {
        refundStatus: "processing",
        status: "processing",
      },
    });

    try {
      // کامنت: در اینجا باید با درگاه پرداخت ارتباط برقرار کنیم
      // برای بازگشت وجه به حساب کاربر
      // در حال حاضر فقط وضعیت را به completed تغییر می‌دهیم
      // TODO: پیاده‌سازی بازگشت وجه واقعی

      const updated = await this.returnRepo.editById(returnId, {
        $set: {
          refundStatus: "completed",
          status: "completed",
          completedAt: new Date(),
        },
      });

      return updated as OrderReturn;
    } catch (error: any) {
      // کامنت: در صورت خطا، وضعیت را به failed تغییر می‌دهیم
      await this.returnRepo.editById(returnId, {
        $set: {
          refundStatus: "failed",
        },
      });

      throw {
        status: 500,
        message: "خطا در پردازش بازگشت وجه.",
        error,
      };
    }
  }

  /**
   * توضیح فارسی: دریافت درخواست‌های بازگشت یک کاربر
   */
  async getUserReturns(userId: string, filters?: { status?: string; limit?: number; skip?: number }) {
    return this.returnRepo.getUserReturns(userId, filters);
  }

  /**
   * توضیح فارسی: دریافت درخواست بازگشت
   */
  async getReturn(returnId: string): Promise<OrderReturn | null> {
    return this.returnRepo.findById(returnId);
  }
}

