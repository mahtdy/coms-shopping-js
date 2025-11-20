import OrderRepository from "../../repositories/admin/order/repository";
import OrderStatusHistoryRepository from "../../repositories/admin/orderStatusHistory/repository";
import Order from "../../repositories/admin/order/model";
import { AdminInfo } from "../../core/mongoose-controller/auth/admin/admin-logIn";
import NotificationMessager from "../../core/messaging/notification";
import SmsMessager from "../../core/messaging/smsMessager";
import { UserModel } from "../../core/mongoose-controller/repositories/user/model";

/**
 * توضیح فارسی: نوع وضعیت سفارش
 */
export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";

/**
 * توضیح فارسی: گزینه‌های تغییر وضعیت
 */
export interface ChangeStatusOptions {
  orderId: string;
  newStatus: OrderStatus;
  changedBy?: string; // شناسه ادمین یا "system"
  reason?: string;
  notes?: string;
  sendNotification?: boolean; // کامنت: آیا اعلان ارسال شود
  ipAddress?: string; // کامنت: آدرس IP درخواست کننده
  userAgent?: string; // کامنت: User Agent مرورگر/اپلیکیشن
  metadata?: Record<string, any>; // کامنت: اطلاعات اضافی
  isAutomatic?: boolean; // کامنت: آیا تغییر به صورت خودکار انجام شده است
}

/**
 * توضیح فارسی: نتیجه تغییر وضعیت
 */
export interface StatusChangeResult {
  order: Order;
  oldStatus?: OrderStatus;
  newStatus: OrderStatus;
  historyRecord: any; // OrderStatusHistory
  notificationSent: boolean;
}

/**
 * توضیح فارسی: سرویس مدیریت وضعیت سفارش
 * این سرویس تغییرات وضعیت را مدیریت می‌کند، تاریخچه ثبت می‌کند و اعلان‌ها را ارسال می‌کند.
 */
