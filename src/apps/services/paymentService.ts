import { Response } from "../../core/controller";
import Order from "../../repositories/admin/order/model";
import { UserInfo } from "../../core/mongoose-controller/auth/user/userAuthenticator";

/**
 * توضیح فارسی: اینترفیس برای اطلاعات پرداخت که از درگاه دریافت می‌شود.
 */
export interface PaymentIntent {
  provider: string; // نام درگاه پرداخت (zarinpal, idpay, ...)
  referenceId: string; // شناسه مرجع پرداخت
  transactionId?: string; // شناسه تراکنش (در صورت وجود)
  redirectUrl: string; // آدرس هدایت به درگاه
  amount: number; // مبلغ پرداخت
  status: "pending" | "completed" | "failed" | "cancelled"; // وضعیت پرداخت
  callbackUrl?: string; // آدرس بازگشت از درگاه
  description?: string; // توضیحات پرداخت
  meta?: any; // اطلاعات اضافی
}

/**
 * توضیح فارسی: اینترفیس برای نتیجه پرداخت که از درگاه بازگشت داده می‌شود.
 */
export interface PaymentResult {
  success: boolean;
  referenceId: string;
  transactionId?: string;
  amount: number;
  status: "completed" | "failed" | "cancelled";
  message?: string;
  errorCode?: string;
}

/**
 * توضیح فارسی: اینترفیس برای تنظیمات درگاه پرداخت.
 */
export interface PaymentGatewayConfig {
  apiKey: string;
  merchantId?: string;
  sandbox?: boolean; // حالت تست/واقعی
  callbackUrl: string;
  description?: string;
}

/**
 * توضیح فارسی: اینترفیس پایه برای درگاه‌های پرداخت.
 */
export interface IPaymentGateway {
  /**
   * شروع فرآیند پرداخت و دریافت لینک هدایت به درگاه
   */
  initiatePayment(
    order: Order,
    amount: number,
    user: UserInfo,
    config: PaymentGatewayConfig
  ): Promise<PaymentIntent>;

  /**
   * بررسی وضعیت پرداخت پس از بازگشت از درگاه
   */
  verifyPayment(
    referenceId: string,
    transactionId?: string,
    config: PaymentGatewayConfig
  ): Promise<PaymentResult>;

  /**
   * لغو پرداخت
   */
  cancelPayment(
    referenceId: string,
    config: PaymentGatewayConfig
  ): Promise<boolean>;
}

/**
 * توضیح فارسی: پیاده‌سازی تستی درگاه پرداخت (برای توسعه و تست).
 * این کلاس در آینده باید با درگاه واقعی جایگزین شود.
 */
class MockPaymentGateway implements IPaymentGateway {
  async initiatePayment(
    order: Order,
    amount: number,
    user: UserInfo,
    config: PaymentGatewayConfig
  ): Promise<PaymentIntent> {
    // کامنت: در حالت تستی، یک شناسه مرجع تصادفی تولید می‌کنیم
    const referenceId = `MOCK-${order._id}-${Date.now()}`;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      provider: "mock-gateway",
      referenceId,
      transactionId,
      redirectUrl: config.callbackUrl || `https://gateway.test/pay/${referenceId}`,
      amount,
      status: "pending",
      description: config.description || `پرداخت سفارش ${order._id}`,
      callbackUrl: config.callbackUrl,
      meta: {
        orderId: order._id,
        userId: user.id,
      },
    };
  }

  async verifyPayment(
    referenceId: string,
    transactionId?: string,
    config?: PaymentGatewayConfig
  ): Promise<PaymentResult> {
    // کامنت: در حالت تستی، همیشه موفق برمی‌گردانیم
    return {
      success: true,
      referenceId,
      transactionId: transactionId || `TXN-${Date.now()}`,
      amount: 0, // باید از دیتابیس خوانده شود
      status: "completed",
      message: "پرداخت با موفقیت انجام شد (تست)",
    };
  }

  async cancelPayment(
    referenceId: string,
    config?: PaymentGatewayConfig
  ): Promise<boolean> {
    // کامنت: در حالت تستی، همیشه موفق برمی‌گردانیم
    return true;
  }
}

/**
 * توضیح فارسی: کلاس اصلی سرویس پرداخت که با درگاه‌های مختلف کار می‌کند.
 * در حال حاضر از MockPaymentGateway استفاده می‌کند، اما می‌تواند به درگاه واقعی تغییر کند.
 */
export default class PaymentService {
  private gateway: IPaymentGateway;
  private config: PaymentGatewayConfig;

  constructor(gateway?: IPaymentGateway) {
    // کامنت: اگر درگاه مشخص نشده باشد، از درگاه تستی استفاده می‌کنیم
    this.gateway = gateway || new MockPaymentGateway();
    
    // کامنت: تنظیمات پیش‌فرض (باید از .env خوانده شود)
    this.config = {
      apiKey: process.env.PAYMENT_API_KEY || "test-api-key",
      merchantId: process.env.PAYMENT_MERCHANT_ID,
      sandbox: process.env.PAYMENT_SANDBOX === "true" || true, // پیش‌فرض: تستی
      callbackUrl: process.env.PAYMENT_CALLBACK_URL || "http://localhost:7000/user/payment/callback",
      description: "پرداخت سفارش",
    };
  }

  /**
   * توضیح فارسی: شروع فرآیند پرداخت برای یک سفارش.
   */
  async initiatePayment(
    order: Order,
    amount: number,
    user: UserInfo,
    customConfig?: Partial<PaymentGatewayConfig>
  ): Promise<PaymentIntent> {
    const finalConfig = { ...this.config, ...customConfig };
    
    try {
      const paymentIntent = await this.gateway.initiatePayment(
        order,
        amount,
        user,
        finalConfig
      );

      // کامنت: در اینجا می‌توانیم اطلاعات پرداخت را در دیتابیس ذخیره کنیم
      // await this.savePaymentRecord(order, paymentIntent);

      return paymentIntent;
    } catch (error: any) {
      throw {
        status: 500,
        message: `خطا در اتصال به درگاه پرداخت: ${error.message}`,
      };
    }
  }

  /**
   * توضیح فارسی: بررسی وضعیت پرداخت پس از بازگشت از درگاه.
   */
  async verifyPayment(
    referenceId: string,
    transactionId?: string
  ): Promise<PaymentResult> {
    try {
      const result = await this.gateway.verifyPayment(
        referenceId,
        transactionId,
        this.config
      );

      // کامنت: در اینجا می‌توانیم وضعیت سفارش را به‌روزرسانی کنیم
      // if (result.success) {
      //   await this.updateOrderStatus(orderId, "paid");
      // }

      return result;
    } catch (error: any) {
      return {
        success: false,
        referenceId,
        amount: 0,
        status: "failed",
        message: `خطا در بررسی پرداخت: ${error.message}`,
        errorCode: "VERIFY_ERROR",
      };
    }
  }

  /**
   * توضیح فارسی: لغو پرداخت.
   */
  async cancelPayment(referenceId: string): Promise<boolean> {
    try {
      return await this.gateway.cancelPayment(referenceId, this.config);
    } catch (error) {
      console.error("خطا در لغو پرداخت:", error);
      return false;
    }
  }

  /**
   * توضیح فارسی: تنظیم درگاه پرداخت (برای تغییر از تستی به واقعی).
   */
  setGateway(gateway: IPaymentGateway): void {
    this.gateway = gateway;
  }

  /**
   * توضیح فارسی: به‌روزرسانی تنظیمات درگاه.
   */
  updateConfig(config: Partial<PaymentGatewayConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