export default class OrderStatusService {
  private orderRepo: OrderRepository;
  private historyRepo: OrderStatusHistoryRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.historyRepo = new OrderStatusHistoryRepository();
  }

  /**
   * توضیح فارسی: تغییر وضعیت سفارش
   * @param options گزینه‌های تغییر وضعیت
   * @returns نتیجه تغییر وضعیت
   */
  async changeOrderStatus(options: ChangeStatusOptions): Promise<StatusChangeResult> {
    const {
      orderId,
      newStatus,
      changedBy,
      reason,
      notes,
      sendNotification = true,
      ipAddress,
      userAgent,
      metadata,
      isAutomatic = false,
    } = options;

    // کامنت: دریافت سفارش
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw {
        status: 404,
        message: "سفارش یافت نشد.",
      };
    }

    const oldStatus = (order.orderStatus as OrderStatus) || "pending";

    // کامنت: بررسی تغییر واقعی وضعیت
    if (oldStatus === newStatus) {
      throw {
        status: 400,
        message: "وضعیت سفارش تغییر نکرده است.",
      };
    }

    // کامنت: اعتبارسنجی تغییر وضعیت (مثلاً نمی‌توان از completed به pending رفت)
    if (!this.isValidStatusTransition(oldStatus, newStatus)) {
      throw {
        status: 400,
        message: `تغییر وضعیت از ${oldStatus} به ${newStatus} مجاز نیست.`,
      };
    }

    // کامنت: محاسبه مدت زمان در وضعیت قبلی
    let duration: number | undefined;
    if (oldStatus) {
      const lastHistory = await this.historyRepo.getLastStatusChange(orderId);
      if (lastHistory && lastHistory.timestamp) {
        duration = Date.now() - new Date(lastHistory.timestamp).getTime();
      }
    }

    // کامنت: به‌روزرسانی وضعیت سفارش
    const updatedOrder = await this.orderRepo.editById(orderId, {
      $set: {
        orderStatus: newStatus,
      },
    });

    if (!updatedOrder) {
      throw {
        status: 500,
        message: "خطا در به‌روزرسانی وضعیت سفارش.",
      };
    }

    // کامنت: ثبت تاریخچه کامل با تمام اطلاعات
    const historyData: any = {
      order: orderId,
      oldStatus,
      newStatus,
      changedBy: changedBy || "system",
      reason,
      notes,
      timestamp: new Date(),
      isAutomatic,
    };

    // کامنت: افزودن فیلدهای اختیاری
    if (ipAddress) historyData.ipAddress = ipAddress;
    if (userAgent) historyData.userAgent = userAgent;
    if (duration !== undefined) historyData.duration = duration;
    if (metadata) historyData.metadata = metadata;

    const historyRecord = await this.historyRepo.create(historyData);

    // کامنت: ارسال اعلان
    let notificationSent = false;
    if (sendNotification) {
      try {
        await this.sendStatusChangeNotification(order, oldStatus, newStatus);
        notificationSent = true;
      } catch (error: any) {
        console.error("خطا در ارسال اعلان:", error);
        // کامنت: خطای اعلان نباید باعث شکست تغییر وضعیت شود
      }
    }

    return {
      order: updatedOrder,
      oldStatus,
      newStatus,
      historyRecord,
      notificationSent,
    };
  }

  /**
   * توضیح فارسی: بررسی اعتبار تغییر وضعیت
   */
  private isValidStatusTransition(
    oldStatus: OrderStatus,
    newStatus: OrderStatus
  ): boolean {
    // کامنت: تعریف قوانین تغییر وضعیت
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["completed", "cancelled"],
      completed: [], // کامنت: از completed نمی‌توان به جای دیگری رفت
      cancelled: [], // کامنت: از cancelled نمی‌توان به جای دیگری رفت
    };

    return validTransitions[oldStatus].includes(newStatus);
  }

  /**
   * توضیح فارسی: ثبت تاریخچه بدون تغییر وضعیت (برای ثبت اولیه)
   * @param session MongoDB Session برای Transaction (اختیاری)
   */
  async recordInitialStatus(
    orderId: string,
    status: OrderStatus,
    reason?: string,
    session?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const historyData: any = {
      order: orderId,
      oldStatus: undefined,
      newStatus: status,
      changedBy: "system",
      reason: reason || "ثبت سفارش جدید",
      timestamp: new Date(),
      isAutomatic: true,
    };

    // کامنت: افزودن metadata در صورت وجود
    if (metadata) {
      historyData.metadata = metadata;
    }
    
    if (session) {
      await this.historyRepo.collection.create([historyData], { session });
    } else {
      await this.historyRepo.create(historyData);
    }
  }

  /**
   * توضیح فارسی: ارسال اعلان تغییر وضعیت
   */
  async sendStatusChangeNotification(
    order: Order,
    oldStatus: OrderStatus | undefined,
    newStatus: OrderStatus
  ): Promise<void> {
    // کامنت: دریافت اطلاعات کاربر
    const user = await UserModel.findById(order.user);
    if (!user) {
      return; // کامنت: اگر کاربر یافت نشد، اعلان ارسال نمی‌کنیم
    }

    // کامنت: پیام‌های مختلف برای هر تغییر وضعیت
    const statusMessages: Record<OrderStatus, { title: string; message: string }> = {
      pending: {
        title: "سفارش شما ثبت شد",
        message: `سفارش شما با شماره ${order.orderNumber || order._id} با موفقیت ثبت شد.`,
      },
      confirmed: {
        title: "سفارش شما تایید شد",
        message: `سفارش شما با شماره ${order.orderNumber || order._id} تایید شد و در حال آماده‌سازی است.`,
      },
      processing: {
        title: "سفارش شما در حال پردازش است",
        message: `سفارش شما با شماره ${order.orderNumber || order._id} در حال پردازش است.`,
      },
      completed: {
        title: "سفارش شما تکمیل شد",
        message: `سفارش شما با شماره ${order.orderNumber || order._id} با موفقیت تکمیل شد.`,
      },
      cancelled: {
        title: "سفارش شما لغو شد",
        message: `متاسفانه سفارش شما با شماره ${order.orderNumber || order._id} لغو شد.`,
      },
    };

    const message = statusMessages[newStatus];

    // کامنت: ارسال SMS
    try {
      await SmsMessager.send({
        receptor: user.phoneNumber,
        template: "orderStatusChange", // کامنت: باید template در سیستم تعریف شود
        parameters: {
          name: user.name,
          family: user.family,
          orderNumber: order.orderNumber || order._id.toString(),
          status: this.getStatusPersianName(newStatus),
          message: message.message,
        },
      });
    } catch (error: any) {
      console.error("خطا در ارسال SMS:", error);
    }

    // کامنت: ارسال Push Notification (در صورت وجود)
    if (user.notificationTokens && user.notificationTokens.length > 0) {
      try {
        for (const tokenConfig of user.notificationTokens) {
          // کامنت: فقط web-push notifications را ارسال می‌کنیم
          if (tokenConfig.type === "web-push" && tokenConfig.config) {
            await NotificationMessager.send({
              template: "orderStatusChange",
              receptor: tokenConfig, // کامنت: باید شامل domain, type, config باشد
              parameters: {
                title: message.title,
                message: message.message,
                orderNumber: order.orderNumber || order._id.toString(),
              },
              url: `/user/order/${order._id}`, // کامنت: لینک به صفحه سفارش
            });
          }
        }
      } catch (error: any) {
        console.error("خطا در ارسال Push Notification:", error);
      }
    }
  }

  /**
   * توضیح فارسی: دریافت نام فارسی وضعیت
   */
  private getStatusPersianName(status: OrderStatus): string {
    const names: Record<OrderStatus, string> = {
      pending: "در انتظار",
      confirmed: "تایید شده",
      processing: "در حال پردازش",
      completed: "تکمیل شده",
      cancelled: "لغو شده",
    };
    return names[status];
  }

  /**
   * توضیح فارسی: دریافت تاریخچه تغییرات وضعیت یک سفارش
   */
  async getOrderStatusHistory(orderId: string) {
    return this.historyRepo.getOrderHistory(orderId);
  }

  /**
   * توضیح فارسی: تغییر خودکار وضعیت بر اساس deliveryStatus
   * این متد وضعیت سفارش را بر اساس وضعیت ارسال به‌روزرسانی می‌کند
   */
  async syncStatusWithDelivery(orderId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      return;
    }

    const deliveryStatus = order.deliveryStatus;
    let newOrderStatus: OrderStatus | null = null;

    // کامنت: نگاشت deliveryStatus به orderStatus
    if (deliveryStatus === "delivered") {
      newOrderStatus = "completed";
    } else if (deliveryStatus === "failed") {
      newOrderStatus = "cancelled";
    } else if (deliveryStatus === "assigned" || deliveryStatus === "in_transit") {
      newOrderStatus = "processing";
    } else if (deliveryStatus === "preparing") {
      newOrderStatus = "confirmed";
    }

    // کامنت: اگر وضعیت باید تغییر کند
    if (newOrderStatus && order.orderStatus !== newOrderStatus) {
      await this.changeOrderStatus({
        orderId,
        newStatus: newOrderStatus,
        changedBy: "system",
        reason: "تغییر خودکار بر اساس وضعیت ارسال",
        sendNotification: true,
      });
    }
  }

  /**
   * توضیح فارسی: تایید خودکار سفارش (پس از پرداخت موفق)
   */
  async confirmOrderAfterPayment(orderId: string): Promise<StatusChangeResult> {
    return this.changeOrderStatus({
      orderId,
      newStatus: "confirmed",
      changedBy: "system",
      reason: "تایید خودکار پس از پرداخت موفق",
      sendNotification: true,
    });
  }

  /**
   * توضیح فارسی: لغو سفارش
   */
  async cancelOrder(
    orderId: string,
    reason: string,
    changedBy?: string
  ): Promise<StatusChangeResult> {
    return this.changeOrderStatus({
      orderId,
      newStatus: "cancelled",
      changedBy: changedBy || "system",
      reason,
      sendNotification: true,
    });
  }
}

